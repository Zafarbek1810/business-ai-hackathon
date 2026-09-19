import { calculateTax, YATT_FIXED_RATES } from './tax.engine';

describe('calculateTax — benefitPercent', () => {
  it('applies no discount when benefitPercent is omitted', () => {
    const result = calculateTax({
      entityType: 'MCHJ',
      mchjRegime: 'SIMPLIFIED',
      revenue: 10_000_000,
    });
    expect(result.taxAmount).toBe(400_000);
    expect(result.benefitPercent).toBe(0);
    expect(result.benefitAmount).toBe(0);
  });

  it('reduces MCHJ simplified tax by the given percent', () => {
    const result = calculateTax({
      entityType: 'MCHJ',
      mchjRegime: 'SIMPLIFIED',
      revenue: 10_000_000,
      benefitPercent: 50,
    });
    expect(result.taxAmount).toBe(200_000);
    expect(result.benefitPercent).toBe(50);
    expect(result.benefitAmount).toBe(200_000);
    expect(result.netIncome).toBe(9_800_000);
    expect(result.disclaimers.some((d) => d.includes('50%'))).toBe(true);
  });

  it('reduces MCHJ general profit tax and recomputes net income', () => {
    const result = calculateTax({
      entityType: 'MCHJ',
      mchjRegime: 'GENERAL',
      revenue: 20_000_000,
      expenses: 10_000_000,
      benefitPercent: 100,
    });
    // base tax = (20m - 10m) * 15% = 1.5m, 100% benefit -> 0
    expect(result.taxAmount).toBe(0);
    expect(result.benefitAmount).toBe(1_500_000);
    expect(result.netIncome).toBe(10_000_000);
  });

  it('reduces YATT fixed tax proportionally', () => {
    const result = calculateTax({
      entityType: 'YATT',
      category: 'CLOTHING',
      revenue: 5_000_000,
      benefitPercent: 25,
    });
    const base = YATT_FIXED_RATES.CLOTHING;
    expect(result.taxAmount).toBe(base * 0.75);
    expect(result.benefitAmount).toBe(base * 0.25);
  });

  it('clamps out-of-range benefitPercent into 0-100', () => {
    const over = calculateTax({
      entityType: 'MCHJ',
      mchjRegime: 'SIMPLIFIED',
      revenue: 10_000_000,
      benefitPercent: 150,
    });
    expect(over.benefitPercent).toBe(100);
    expect(over.taxAmount).toBe(0);

    const negative = calculateTax({
      entityType: 'MCHJ',
      mchjRegime: 'SIMPLIFIED',
      revenue: 10_000_000,
      benefitPercent: -20,
    });
    expect(negative.benefitPercent).toBe(0);
    expect(negative.taxAmount).toBe(400_000);
  });
});
