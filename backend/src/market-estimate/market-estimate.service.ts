import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, marketContextEstimateSchema } from '../ai/ai.types';
import { MockAIProvider } from '../ai/providers/mock-ai.provider';
import { OpenAIProvider } from '../ai/providers/openai.provider';

export interface MarketContextResult {
  provenance: 'AI';
  productId: null;
  nameUz: null;
  averagePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  trendPercent: number | null;
  competitorCount: number;
  demandScore: number | null;
  demandTrend: string | null;
  seasonalFactor: null;
  labeledDemo: false;
}

/**
 * Standalone from AIModule/BusinessesModule on purpose: BusinessesModule needs
 * this for marketContext(), while AIModule already depends on BusinessesModule
 * (to build AI context from a business's radar). Importing AIModule back into
 * BusinessesModule would create a circular module dependency, so this service
 * constructs its own lightweight AIProvider instance instead of reusing AIService.
 */
@Injectable()
export class MarketEstimateService {
  private readonly provider: AIProvider;
  private readonly fallback = new MockAIProvider();

  constructor(private readonly config: ConfigService) {
    const useMock = this.config.get<string>('USE_MOCK_AI', 'true') !== 'false';
    const apiKey = this.config.get<string>('AI_API_KEY', '');
    if (useMock || !apiKey) {
      this.provider = this.fallback;
    } else {
      this.provider = new OpenAIProvider(
        apiKey,
        this.config.get<string>('AI_MODEL', 'gpt-4o-mini'),
        this.config.get<string>('AI_BASE_URL', 'https://api.openai.com/v1'),
      );
    }
  }

  async estimateMarketContext(
    category: string,
    region: string,
  ): Promise<MarketContextResult> {
    let estimate: {
      averagePrice: number | null;
      minPrice: number | null;
      maxPrice: number | null;
      trendPercent: number | null;
      competitorCount: number;
      demandScore: number | null;
      demandTrend: string | null;
    };
    try {
      const raw = await this.provider.estimateMarketContext({
        category,
        region,
      });
      estimate = marketContextEstimateSchema.parse(raw);
    } catch {
      try {
        const raw = await this.provider.estimateMarketContext({
          category,
          region,
        });
        estimate = marketContextEstimateSchema.parse(raw);
      } catch {
        estimate = await this.fallback.estimateMarketContext({
          category,
          region,
        });
      }
    }

    return {
      provenance: 'AI',
      productId: null,
      nameUz: null,
      averagePrice: estimate.averagePrice,
      minPrice: estimate.minPrice,
      maxPrice: estimate.maxPrice,
      trendPercent: estimate.trendPercent,
      competitorCount: estimate.competitorCount,
      demandScore: estimate.demandScore,
      demandTrend: estimate.demandTrend,
      seasonalFactor: null,
      labeledDemo: false,
    };
  }
}
