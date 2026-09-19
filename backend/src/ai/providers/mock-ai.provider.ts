import {
  AIInsightPayload,
  AIProvider,
  BusinessAIContext,
  CopilotReply,
  ProductEstimate,
  ProductEstimateInput,
  formatUzs,
} from '../ai.types';
import {
  MarketResearchInput,
  MarketResearchPayload,
} from '../../market-research/market-research.types';

const CATEGORY_ESTIMATE_DEFAULTS: Record<
  string,
  {
    purchasePrice: number;
    sellingPrice: number;
    expectedMonthlySales: number;
    estimatedMonthlyFixedCost: number;
  }
> = {
  GROCERY: {
    purchasePrice: 15000,
    sellingPrice: 20000,
    expectedMonthlySales: 300,
    estimatedMonthlyFixedCost: 12_000_000,
  },
  CLOTHING: {
    purchasePrice: 100000,
    sellingPrice: 150000,
    expectedMonthlySales: 60,
    estimatedMonthlyFixedCost: 15_000_000,
  },
  RESTAURANT: {
    purchasePrice: 15000,
    sellingPrice: 35000,
    expectedMonthlySales: 400,
    estimatedMonthlyFixedCost: 25_000_000,
  },
  COFFEE_SHOP: {
    purchasePrice: 5000,
    sellingPrice: 15000,
    expectedMonthlySales: 500,
    estimatedMonthlyFixedCost: 18_000_000,
  },
  PHARMACY: {
    purchasePrice: 8000,
    sellingPrice: 12000,
    expectedMonthlySales: 400,
    estimatedMonthlyFixedCost: 14_000_000,
  },
  ELECTRONICS: {
    purchasePrice: 800000,
    sellingPrice: 1000000,
    expectedMonthlySales: 20,
    estimatedMonthlyFixedCost: 20_000_000,
  },
  BEAUTY: {
    purchasePrice: 30000,
    sellingPrice: 60000,
    expectedMonthlySales: 100,
    estimatedMonthlyFixedCost: 10_000_000,
  },
  EDUCATION: {
    purchasePrice: 0,
    sellingPrice: 300000,
    expectedMonthlySales: 30,
    estimatedMonthlyFixedCost: 12_000_000,
  },
  AGRICULTURE: {
    purchasePrice: 3000,
    sellingPrice: 5000,
    expectedMonthlySales: 1000,
    estimatedMonthlyFixedCost: 8_000_000,
  },
  CONSTRUCTION: {
    purchasePrice: 50000,
    sellingPrice: 70000,
    expectedMonthlySales: 100,
    estimatedMonthlyFixedCost: 10_000_000,
  },
  SERVICES: {
    purchasePrice: 0,
    sellingPrice: 100000,
    expectedMonthlySales: 50,
    estimatedMonthlyFixedCost: 8_000_000,
  },
  ECOMMERCE: {
    purchasePrice: 50000,
    sellingPrice: 80000,
    expectedMonthlySales: 80,
    estimatedMonthlyFixedCost: 6_000_000,
  },
  OTHER: {
    purchasePrice: 30000,
    sellingPrice: 50000,
    expectedMonthlySales: 100,
    estimatedMonthlyFixedCost: 10_000_000,
  },
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
      marketExplanation: `Bozor bloki ${context.market.provenance} manbasiga tayanadi. O‘rtacha narx ${context.market.averagePrice ? formatUzs(context.market.averagePrice) : 'yo‘q'}, raqobatchilar soni ${context.market.competitorCount}, talab balli ${context.market.demandScore !== null ? `${context.market.demandScore}/100` : 'noma’lum'}.`,
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
      normalized.includes('raqobatchi') ||
      normalized.includes('competitor') ||
      normalized.includes('konkurent')
    ) {
      const list = context.market.competitors;
      if (list.length === 0) {
        return {
          answer:
            "Hozircha hech qanday raqobatchi ma'lumoti yo'q — \"Bozor tahlili\" bo'limida o'zingiz qo'shing yoki tizim avtomatik veb-qidiruvni yakunlashini kuting.",
          citations: ['market.competitorCount=0'],
        };
      }
      const names = list
        .map(
          (c) =>
            `${c.name} (${c.price > 0 ? formatUzs(c.price) : 'narxi noma’lum'}${c.location ? `, ${c.location}` : ''}${c.contact ? `, kontakt: ${c.contact}` : c.sourceUrl ? `, havola: ${c.sourceUrl}` : ''})`,
        )
        .join('; ');
      return {
        answer: `Hozircha ${list.length} ta raqobatchi qayd etilgan: ${names}.`,
        citations: list.map((c) => `competitor.${c.source}=${c.name}`),
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

  async researchMarket(
    input: MarketResearchInput,
  ): Promise<MarketResearchPayload> {
    await Promise.resolve();
    return {
      competitors: [],
      demandScore: null,
      demandTrend: null,
      trendPercent: null,
      summaryUz: `${input.category} kategoriyasi bo'yicha ${input.city}, ${input.region} uchun avtomatik bozor tadqiqoti ishga tushmadi (mock rejim — real AI ulanmagan, ${input.searchResults.length} ta veb natija topildi lekin tahlil qilinmadi).`,
    };
  }
}
