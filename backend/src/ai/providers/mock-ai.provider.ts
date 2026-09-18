import {
  AIInsightPayload,
  AIProvider,
  BusinessAIContext,
  CopilotReply,
  MarketContextEstimate,
  MarketContextEstimateInput,
  ProductEstimate,
  ProductEstimateInput,
  formatUzs,
} from '../ai.types';

const CATEGORY_ESTIMATE_DEFAULTS: Record<
  string,
  { purchasePrice: number; sellingPrice: number; expectedMonthlySales: number }
> = {
  GROCERY: { purchasePrice: 15000, sellingPrice: 20000, expectedMonthlySales: 300 },
  CLOTHING: { purchasePrice: 100000, sellingPrice: 150000, expectedMonthlySales: 60 },
  RESTAURANT: { purchasePrice: 15000, sellingPrice: 35000, expectedMonthlySales: 400 },
  COFFEE_SHOP: { purchasePrice: 5000, sellingPrice: 15000, expectedMonthlySales: 500 },
  PHARMACY: { purchasePrice: 8000, sellingPrice: 12000, expectedMonthlySales: 400 },
  ELECTRONICS: { purchasePrice: 800000, sellingPrice: 1000000, expectedMonthlySales: 20 },
  BEAUTY: { purchasePrice: 30000, sellingPrice: 60000, expectedMonthlySales: 100 },
  EDUCATION: { purchasePrice: 0, sellingPrice: 300000, expectedMonthlySales: 30 },
  AGRICULTURE: { purchasePrice: 3000, sellingPrice: 5000, expectedMonthlySales: 1000 },
  CONSTRUCTION: { purchasePrice: 50000, sellingPrice: 70000, expectedMonthlySales: 100 },
  SERVICES: { purchasePrice: 0, sellingPrice: 100000, expectedMonthlySales: 50 },
  ECOMMERCE: { purchasePrice: 50000, sellingPrice: 80000, expectedMonthlySales: 80 },
  OTHER: { purchasePrice: 30000, sellingPrice: 50000, expectedMonthlySales: 100 },
};

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async generateInsights(
    context: BusinessAIContext,
  ): Promise<AIInsightPayload> {
    await Promise.resolve();
    const product = context.products[0];
    const selling = product ? formatUzs(product.sellingPrice) : 'noma’lum';
    const cost = product ? formatUzs(product.purchasePrice) : 'noma’lum';
    const units = product?.expectedMonthlySales ?? 0;
    const be = context.financials.breakEvenUnits;
    const contribution = formatUzs(context.financials.contributionMargin);
    const fixed = formatUzs(context.financials.operatingExpenses);
    const capital = formatUzs(context.business.availableCapital);

    return {
      summary: `${context.business.name} uchun model ${context.business.region} hududidagi ${context.business.category} g‘oyasini tahlil qiladi. Bu AI xulosasi kafolat emas. Asos: kiritilgan sotish narxi ${selling}, o‘zgaruvchan xarajat ${cost}, baza ssenariy ${units} dona/oy.`,
      marketExplanation: `Bozor bloki ${context.market.provenance} manbasiga tayanadi. O‘rtacha narx ${context.market.averagePrice ? formatUzs(context.market.averagePrice) : 'yo‘q'}, raqobatchilar soni ${context.market.competitorCount}, talab balli ${context.market.demandScore ?? 'noma’lum'}/100. Bu tasdiqlangan real vaqt statistikasi emas — AI taxmini.`,
      financialExplanation: `Siz kiritgan sotish narxi ${selling} va o‘zgaruvchan xarajat ${cost} asosida modellashtirilgan ulushli marja ${contribution}. Doimiy oylik xarajat ${fixed} bo‘lsa, taxminiy zararsizlik nuqtasi ${be === null ? 'hisoblanmadi' : `${be} dona/oy`}. Baza ssenariydagi ${units} dona shu nuqtadan ${be !== null && units < be ? 'past' : 'yuqori yoki yaqin'}.`,
      opportunities: [
        'Yetkazib beruvchi narxini pasaytirish yoki qo‘shimcha yuqori marjali SKU qo‘shish modeldagi marjani kengaytirishi mumkin.',
        'Doimiy xarajatlarni (ijara/ish haqi) bosqichma-bosqich oshirish zararsizlik nuqtasini pasaytiradi.',
        'AI talab signali yo‘nalishni ko‘rsatadi, lekin uni real savdo yoki marketplace ma’lumotlari bilan tasdiqlash kerak.',
      ],
      risks: [
        `Kapital xavfi: mavjud mablag‘ ${capital}. Model doimiy xarajat va tovar zaxirasini to‘liq qoplamasligi mumkin.`,
        'Bitta mahsulotga tayanish ta’minot va talab o‘zgarishiga sezgirlikni oshiradi.',
        'AI taxmin qilgan raqobatchilar soni haqiqiy mahalliy raqobatni ifodalamasligi mumkin — maydonda tekshirish shart.',
      ],
      validationQuestions: [
        `Oylik ${units} dona (yoki siz kiritgan hajm) haqiqatan sotiladimi?`,
        `Yetkazib beruvchi ${cost} xarid narxini barqaror ushlab turadimi?`,
        `Mijoz ${selling} to‘lashga tayyormi?`,
        `Doimiy oylik xarajat ${fixed} shartnoma asosidami, taxminmi?`,
      ],
      recommendations: [
        '3 ta mahalliy do‘kon narxini o‘zingiz qayd eting va AI taxmin qilgan o‘rtacha bilan solishtiring.',
        'Zararsizlikdan past ssenariyda ish boshlash uchun ijara yoki ish haqini kamaytirish variantini model qiling.',
        'Kamida 2-3 oylik doimiy xarajat rezervini alohida hisoblang.',
      ],
      citations: [
        `user.sellingPrice=${product?.sellingPrice ?? 'n/a'}`,
        `user.variableCost=${product?.purchasePrice ?? 'n/a'}`,
        `user.expectedUnits=${units}`,
        `calculated.breakEvenUnits=${be ?? 'n/a'}`,
        `market.provenance=${context.market.provenance}`,
        `user.availableCapital=${context.business.availableCapital}`,
      ],
    };
  }

  async chat(
    context: BusinessAIContext,
    question: string,
  ): Promise<CopilotReply> {
    await Promise.resolve();
    const normalized = question.toLowerCase();
    const product = context.products[0];
    const be = context.financials.breakEvenUnits;
    const contribution = formatUzs(context.financials.contributionMargin);
    const fixed = formatUzs(context.financials.operatingExpenses);

    if (
      normalized.includes('break-even') ||
      normalized.includes('zararsiz') ||
      normalized.includes('nuqta')
    ) {
      return {
        answer: `Sizning modellashtirilgan doimiy oylik xarajatlaringiz ${fixed}, bir dona uchun ulushli marja esa ${contribution}. Bu taxminiy zararsizlik hajmini ${be ?? 'hisoblab bo‘lmaydigan'} donaga olib keladi. Bu AI bashorati emas — formulaga asoslangan hisob.`,
        citations: [
          `calculated.operatingExpenses=${context.financials.operatingExpenses}`,
          `calculated.contributionMargin=${context.financials.contributionMargin}`,
          `calculated.breakEvenUnits=${be ?? 'n/a'}`,
        ],
      };
    }

    if (
      normalized.includes('validate') ||
      normalized.includes('tekshir') ||
      normalized.includes('birinchi')
    ) {
      return {
        answer:
          'Avval uchta foydalanuvchi taxminini tekshiring: 1) kutilayotgan oylik savdo, 2) yetkazib beruvchi tannarxi, 3) mijozning to‘lashga tayyorligi. Bozor raqamlari hozircha AI taxmini.',
        citations: [
          `user.expectedUnits=${product?.expectedMonthlySales ?? 'n/a'}`,
          `user.purchasePrice=${product?.purchasePrice ?? 'n/a'}`,
          `user.sellingPrice=${product?.sellingPrice ?? 'n/a'}`,
        ],
      };
    }

    return {
      answer: `${context.business.name} modeli bo‘yicha: tushum ${formatUzs(context.financials.revenue)}, sof foyda ${formatUzs(context.financials.netProfit)}, umumiy xavf ${context.risks.overallLevel} (${context.risks.overallScore}/100). Savolingiz: "${question}". Javob faqat kiritilgan va hisoblangan kontekstga tayanadi.`,
      citations: [
        `calculated.revenue=${context.financials.revenue}`,
        `calculated.netProfit=${context.financials.netProfit}`,
        `risk.overall=${context.risks.overallLevel}`,
      ],
    };
  }

  async estimateProductNumbers(
    input: ProductEstimateInput,
  ): Promise<ProductEstimate> {
    await Promise.resolve();
    const base =
      CATEGORY_ESTIMATE_DEFAULTS[input.category] ??
      CATEGORY_ESTIMATE_DEFAULTS.OTHER;
    return {
      ...base,
      reasoningUz: `Bu "${input.category}" kategoriyasi uchun ${input.region} hududiga mo'ljallangan o'rtacha namunaviy raqamlar (mock rejim — real AI ulanmagan). "${input.productName}" uchun aniqroq raqamlarni bozordan o'zingiz tekshiring.`,
    };
  }

  async estimateMarketContext(
    input: MarketContextEstimateInput,
  ): Promise<MarketContextEstimate> {
    await Promise.resolve();
    const base =
      CATEGORY_ESTIMATE_DEFAULTS[input.category] ??
      CATEGORY_ESTIMATE_DEFAULTS.OTHER;
    const averagePrice = Math.round((base.purchasePrice + base.sellingPrice) / 2);
    return {
      averagePrice,
      minPrice: Math.round(base.sellingPrice * 0.85),
      maxPrice: Math.round(base.sellingPrice * 1.2),
      trendPercent: 0,
      competitorCount: 3,
      demandScore: 55,
      demandTrend: 'STABLE',
      reasoningUz: `Bu "${input.category}" kategoriyasi va ${input.region} hududi uchun AI taxmini (mock rejim — real AI ulanmagan). Tasdiqlangan real vaqt ma'lumoti emas.`,
    };
  }
}
