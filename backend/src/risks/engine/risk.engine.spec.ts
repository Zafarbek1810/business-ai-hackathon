import { analyzeRisks, riskLevelFromScore } from './risk.engine';

describe('Risk engine', () => {
  const demo = {
    competitorCount: 4,
    grossMargin: 4_800_000 / 22_800_000,
    fixedCosts: 20_000_000,
    revenue: 22_800_000,
    availableCapital: 100_000_000,
    expectedUnits: 120,
    variableCostPerUnit: 150_000,
    sellingPrice: 190_000,
    demandScore: 72,
    productCount: 1,
    marketAveragePrice: 185_000,
    seasonalFactor: 1.1,
  };

  it('scores the demo clothing store with elevated fixed-cost and capital pressure', () => {
    const result = analyzeRisks(demo);
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.overallLevel).toBe('MEDIUM');
    const capital = result.items.find((item) => item.key === 'capital');
    const fixed = result.items.find((item) => item.key === 'fixed_cost');
    expect(capital?.level).toBe('MEDIUM');
    expect(fixed?.level).toBe('HIGH');
  });

  it('marks insufficient capital as HIGH when runway is under one month', () => {
    const result = analyzeRisks({
      ...demo,
      availableCapital: 10_000_000,
    });
    const capital = result.items.find((item) => item.key === 'capital');
    expect(capital?.level).toBe('HIGH');
    expect(capital?.score).toBeGreaterThanOrEqual(70);
  });

  it('maps score bands to LOW/MEDIUM/HIGH', () => {
    expect(riskLevelFromScore(10)).toBe('LOW');
    expect(riskLevelFromScore(40)).toBe('MEDIUM');
    expect(riskLevelFromScore(70)).toBe('HIGH');
  });
});
