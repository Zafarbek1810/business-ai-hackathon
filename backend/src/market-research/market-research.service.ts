import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MockAIProvider } from '../ai/providers/mock-ai.provider';
import { OpenAIProvider } from '../ai/providers/openai.provider';
import { AIProvider } from '../ai/ai.types';
import { marketResearchSchema } from './market-research.types';
import { webSearch } from './web-search.util';
import { searchTwoGis } from './twogis.util';

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
            this.config.get<string>('AI_MODEL', 'google/gemma-4-E4B-it'),
            this.config.get<string>(
              'AI_BASE_URL',
              'https://api.deepinfra.com/v1/openai',
            ),
          );
  }

  async researchIfNeeded(businessId: string): Promise<boolean> {
    try {
      await this.prisma.marketResearch.create({
        data: { businessId, status: 'PENDING' },
      });
    } catch {
      // Another concurrent call already claimed (or finished) this business's
      // research — do not run a second web search / AI pass for it.
      return false;
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { products: { take: 1 } },
    });
    if (!business) {
      await this.prisma.marketResearch.delete({ where: { businessId } });
      return false;
    }

    try {
      const label = CATEGORY_LABELS_UZ[business.category] ?? "do'kon";
      const productName = business.products[0]?.name ?? null;
      const searchApiKey = this.config.get<string>('SEARCH_API_KEY', '');
      const twoGisApiKey = this.config.get<string>('TWOGIS_API_KEY', '');

      const query = productName
        ? `${productName} narxi sotib olish ${business.city} ${business.region}`
        : `${label} ${business.city} ${business.region} narxlari`;
      const twoGisQuery = productName ?? label;
      const [searchResults, twoGisResults] = await Promise.all([
        webSearch(query, searchApiKey),
        searchTwoGis(twoGisQuery, business.city, twoGisApiKey),
      ]);

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
            productName,
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
      if (twoGisResults.length > 0) {
        research = {
          ...research,
          summaryUz: `${research.summaryUz} 2GIS xaritasidan ${twoGisResults.length} ta qo'shimcha real biznes topildi (saytsiz/onlaynda ko'rinmaydigan do'konlar ham).`,
        };
      }
      const usedFallback = this.provider.name === 'mock';

      const mergedCompetitors = [
        ...research.competitors.map((c) => ({
          name: c.name,
          location: c.location,
          price: c.estimatedPrice,
          contact: c.contact,
          sourceUrl: c.sourceUrl,
          src: 'AI_WEB' as const,
        })),
        ...twoGisResults.map((r) => ({
          name: r.name,
          location: r.address,
          price: null as number | null,
          contact: r.phone,
          sourceUrl: null as string | null,
          src: 'MAP' as const,
        })),
      ];

      await this.prisma.$transaction(async (tx) => {
        for (const competitor of mergedCompetitors) {
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
              contact: competitor.contact,
              sourceUrl: competitor.sourceUrl,
              source: competitor.src,
            },
          });
        }
        const data = {
          status: usedFallback ? ('SKIPPED' as const) : ('DONE' as const),
          demandScore: research.demandScore,
          demandTrend: research.demandTrend ?? undefined,
          trendPercent: research.trendPercent,
          summaryUz: research.summaryUz,
          sourceUrls: searchResults.map((r) => r.url),
        };
        await tx.marketResearch.upsert({
          where: { businessId },
          create: { businessId, ...data },
          update: data,
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
