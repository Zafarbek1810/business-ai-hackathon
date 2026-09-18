export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskItem {
  key: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  score: number;
  level: RiskLevel;
  reasonUz: string;
  reasonRu: string;
  reasonEn: string;
}

export interface RiskEngineInput {
  competitorCount: number;
  grossMargin: number | null;
  fixedCosts: number;
  revenue: number;
  availableCapital: number;
  expectedUnits: number;
  variableCostPerUnit: number;
  sellingPrice: number;
  demandScore: number | null;
  productCount: number;
  marketAveragePrice: number | null;
  seasonalFactor: number | null;
}

export interface RiskEngineResult {
  overallScore: number;
  overallLevel: RiskLevel;
  items: RiskItem[];
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 70) {
    return 'HIGH';
  }
  if (score >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeRisks(input: RiskEngineInput): RiskEngineResult {
  const inventoryNeed = input.variableCostPerUnit * input.expectedUnits;
  const monthsCovered =
    input.fixedCosts <= 0 ? 12 : input.availableCapital / input.fixedCosts;

  const competitionScore = clampScore(
    input.competitorCount <= 2 ? 22 : input.competitorCount <= 6 ? 52 : 82,
  );
  const marginScore = clampScore(
    input.grossMargin === null
      ? 55
      : input.grossMargin >= 0.4
        ? 15
        : input.grossMargin >= 0.25
          ? 38
          : input.grossMargin >= 0.15
            ? 72
            : 92,
  );
  const fixedCostRatio =
    input.revenue <= 0 ? 1 : input.fixedCosts / input.revenue;
  const fixedCostScore = clampScore(
    input.revenue <= 0
      ? 88
      : fixedCostRatio < 0.3
        ? 18
        : fixedCostRatio < 0.7
          ? 48
          : 86,
  );
  const capitalScore = clampScore(
    monthsCovered >= 6
      ? 16
      : monthsCovered >= 3
        ? 42
        : monthsCovered >= 1
          ? 74
          : 94,
  );
  const demandScore = clampScore(
    input.demandScore === null
      ? 50
      : input.demandScore >= 80
        ? 16
        : input.demandScore >= 50
          ? 38
          : input.demandScore >= 30
            ? 68
            : 90,
  );
  const supplierScore = clampScore(input.productCount <= 1 ? 62 : 28);
  const priceGap =
    input.marketAveragePrice && input.marketAveragePrice > 0
      ? input.sellingPrice / input.marketAveragePrice
      : 1;
  const priceSensitivityScore = clampScore(
    priceGap >= 1.15 ? 74 : priceGap >= 1.05 ? 48 : 24,
  );
  const seasonalScore = clampScore(
    input.seasonalFactor === null
      ? 35
      : input.seasonalFactor >= 1.3 || input.seasonalFactor <= 0.7
        ? 64
        : 28,
  );
  const inventoryScore = clampScore(
    input.availableCapital <= 0
      ? 80
      : inventoryNeed / input.availableCapital >= 0.5
        ? 68
        : 30,
  );

  const items: RiskItem[] = [
    {
      key: 'competition',
      titleUz: 'Raqobat xavfi',
      titleRu: 'Риск конкуренции',
      titleEn: 'Competition risk',
      score: competitionScore,
      level: riskLevelFromScore(competitionScore),
      reasonUz: `Demo to‘plamda ushbu kategoriya bo‘yicha ${input.competitorCount} ta raqobatchi modeli mavjud.`,
      reasonRu: `В демо-наборе по этой категории смоделировано ${input.competitorCount} конкурентов.`,
      reasonEn: `The demo dataset models ${input.competitorCount} competitors in this category.`,
    },
    {
      key: 'margin',
      titleUz: 'Marja xavfi',
      titleRu: 'Риск маржи',
      titleEn: 'Margin risk',
      score: marginScore,
      level: riskLevelFromScore(marginScore),
      reasonUz:
        input.grossMargin === null
          ? 'Yalpi marja hisoblanmadi, chunki tushum nolgа teng.'
          : `Modellashtirilgan yalpi marja ${(input.grossMargin * 100).toFixed(1)}%.`,
      reasonRu:
        input.grossMargin === null
          ? 'Валовая маржа не рассчитана, потому что выручка равна нулю.'
          : `Смоделированная валовая маржа ${(input.grossMargin * 100).toFixed(1)}%.`,
      reasonEn:
        input.grossMargin === null
          ? 'Gross margin could not be calculated because revenue is zero.'
          : `Modeled gross margin is ${(input.grossMargin * 100).toFixed(1)}%.`,
    },
    {
      key: 'fixed_cost',
      titleUz: 'Yuqori doimiy xarajat',
      titleRu: 'Высокие постоянные затраты',
      titleEn: 'High fixed cost',
      score: fixedCostScore,
      level: riskLevelFromScore(fixedCostScore),
      reasonUz: `Doimiy oylik xarajat ${input.fixedCosts.toLocaleString('uz-UZ')} so‘m, modellashtirilgan tushum ${input.revenue.toLocaleString('uz-UZ')} so‘m.`,
      reasonRu: `Постоянные ежемесячные затраты ${input.fixedCosts.toLocaleString('ru-RU')} сум при смоделированной выручке ${input.revenue.toLocaleString('ru-RU')} сум.`,
      reasonEn: `Fixed monthly costs are ${input.fixedCosts.toLocaleString('en-US')} UZS against modeled revenue of ${input.revenue.toLocaleString('en-US')} UZS.`,
    },
    {
      key: 'capital',
      titleUz: 'Kapital yetarlilik xavfi',
      titleRu: 'Риск недостаточности капитала',
      titleEn: 'Capital adequacy risk',
      score: capitalScore,
      level: riskLevelFromScore(capitalScore),
      reasonUz: `Mavjud kapital doimiy xarajatlarni taxminan ${monthsCovered.toFixed(1)} oy qoplashi mumkin.`,
      reasonRu: `Доступный капитал покрывает постоянные затраты примерно на ${monthsCovered.toFixed(1)} мес.`,
      reasonEn: `Available capital covers about ${monthsCovered.toFixed(1)} months of modeled fixed costs.`,
    },
    {
      key: 'demand',
      titleUz: 'Talab signali xavfi',
      titleRu: 'Риск спроса',
      titleEn: 'Demand signal risk',
      score: demandScore,
      level: riskLevelFromScore(demandScore),
      reasonUz:
        input.demandScore === null
          ? 'Talab signali kiritilmagan.'
          : `Demo talab balli ${input.demandScore}/100. Bu haqiqiy bozor prognozi emas.`,
      reasonRu:
        input.demandScore === null
          ? 'Сигнал спроса не задан.'
          : `Демо-балл спроса ${input.demandScore}/100. Это не реальный рыночный прогноз.`,
      reasonEn:
        input.demandScore === null
          ? 'No demand signal was provided.'
          : `Demo demand score is ${input.demandScore}/100. This is not a real market forecast.`,
    },
    {
      key: 'supplier',
      titleUz: 'Yetkazib beruvchiga bog‘liqlik',
      titleRu: 'Зависимость от поставщика',
      titleEn: 'Supplier dependence',
      score: supplierScore,
      level: riskLevelFromScore(supplierScore),
      reasonUz: `Modelda ${input.productCount} ta mahsulot. Bitta SKUga tayanish ta’minot xavfini oshiradi.`,
      reasonRu: `В модели ${input.productCount} продукт(ов). Опора на один SKU повышает риск поставок.`,
      reasonEn: `The model includes ${input.productCount} product(s). Relying on a single SKU increases supply risk.`,
    },
    {
      key: 'price_sensitivity',
      titleUz: 'Narx sezgirligi',
      titleRu: 'Ценовая чувствительность',
      titleEn: 'Price sensitivity',
      score: priceSensitivityScore,
      level: riskLevelFromScore(priceSensitivityScore),
      reasonUz:
        input.marketAveragePrice === null
          ? 'Taqqoslash uchun demo o‘rtacha narx yo‘q.'
          : `Sizning sotish narxingiz ${input.sellingPrice.toLocaleString('uz-UZ')} so‘m, demo o‘rtacha ${input.marketAveragePrice.toLocaleString('uz-UZ')} so‘m.`,
      reasonRu:
        input.marketAveragePrice === null
          ? 'Нет демо-средней цены для сравнения.'
          : `Ваша цена продажи ${input.sellingPrice.toLocaleString('ru-RU')} сум, демо-средняя ${input.marketAveragePrice.toLocaleString('ru-RU')} сум.`,
      reasonEn:
        input.marketAveragePrice === null
          ? 'No demo average price is available for comparison.'
          : `Your selling price is ${input.sellingPrice.toLocaleString('en-US')} UZS versus a demo average of ${input.marketAveragePrice.toLocaleString('en-US')} UZS.`,
    },
    {
      key: 'seasonal',
      titleUz: 'Mavsumiylik',
      titleRu: 'Сезонность',
      titleEn: 'Seasonal demand',
      score: seasonalScore,
      level: riskLevelFromScore(seasonalScore),
      reasonUz: `Demo mavsumiy koeffitsient: ${input.seasonalFactor ?? 'noma’lum'}.`,
      reasonRu: `Демо-сезонный коэффициент: ${input.seasonalFactor ?? 'не задан'}.`,
      reasonEn: `Demo seasonal factor: ${input.seasonalFactor ?? 'unknown'}.`,
    },
    {
      key: 'inventory',
      titleUz: 'Zaxira xavfi',
      titleRu: 'Риск запасов',
      titleEn: 'Inventory risk',
      score: inventoryScore,
      level: riskLevelFromScore(inventoryScore),
      reasonUz: `Oylik tovar zaxirasi taxminan ${inventoryNeed.toLocaleString('uz-UZ')} so‘m kapitalni band qilishi mumkin.`,
      reasonRu: `Месячный товарный запас может связать около ${inventoryNeed.toLocaleString('ru-RU')} сум капитала.`,
      reasonEn: `Monthly inventory may tie up about ${inventoryNeed.toLocaleString('en-US')} UZS of capital.`,
    },
  ];

  const overallScore = clampScore(
    items.reduce((sum, item) => sum + item.score, 0) / items.length,
  );

  return {
    overallScore,
    overallLevel: riskLevelFromScore(overallScore),
    items,
  };
}
