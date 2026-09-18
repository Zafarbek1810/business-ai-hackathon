import { FinanceResult } from '../../finance/engine/finance.engine';

export type SkillPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SkillRecommendation {
  skill: string;
  reasonUz: string;
  priority: SkillPriority;
  actionHref?: string;
  actionLabel?: string;
}

type RiskInput = { overallLevel: string } | null;

/**
 * Hisoblangan moliyaviy ko'rsatkichlar asosida foydalanuvchiga o'rganishi
 * kerak bo'lgan moliyaviy ko'nikmalarni tavsiya qiladi. Deterministik
 * qoida-asosidagi mexanizm (AI emas) — finance.engine.ts bilan bir xil
 * uslubda, pure function.
 */
export function recommendSkills(
  finance: FinanceResult,
  risk: RiskInput,
): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = [];

  if (finance.grossMargin !== null && finance.grossMargin < 0.2) {
    recommendations.push({
      skill: 'Narx belgilash strategiyasi',
      reasonUz: `Yalpi marjangiz ${(finance.grossMargin * 100).toFixed(1)}% — bu past. Narx belgilash asoslarini o'rganish tavsiya etiladi.`,
      priority: 'HIGH',
    });
  }

  if (finance.netProfit < 0) {
    recommendations.push({
      skill: "Xarajatlarni boshqarish va qisqartirish",
      reasonUz: `Modellashtirilgan sof foydangiz manfiy (${Math.round(finance.netProfit).toLocaleString('uz-UZ')} so'm). Doimiy va o'zgaruvchan xarajatlarni tahlil qilish kerak.`,
      priority: 'HIGH',
    });
  }

  if (finance.cashCoverageMonths !== null && finance.cashCoverageMonths < 2) {
    recommendations.push({
      skill: 'Kassa oqimini boshqarish (cash flow)',
      reasonUz: `Mavjud kapitalingiz doimiy xarajatlarni taxminan ${finance.cashCoverageMonths.toFixed(1)} oy qoplaydi — bu kam zaxira. Kassa rejalashtirish ko'nikmasi muhim.`,
      priority: finance.cashCoverageMonths < 1 ? 'HIGH' : 'MEDIUM',
    });
  }

  if (finance.roiAnnualEstimate !== null && finance.roiAnnualEstimate < 0.15) {
    recommendations.push({
      skill: "Investitsiya qaytimini (ROI) oshirish usullari",
      reasonUz: `Yillik taxminiy ROI ${(finance.roiAnnualEstimate * 100).toFixed(1)}% — past. Investitsiya samaradorligini oshirish yo'llarini o'rganing.`,
      priority: 'MEDIUM',
    });
  }

  if (risk?.overallLevel === 'HIGH') {
    recommendations.push({
      skill: 'Biznes xavflarini boshqarish',
      reasonUz:
        "Umumiy xavf darajangiz YUQORI baholandi. Xavflarni aniqlash va kamaytirish usullarini o'rganish tavsiya etiladi.",
      priority: 'HIGH',
    });
  }

  recommendations.push({
    skill: 'Kredit va qarz yukini rejalashtirish asoslari',
    reasonUz:
      "Har qanday tashqi moliyalashtirish qarorida oylik to'lov yukini oldindan hisoblash muhim.",
    priority: 'MEDIUM',
    actionHref: '/dashboard/finance?tab=credit',
    actionLabel: 'Kredit kalkulyatorini sinash',
  });

  recommendations.push({
    skill: 'Soliq rejalashtirish asoslari',
    reasonUz:
      "Biznes shaklingiz (YATT/MCHJ) bo'yicha soliq yukini oldindan bilish moliyaviy rejani aniqlashtiradi.",
    priority: 'MEDIUM',
    actionHref: '/dashboard/finance?tab=tax',
    actionLabel: 'Soliq kalkulyatorini sinash',
  });

  if (recommendations.length === 2) {
    recommendations.unshift({
      skill: 'Oylik moliyaviy monitoring odati',
      reasonUz:
        "Asosiy ko'rsatkichlaringiz barqaror ko'rinadi. Shu holatni saqlash uchun oylik moliyaviy monitoring odatini shakllantiring.",
      priority: 'LOW',
    });
  }

  return recommendations;
}
