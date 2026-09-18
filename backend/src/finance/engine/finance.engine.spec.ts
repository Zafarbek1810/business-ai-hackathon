import {
  calculateBreakEvenUnits,
  calculateFinance,
  calculateScenario,
  defaultScenarioAssumptions,
} from './finance.engine';

describe('Finance engine', () => {
  const demoInput = {
    sellingPrice: 190_000,
    variableCostPerUnit: 150_000,
    expectedUnits: 120,
    otherRevenue: 0,
    initialInvestment: 100_000_000,
    availableCapital: 100_000_000,
    fixedCosts: {
      rent: 20_000_000,
      salary: 0,
      utilities: 0,
      software: 0,
      marketing: 0,
      other: 0,
    },
    variableMonthly: {
      delivery: 0,
      packaging: 0,
      transactionFees: 0,
    },
  };

  it('matches the hackathon demo break-even of 500 units', () => {
    const result = calculateFinance(demoInput);
    expect(result.contributionMargin).toBe(40_000);
    expect(result.breakEvenUnits).toBe(500);
    expect(result.breakEvenRevenue).toBe(95_000_000);
    expect(result.revenue).toBe(22_800_000);
    expect(result.cogs).toBe(18_000_000);
    expect(result.grossProfit).toBe(4_800_000);
    expect(result.operatingExpenses).toBe(20_000_000);
    expect(result.netProfit).toBe(-15_200_000);
    expect(result.grossMargin).toBeCloseTo(4_800_000 / 22_800_000, 5);
    expect(result.valid).toBe(true);
  });

  it('calculates break-even units with the classic formula', () => {
    expect(calculateBreakEvenUnits(20_000_000, 190_000, 150_000)).toBe(500);
  });

  it('handles zero values without throwing', () => {
    const result = calculateFinance({
      ...demoInput,
      sellingPrice: 0,
      variableCostPerUnit: 0,
      expectedUnits: 0,
      initialInvestment: 0,
      availableCapital: 0,
      fixedCosts: {
        rent: 0,
        salary: 0,
        utilities: 0,
        software: 0,
        marketing: 0,
        other: 0,
      },
    });
    expect(result.revenue).toBe(0);
    expect(result.breakEvenUnits).toBeNull();
    expect(result.roiAnnualEstimate).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('rejects negative values', () => {
    const result = calculateFinance({
      ...demoInput,
      sellingPrice: -1,
      expectedUnits: -10,
    });
    expect(result.valid).toBe(false);
    expect(result.warnings.some((item) => item.code === 'NEGATIVE_VALUE')).toBe(
      true,
    );
  });

  it('does not compute break-even when variable cost >= selling price', () => {
    const result = calculateFinance({
      ...demoInput,
      variableCostPerUnit: 190_000,
    });
    expect(result.contributionMargin).toBe(0);
    expect(result.breakEvenUnits).toBeNull();
    expect(
      result.warnings.some((item) => item.code === 'NON_POSITIVE_CONTRIBUTION'),
    ).toBe(true);
  });

  it('warns when fixed expenses are missing', () => {
    const result = calculateFinance({
      ...demoInput,
      fixedCosts: {
        rent: 0,
        salary: 0,
        utilities: 0,
        software: 0,
        marketing: 0,
        other: 0,
      },
    });
    expect(
      result.warnings.some((item) => item.code === 'MISSING_EXPENSES'),
    ).toBe(true);
    expect(result.breakEvenUnits).toBe(0);
  });

  it('handles very large but finite numbers', () => {
    const result = calculateFinance({
      ...demoInput,
      sellingPrice: 9_000_000_000,
      variableCostPerUnit: 1_000_000_000,
      expectedUnits: 1_000,
      fixedCosts: {
        rent: 50_000_000_000,
        salary: 0,
        utilities: 0,
        software: 0,
        marketing: 0,
        other: 0,
      },
    });
    expect(result.valid).toBe(true);
    expect(result.breakEvenUnits).toBe(6.25);
  });

  it('rejects astronomically large numbers', () => {
    const result = calculateFinance({
      ...demoInput,
      sellingPrice: 1e16,
    });
    expect(result.valid).toBe(false);
    expect(result.warnings.some((item) => item.code === 'INVALID_NUMBER')).toBe(
      true,
    );
  });
});

describe('Scenario engine', () => {
  const base = {
    sellingPrice: 190_000,
    variableCostPerUnit: 150_000,
    expectedUnits: 120,
    otherRevenue: 0,
    initialInvestment: 100_000_000,
    availableCapital: 100_000_000,
    fixedCosts: {
      rent: 20_000_000,
      salary: 0,
      utilities: 0,
      software: 0,
      marketing: 0,
      other: 0,
    },
    variableMonthly: {
      delivery: 0,
      packaging: 0,
      transactionFees: 0,
    },
  };

  it('calculates pessimistic/base/optimistic independently', () => {
    const pessimistic = calculateScenario(base, {
      type: 'PESSIMISTIC',
      monthlyUnits: 80,
    });
    const baseCase = calculateScenario(base, {
      type: 'BASE',
      monthlyUnits: 120,
    });
    const optimistic = calculateScenario(base, {
      type: 'OPTIMISTIC',
      monthlyUnits: 170,
    });

    expect(pessimistic.revenue).toBe(15_200_000);
    expect(pessimistic.profit).toBe(-16_800_000);
    expect(baseCase.revenue).toBe(22_800_000);
    expect(baseCase.profit).toBe(-15_200_000);
    expect(optimistic.revenue).toBe(32_300_000);
    expect(optimistic.profit).toBe(-13_200_000);
    expect(baseCase.breakEvenUnits).toBe(500);
  });

  it('builds default assumptions from expected units', () => {
    const assumptions = defaultScenarioAssumptions(120);
    expect(assumptions[0]).toEqual({ type: 'PESSIMISTIC', monthlyUnits: 80 });
    expect(assumptions[1]).toEqual({ type: 'BASE', monthlyUnits: 120 });
    expect(assumptions[2]).toEqual({ type: 'OPTIMISTIC', monthlyUnits: 170 });
  });
});
