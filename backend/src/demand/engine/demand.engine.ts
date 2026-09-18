export type DemandTrend = 'UP' | 'STABLE' | 'DOWN';

export interface DemandInput {
  historicalSales: number;
  seasonalFactor: number;
  competitionCount: number;
  sellingPrice: number;
  marketAveragePrice: number | null;
  manualScore?: number | null;
}

export interface DemandResult {
  score: number;
  trend: DemandTrend;
  provenance: 'DEMO' | 'USER';
  explanationEn: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeDemand(input: DemandInput): DemandResult {
  if (input.manualScore !== undefined && input.manualScore !== null) {
    const score = clamp(input.manualScore);
    return {
      score,
      trend: score >= 60 ? 'UP' : score >= 40 ? 'STABLE' : 'DOWN',
      provenance: 'USER',
      explanationEn:
        'Score uses a user-entered demand assumption, not observed market data.',
    };
  }

  const salesComponent = clamp(input.historicalSales / 2);
  const seasonalComponent = clamp((input.seasonalFactor - 0.7) * 80);
  const competitionPenalty = Math.min(30, input.competitionCount * 4);
  const pricePenalty =
    input.marketAveragePrice && input.marketAveragePrice > 0
      ? Math.max(0, (input.sellingPrice / input.marketAveragePrice - 1) * 40)
      : 0;
  const score = clamp(
    salesComponent * 0.45 +
      seasonalComponent * 0.35 +
      20 -
      competitionPenalty -
      pricePenalty,
  );
  const trend: DemandTrend =
    score >= 62 ? 'UP' : score >= 42 ? 'STABLE' : 'DOWN';
  return {
    score,
    trend,
    provenance: 'DEMO',
    explanationEn:
      'Demo signal only. Validate with real sales or marketplace data before investing.',
  };
}
