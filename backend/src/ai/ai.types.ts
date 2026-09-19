import { z } from 'zod';
import { MarketResearchInput } from '../market-research/market-research.types';

export const aiInsightSchema = z.object({
  summary: z.string().min(1),
  marketExplanation: z.string().min(1),
  financialExplanation: z.string().min(1),
  opportunities: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  validationQuestions: z.array(z.string()).min(1),
  recommendations: z.array(z.string()).min(1),
  citations: z.array(z.string()).min(1),
});

export type AIInsightPayload = z.infer<typeof aiInsightSchema>;

export const copilotReplySchema = z.object({
  answer: z.string().min(1),
  citations: z.array(z.string()).min(1),
});

export type CopilotReply = z.infer<typeof copilotReplySchema>;

export const productEstimateSchema = z.object({
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().positive(),
  expectedMonthlySales: z.number().nonnegative(),
  estimatedMonthlyFixedCost: z.number().nonnegative(),
  reasoningUz: z.string().min(1),
});

export type ProductEstimate = z.infer<typeof productEstimateSchema>;

export interface ProductEstimateInput {
  category: string;
  region: string;
  productName: string;
}

export interface BusinessAIContext {
  business: {
    name: string;
    category: string;
    region: string;
    city: string;
    availableCapital: number;
    isDemo: boolean;
  };
  products: Array<{
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    expectedMonthlySales: number;
  }>;
  market: {
    provenance: string;
    averagePrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    trendPercent: number | null;
    competitorCount: number;
    competitors: Array<{
      name: string;
      price: number;
      location: string | null;
      source: string;
    }>;
    demandScore: number | null;
    demandTrend: string | null;
    summaryUz: string | null;
  };
  financials: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    grossMargin: number | null;
    contributionMargin: number;
    breakEvenUnits: number | null;
    breakEvenRevenue: number | null;
  };
  scenarios: Array<{
    type: string;
    monthlyUnits: number;
    revenue: number;
    profit: number;
  }>;
  risks: {
    overallScore: number;
    overallLevel: string;
    items: Array<{ key: string; level: string; score: number }>;
  };
}

export interface AIProvider {
  readonly name: string;
  generateInsights(context: BusinessAIContext): Promise<AIInsightPayload>;
  chat(context: BusinessAIContext, question: string): Promise<CopilotReply>;
  estimateProductNumbers(input: ProductEstimateInput): Promise<unknown>;
  researchMarket(input: MarketResearchInput): Promise<unknown>;
}

export function formatUzs(value: number): string {
  return `${Math.round(value).toLocaleString('uz-UZ')} so‘m`;
}
