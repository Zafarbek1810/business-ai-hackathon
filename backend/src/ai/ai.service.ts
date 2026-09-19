import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIAnalysisType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { MockAIProvider } from './providers/mock-ai.provider';
import { OpenAIProvider } from './providers/openai.provider';
import {
  AIInsightPayload,
  AIProvider,
  BusinessAIContext,
  CopilotReply,
  ProductEstimateInput,
  aiInsightSchema,
  copilotReplySchema,
  productEstimateSchema,
} from './ai.types';
import { AnalyticsService } from '../common/analytics.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { toNumber } from '../common/utils/decimal';

@Injectable()
export class AIService {
  private readonly provider: AIProvider;
  private readonly fallback = new MockAIProvider();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly businesses: BusinessesService,
    private readonly analytics: AnalyticsService,
  ) {
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

  async generateBusinessSummary(user: AuthUser, businessId: string) {
    return this.runInsights(user, businessId, AIAnalysisType.BUSINESS_SUMMARY);
  }

  async generateMarketInsights(user: AuthUser, businessId: string) {
    return this.runInsights(user, businessId, AIAnalysisType.MARKET_INSIGHTS);
  }

  async generateFinancialInsights(user: AuthUser, businessId: string) {
    return this.runInsights(
      user,
      businessId,
      AIAnalysisType.FINANCIAL_INSIGHTS,
    );
  }

  async generateRiskInsights(user: AuthUser, businessId: string) {
    return this.runInsights(user, businessId, AIAnalysisType.RISK_ANALYSIS);
  }

  async generateValidationChecklist(user: AuthUser, businessId: string) {
    return this.runInsights(user, businessId, AIAnalysisType.VALIDATION);
  }

  async chat(user: AuthUser, businessId: string, question: string) {
    const context = await this.buildContext(user, businessId);
    let reply: CopilotReply;
    let usedFallback = this.provider.name === 'mock';
    try {
      const raw = await this.provider.chat(context, question);
      reply = copilotReplySchema.parse(raw);
    } catch {
      try {
        const raw = await this.provider.chat(context, question);
        reply = copilotReplySchema.parse(raw);
      } catch {
        reply = await this.fallback.chat(context, question);
        usedFallback = true;
      }
    }
    await this.persist(
      businessId,
      AIAnalysisType.COPILOT,
      context,
      reply,
      usedFallback,
    );
    return {
      ...reply,
      provider: usedFallback ? this.fallback.name : this.provider.name,
      usedFallback,
    };
  }

  async estimateProductNumbers(user: AuthUser, input: ProductEstimateInput) {
    let estimate: unknown;
    let usedFallback = this.provider.name === 'mock';
    try {
      const raw = await this.provider.estimateProductNumbers(input);
      estimate = productEstimateSchema.parse(raw);
    } catch {
      try {
        const raw = await this.provider.estimateProductNumbers(input);
        estimate = productEstimateSchema.parse(raw);
      } catch {
        estimate = await this.fallback.estimateProductNumbers(input);
        usedFallback = true;
      }
    }
    await this.analytics.track('product_estimate_requested', user.id, {
      category: input.category,
      region: input.region,
      provider: usedFallback ? this.fallback.name : this.provider.name,
    });
    return {
      ...(estimate as object),
      provider: usedFallback ? this.fallback.name : this.provider.name,
      usedFallback,
    };
  }

  private async runInsights(
    user: AuthUser,
    businessId: string,
    type: AIAnalysisType,
  ) {
    const context = await this.buildContext(user, businessId);
    const { payload, usedFallback } = await this.safeInsights(context);
    await this.persist(businessId, type, context, payload, usedFallback);
    await this.analytics.track('ai_analysis_generated', user.id, {
      businessId,
      type,
      provider: usedFallback ? this.fallback.name : this.provider.name,
    });
    return {
      type,
      ...payload,
      provider: usedFallback ? this.fallback.name : this.provider.name,
      usedFallback,
    };
  }

  private async safeInsights(context: BusinessAIContext): Promise<{
    payload: AIInsightPayload;
    usedFallback: boolean;
  }> {
    try {
      const raw = await this.provider.generateInsights(context);
      return {
        payload: aiInsightSchema.parse(raw),
        usedFallback: this.provider.name === 'mock',
      };
    } catch {
      try {
        const raw = await this.provider.generateInsights(context);
        return {
          payload: aiInsightSchema.parse(raw),
          usedFallback: this.provider.name === 'mock',
        };
      } catch {
        const payload = await this.fallback.generateInsights(context);
        return { payload, usedFallback: true };
      }
    }
  }

  async buildContext(
    user: AuthUser,
    businessId: string,
  ): Promise<BusinessAIContext> {
    const radar = await this.businesses.radar(user, businessId);
    const latestRisk = radar.risks;
    const items = Array.isArray(latestRisk?.items)
      ? (latestRisk.items as Array<{
          key: string;
          level: string;
          score: number;
        }>)
      : [];
    return {
      business: {
        name: radar.business.name,
        category: radar.business.category,
        region: radar.business.region,
        city: radar.business.city,
        availableCapital: toNumber(radar.business.availableCapital),
        isDemo: radar.business.isDemo,
      },
      products: radar.business.products.map((product) => ({
        name: product.name,
        purchasePrice: toNumber(product.purchasePrice),
        sellingPrice: toNumber(product.sellingPrice),
        expectedMonthlySales: product.expectedMonthlySales,
      })),
      market: {
        provenance: String(radar.market.provenance),
        averagePrice: radar.market.averagePrice,
        minPrice: radar.market.minPrice,
        maxPrice: radar.market.maxPrice,
        trendPercent: radar.market.trendPercent,
        competitorCount: radar.market.competitorCount,
        competitors: radar.market.competitors,
        demandScore: radar.market.demandScore,
        demandTrend: radar.market.demandTrend,
        summaryUz: radar.market.summaryUz,
      },
      financials: {
        revenue: radar.finance.revenue,
        cogs: radar.finance.cogs,
        grossProfit: radar.finance.grossProfit,
        operatingExpenses: radar.finance.operatingExpenses,
        netProfit: radar.finance.netProfit,
        grossMargin: radar.finance.grossMargin,
        contributionMargin: radar.finance.contributionMargin,
        breakEvenUnits: radar.finance.breakEvenUnits,
        breakEvenRevenue: radar.finance.breakEvenRevenue,
      },
      scenarios: radar.scenarios.map((scenario) => ({
        type: scenario.type,
        monthlyUnits: scenario.monthlyUnits,
        revenue: toNumber(scenario.revenue),
        profit: toNumber(scenario.profit),
      })),
      risks: {
        overallScore: latestRisk?.overallScore ?? 0,
        overallLevel: latestRisk?.overallLevel ?? 'MEDIUM',
        items,
      },
    };
  }

  private persist(
    businessId: string,
    type: AIAnalysisType,
    input: BusinessAIContext,
    output: unknown,
    usedFallback: boolean,
  ) {
    return this.prisma.aIAnalysis.create({
      data: {
        businessId,
        type,
        input: input as unknown as Prisma.InputJsonValue,
        output: output as Prisma.InputJsonValue,
        provider: usedFallback ? this.fallback.name : this.provider.name,
        usedFallback,
      },
    });
  }
}
