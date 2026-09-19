import { BusinessCategory } from '@prisma/client';

export type TaxEntityType = 'YATT' | 'MCHJ';
export type MchjRegime = 'SIMPLIFIED' | 'GENERAL';

export interface TaxInput {
  entityType: TaxEntityType;
  revenue: number;
  expenses?: number;
  mchjRegime?: MchjRegime;
  category?: BusinessCategory;
  isVatPayer?: boolean;
  /**
   * Foydalanuvchi o'zi bilgan/tasdiqlagan soliq yengilligi foizi (0-100), masalan
   * IT Park rezidentligi, yangi tadbirkor uchun boshlang'ich davr yengilligi yoki
   * hududiy imtiyoz. Aniq foizni va shartlarni soliq.uz yoki soliq inspeksiyasidan
   * tekshiring — bu yerda faqat foydalanuvchi kiritgan qiymat qo'llaniladi, tizim
   * hech qanday yengillikni avtomatik aniqlamaydi yoki taxmin qilmaydi.
   */
  benefitPercent?: number;
}

export interface TaxWarning {
  code: string;
  message: string;
}

export interface TaxResult {
  entityType: TaxEntityType;
  mchjRegime: MchjRegime | null;
  taxAmount: number;
  vatEstimate: number | null;
  effectiveRate: number | null;
  netIncome: number;
  valid: boolean;
  warnings: TaxWarning[];
  disclaimers: string[];
  benefitPercent: number;
  benefitAmount: number;
}

const MAX_SAFE_BUSINESS_NUMBER = 1e15;

/**
 * Namunaviy stavkalar (O'zbekiston KOB uchun soddalashtirilgan model, 2025-2026
 * hujjatlariga asoslangan taxminiy qiymatlar). Real hisob-kitob uchun amaldagi
 * Soliq kodeksi va soliq.uz'dagi joriy qiymatlar tekshirilishi shart.
 */
export const MCHJ_SIMPLIFIED_RATE = 0.04;
export const MCHJ_GENERAL_PROFIT_RATE = 0.15;
export const VAT_RATE = 0.12;
export const SIMPLIFIED_ANNUAL_THRESHOLD = 1_000_000_000;

/**
 * YATT uchun qat'iy belgilangan (patentga o'xshash) oylik soliq — hudud va aniq
 * faoliyat turiga qarab farq qiladi, shuning uchun bu faqat kategoriya bo'yicha
 * namunaviy o'rtacha qiymat. Aniq summani soliq.uz yoki hududiy soliq
 * inspeksiyasidan tekshiring.
 */
export const YATT_FIXED_RATES: Record<BusinessCategory, number> = {
  GROCERY: 880000,
  CLOTHING: 880000,
  RESTAURANT: 1100000,
  COFFEE_SHOP: 990000,
  PHARMACY: 990000,
  ELECTRONICS: 990000,
  BEAUTY: 770000,
  EDUCATION: 660000,
  AGRICULTURE: 550000,
  CONSTRUCTION: 990000,
  SERVICES: 770000,
  ECOMMERCE: 880000,
  OTHER: 770000,
};

function isInvalidNumber(value: number): boolean {
  return !Number.isFinite(value) || Math.abs(value) > MAX_SAFE_BUSINESS_NUMBER;
}

export function roundMoney(value: number, digits = 2): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function invalidResult(
  input: TaxInput,
  warnings: TaxWarning[],
): TaxResult {
  return {
    entityType: input.entityType,
    mchjRegime: input.mchjRegime ?? null,
    taxAmount: 0,
    vatEstimate: null,
    effectiveRate: null,
    netIncome: 0,
    valid: false,
    warnings,
    disclaimers: [],
    benefitPercent: 0,
    benefitAmount: 0,
  };
}

function applyBenefit(
  taxAmount: number,
  benefitPercent: number | undefined,
): { finalTax: number; clampedPercent: number; benefitAmount: number } {
  const clampedPercent = Math.min(100, Math.max(0, benefitPercent ?? 0));
  if (clampedPercent === 0) {
    return { finalTax: taxAmount, clampedPercent: 0, benefitAmount: 0 };
  }
  const benefitAmount = roundMoney(taxAmount * (clampedPercent / 100));
  return {
    finalTax: roundMoney(taxAmount - benefitAmount),
    clampedPercent,
    benefitAmount,
  };
}

export function calculateTax(input: TaxInput): TaxResult {
  const warnings: TaxWarning[] = [];
  const expenses = input.expenses ?? 0;

  const fields: Array<[string, number]> = [
    ['revenue', input.revenue],
    ['expenses', expenses],
  ];
  for (const [name, value] of fields) {
    if (isInvalidNumber(value)) {
      warnings.push({
        code: 'INVALID_NUMBER',
        message: `${name} is not a usable number.`,
      });
    }
    if (value < 0) {
      warnings.push({
        code: 'NEGATIVE_VALUE',
        message: `${name} cannot be negative.`,
      });
    }
  }

  if (input.entityType !== 'YATT' && input.entityType !== 'MCHJ') {
    warnings.push({
      code: 'INVALID_ENTITY_TYPE',
      message: 'entityType must be YATT or MCHJ.',
    });
    return invalidResult(input, warnings);
  }

  if (warnings.length > 0) {
    return invalidResult(input, warnings);
  }

  if (input.entityType === 'YATT') {
    if (!input.category) {
      warnings.push({
        code: 'MISSING_CATEGORY',
        message: 'category is required for YATT fixed tax lookup.',
      });
      return invalidResult(input, warnings);
    }
    const baseTaxAmount = YATT_FIXED_RATES[input.category];
    const { finalTax, clampedPercent, benefitAmount } = applyBenefit(
      baseTaxAmount,
      input.benefitPercent,
    );
    const netIncome = roundMoney(input.revenue - finalTax);
    const effectiveRate =
      input.revenue === 0 ? null : roundMoney(finalTax / input.revenue, 6);

    const yattDisclaimers = [
      `Bu ${input.category} kategoriyasi uchun namunaviy oylik qat'iy soliq summasi (${baseTaxAmount.toLocaleString('uz-UZ')} so'm). YATT solig'i tushumingizga emas, hudud va faoliyat turiga qarab soliq idorasi tomonidan belgilanadi.`,
      "Aniq stavkangizni soliq.uz portali yoki hududiy soliq inspeksiyasidan albatta tekshiring.",
    ];
    if (clampedPercent > 0) {
      yattDisclaimers.push(
        `Siz kiritgan ${clampedPercent}% yengillik qo'llanildi (${benefitAmount.toLocaleString('uz-UZ')} so'm kamaytirildi) — bu foydalanuvchi tomonidan kiritilgan qiymat, tizim yengillikka huquqni avtomatik tekshirmaydi. Huquqingizni (masalan IT Park rezidentligi, boshlang'ich davr yengilligi yoki hududiy imtiyoz) soliq.uz yoki soliq inspeksiyasidan tasdiqlang.`,
      );
    }

    return {
      entityType: 'YATT',
      mchjRegime: null,
      taxAmount: finalTax,
      vatEstimate: null,
      effectiveRate,
      netIncome,
      valid: true,
      warnings,
      disclaimers: yattDisclaimers,
      benefitPercent: clampedPercent,
      benefitAmount,
    };
  }

  // MCHJ
  if (input.mchjRegime !== 'SIMPLIFIED' && input.mchjRegime !== 'GENERAL') {
    warnings.push({
      code: 'INVALID_REGIME',
      message: 'mchjRegime must be SIMPLIFIED or GENERAL for MCHJ.',
    });
    return invalidResult(input, warnings);
  }

  const disclaimers: string[] = [];

  if (input.mchjRegime === 'SIMPLIFIED') {
    const baseTaxAmount = roundMoney(input.revenue * MCHJ_SIMPLIFIED_RATE);
    const { finalTax, clampedPercent, benefitAmount } = applyBenefit(
      baseTaxAmount,
      input.benefitPercent,
    );
    const netIncome = roundMoney(input.revenue - finalTax);
    const effectiveRate =
      input.revenue === 0 ? null : roundMoney(finalTax / input.revenue, 6);

    if (input.revenue * 12 > SIMPLIFIED_ANNUAL_THRESHOLD) {
      disclaimers.push(
        `Yillik aylanmangiz taxminan yagona soliq chegarasidan (${SIMPLIFIED_ANNUAL_THRESHOLD.toLocaleString('uz-UZ')} so'm/yil) oshishi mumkin — bu holda umumiy soliq tartibiga o'tish talab qilinishi mumkin.`,
      );
    }
    disclaimers.push(
      "Yagona soliq stavkasi (4%) namunaviy — joriy stavkani soliq.uz'dan tekshiring.",
    );
    if (clampedPercent > 0) {
      disclaimers.push(
        `Siz kiritgan ${clampedPercent}% yengillik qo'llanildi (${benefitAmount.toLocaleString('uz-UZ')} so'm kamaytirildi) — bu foydalanuvchi tomonidan kiritilgan qiymat, tizim yengillikka huquqni avtomatik tekshirmaydi. Huquqingizni soliq.uz yoki soliq inspeksiyasidan tasdiqlang.`,
      );
    }

    return {
      entityType: 'MCHJ',
      mchjRegime: 'SIMPLIFIED',
      taxAmount: finalTax,
      vatEstimate: null,
      effectiveRate,
      netIncome,
      valid: true,
      warnings,
      disclaimers,
      benefitPercent: clampedPercent,
      benefitAmount,
    };
  }

  // GENERAL
  if (expenses === 0) {
    disclaimers.push(
      'Xarajat kiritilmadi — soliq solinadigan baza to‘liq tushumga teng deb hisoblandi.',
    );
  }
  const taxableBase = Math.max(0, input.revenue - expenses);
  const baseTaxAmount = roundMoney(taxableBase * MCHJ_GENERAL_PROFIT_RATE);
  const { finalTax, clampedPercent, benefitAmount } = applyBenefit(
    baseTaxAmount,
    input.benefitPercent,
  );
  const netIncome = roundMoney(input.revenue - expenses - finalTax);
  const effectiveRate =
    input.revenue === 0 ? null : roundMoney(finalTax / input.revenue, 6);
  const vatEstimate = input.isVatPayer
    ? roundMoney(input.revenue * VAT_RATE)
    : null;

  disclaimers.push(
    "Foyda solig'i stavkasi (15%) namunaviy — joriy stavkani soliq.uz'dan tekshiring.",
  );
  if (vatEstimate !== null) {
    disclaimers.push(
      `NDS (${(VAT_RATE * 100).toFixed(0)}%) odatda mijozdan alohida undiriladi va sof foydangizga qo'shilmaydi — bu faqat ma'lumot uchun ko'rsatilgan taxminiy summa.`,
    );
  }
  if (clampedPercent > 0) {
    disclaimers.push(
      `Siz kiritgan ${clampedPercent}% yengillik qo'llanildi (${benefitAmount.toLocaleString('uz-UZ')} so'm kamaytirildi) — bu foydalanuvchi tomonidan kiritilgan qiymat, tizim yengillikka huquqni avtomatik tekshirmaydi. Huquqingizni soliq.uz yoki soliq inspeksiyasidan tasdiqlang.`,
    );
  }

  return {
    entityType: 'MCHJ',
    mchjRegime: 'GENERAL',
    taxAmount: finalTax,
    vatEstimate,
    effectiveRate,
    netIncome,
    valid: true,
    warnings,
    disclaimers,
    benefitPercent: clampedPercent,
    benefitAmount,
  };
}
