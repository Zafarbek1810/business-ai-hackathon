import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MockAIProvider } from '../ai/providers/mock-ai.provider';
import { OpenAIProvider } from '../ai/providers/openai.provider';
import { AIProvider } from '../ai/ai.types';
import { marketResearchSchema } from './market-research.types';
import { webSearch } from './web-search.util';

const CATEGORY_LABELS_UZ: Record<string, string> = {
  GROCERY: 'oziq-ovqat do’koni',
  CLOTHING: 'kiyim-kechak do’koni',
  RESTAURANT: 'restoran',
  COFFEE_SHOP: 'qahvaxona',
  PHARMACY: 'dorixona',
  ELECTRONICS: 'elektronika do’koni',
  BEAUTY: 'go’zallik saloni',
  EDUCATION: 'ta’lim markazi',
  AGRICULTURE: 'qishloq xo’jaligi',
  CONSTRUCTION: 'qurilish materiallari do’koni',
  SERVICES: 'xizmat ko’rsatish',
  ECOMMERCE: 'onlayn do’kon',
  OTHER: 'do’kon',
};

@Injectable()
export class MarketResearchService {
  private readonly logger = new Logger(MarketResearchService.name);
  private readonly provider: AIProvider;
  private readonly fallback = new MockAIProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const useMock = this.config.get<string>('USE_MOCK_AI', 'true') !== 'false';
    const apiKey = this.config.get<string>('AI_API_KEY', '');
    this.provider =
      useMock || !apiKey
        ? this.fallback
        : new OpenAIProvider(
            apiKey,
            this.config.get<string>('AI_MODEL', 'gpt-4o-mini'),
            this.config.get<string>('AI_BASE_URL', 'https://api.openai.com/v1'),
          );
  }

  async researchIfNeeded(businessId: string): Promise<boolean> {
    const existing = await this.prisma.marketResearch.findUnique({
      where: { businessId },
    });
    if (existing) {
      return false;
    }
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      return false;
    }

    try {
      const label = CATEGORY_LABELS_UZ[business.category] ?? "do'kon";
      const searchApiKey = this.config.get<string>('SEARCH_API_KEY', '');

      const query = `${label} ${business.city} ${business.region} narxlari`;
      const searchResults = await webSearch(query, searchApiKey);

      let research;
      if (searchResults.length === 0) {
        research = {
          competitors: [],
          demandScore: null,
          demandTrend: null,
          trendPercent: null,
          summaryUz: searchApiKey
            ? "Internet qidiruvi hech qanday natija bermadi — shu kategoriya/hudud bo'yicha ma'lumot topilmadi."
            : "Internet qidiruvi hozircha sozlanmagan (SEARCH_API_KEY yo'q) — bu bo'lim hali ishlamayapti.",
        };
      } else {
        try {
          const raw = await this.provider.researchMarket({
            category: business.category,
            region: business.region,
            city: business.city,
            searchResults,
          });
          research = marketResearchSchema.parse(raw);
        } catch {
          research = {
            competitors: [],
            demandScore: null,
            demandTrend: null,
            trendPercent: null,
            summaryUz:
              'Internet qidiruvi natijalari topildi, lekin AI tahlili muvaffaqiyatsiz tugadi.',
          };
        }
      }
      const usedFallback = this.provider.name === 'mock';

      await this.prisma.$transaction(async (tx) => {
        for (const competitor of research.competitors.map((c) => ({
          name: c.name,
          location: c.location,
          price: c.estimatedPrice,
          src: 'AI_WEB' as const,
        }))) {
          const already = await tx.competitor.findFirst({
            where: {
              businessId,
              name: { equals: competitor.name, mode: 'insensitive' },
            },
          });
          if (already) continue;
          await tx.competitor.create({
            data: {
              businessId,
              name: competitor.name,
              price: competitor.price ?? 0,
              location: competitor.location,
              source: competitor.src,
            },
          });
        }
        await tx.marketResearch.create({
          data: {
            businessId,
            status: usedFallback ? 'SKIPPED' : 'DONE',
            demandScore: research.demandScore,
            demandTrend: research.demandTrend ?? undefined,
            trendPercent: research.trendPercent,
            summaryUz: research.summaryUz,
            sourceUrls: searchResults.map((r) => r.url),
          },
        });
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `Market research failed for business ${businessId}: ${error instanceof Error ? error.message : error}`,
      );
      await this.prisma.marketResearch.upsert({
        where: { businessId },
        create: { businessId, status: 'FAILED' },
        update: { status: 'FAILED' },
      });
      return false;
    }
  }
}
