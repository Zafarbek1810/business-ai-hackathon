import { z } from 'zod';

export const marketResearchSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        estimatedPrice: z.number().nonnegative().nullable(),
        location: z.string().nullable(),
        contact: z.string().nullable(),
        sourceUrl: z.string().nullable(),
      }),
    )
    .max(10),
  demandScore: z.number().min(0).max(100).nullable(),
  demandTrend: z.enum(['UP', 'STABLE', 'DOWN']).nullable(),
  trendPercent: z.number().nullable(),
  summaryUz: z.string().min(1),
});

export type MarketResearchPayload = z.infer<typeof marketResearchSchema>;

export interface MarketResearchInput {
  category: string;
  region: string;
  city: string;
  productName: string | null;
  searchResults: Array<{ title: string; snippet: string; url: string }>;
}
