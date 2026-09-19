import type { Plan } from "@/types/api";

export type BillingPeriod = "month" | "year";

export interface PlanDefinition {
  id: Plan;
  name: string;
  tagline: string;
  audience: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlighted: boolean;
  businessLimit: number | null;
  features: string[];
  missing: string[];
  cta: string;
}

export type ComparisonFormat = "text" | "bool" | "money";

export interface PlanComparisonRow {
  label: string;
  format: ComparisonFormat;
  values: Record<string, string | boolean | number>;
}

export interface PricingPageContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  settingsTitle: string;
  settingsSubtitle: string;
  yearlyHint: string;
  monthlyToggle: string;
  yearlyToggle: string;
  highlightedBadge: string;
  freeForever: string;
  perMonth: string;
  perYear: string;
  currentPlanLabel: string;
  comparisonFeatureLabel: string;
  comparisonLimitLabel: string;
  comparisonMonthlyLabel: string;
  comparisonYearlyLabel: string;
  unlimitedLabel: string;
  highlights: Array<{ title: string; body: string }>;
  faqs: Array<{ q: string; a: string }>;
}

export interface PublicPlansResponse {
  plans: PlanDefinition[];
  comparison: PlanComparisonRow[];
  page: PricingPageContent;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Bepul",
    tagline: "G‘oyani 10 daqiqada sinab ko‘ring",
    audience: "Yangi tadbirkor",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlighted: false,
    businessLimit: 1,
    features: [
      "1 ta biznes modeli",
      "Tushum, marja va zararsizlik kalkulyatori",
      "Kredit va soliq hisob-kitobi",
      "1 ta biznes-reja hujjati",
      "Kirish darajasidagi AI izohi",
    ],
    missing: ["Ssenariy tahlili", "Cheksiz AI copilot", "Jamoa va API"],
    cta: "Bepul boshlash",
  },
  {
    id: "PRO",
    name: "Pro",
    tagline: "Pul tikishdan oldin raqamni ko‘ring",
    audience: "Faol KOB egasi",
    monthlyPrice: 99_000,
    yearlyPrice: 990_000,
    highlighted: true,
    businessLimit: 5,
    features: [
      "5 tagacha biznes",
      "Cheksiz biznes-reja hujjatlari",
      "Pessimistik / baza / optimistik ssenariy",
      "To‘liq AI tahlil va copilot",
      "Xavf ballari va bozor taxmini",
      "Kredit + soliq kalkulyatori",
    ],
    missing: ["Jamoa, API va maxsus shablon"],
    cta: "Pro ni tanlash",
  },
  {
    id: "BUSINESS",
    name: "Business",
    tagline: "Jamoa, maslahatchi va tarmoq uchun",
    audience: "Maslahatchi va o‘suvchi tarmoq",
    monthlyPrice: 299_000,
    yearlyPrice: 2_990_000,
    highlighted: false,
    businessLimit: null,
    features: [
      "Cheksiz bizneslar",
      "Pro dagi barcha imkoniyatlar",
      "Jamoa va rollar (yo‘l xaritasi)",
      "API va kengaytirilgan analitika",
      "Maxsus biznes-reja shabloni",
      "Ustuvor qo‘llab-quvvatlash",
    ],
    missing: [],
    cta: "Business ni tanlash",
  },
];

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Bepul",
  PRO: "Pro",
  BUSINESS: "Business",
};

export const DEFAULT_PRICING_PAGE: PricingPageContent = {
  eyebrow: "Tariflar va foyda",
  title: "Platforma qanday pul topadi — va sizga nima qoladi",
  subtitle:
    "Maslahatchidan biznes-reja 3–8 mln so‘m. Pro yillik tarif shu xizmatning bir qismini doimiy yangilab beradi. To‘lov shlyuzi hozircha demo: arxitektura tayyor, karta yechilmaydi.",
  settingsTitle: "Tarifni tanlang",
  settingsSubtitle:
    "To‘lov shlyuzi hozircha demo: tarifni tanlasangiz, biznes limiti darhol yangilanadi. Karta yechilmaydi.",
  yearlyHint: "Yillik to‘lovda 2 oy bepul.",
  monthlyToggle: "Oylik",
  yearlyToggle: "Yillik · 2 oy bepul",
  highlightedBadge: "Eng ko‘p tanlanadi",
  freeForever: "Doim bepul",
  perMonth: "oyiga",
  perYear: "yiliga",
  currentPlanLabel: "Joriy tarif",
  comparisonFeatureLabel: "Imkoniyat",
  comparisonLimitLabel: "Bizneslar soni",
  comparisonMonthlyLabel: "Oylik narx",
  comparisonYearlyLabel: "Yillik narx",
  unlimitedLabel: "Cheksiz",
  highlights: [
    {
      title: "Mijoz uchun foyda",
      body: "Bitta yomon investitsiyani oldini olish 10–50 mln so‘mni saqlab qolishi mumkin. Pro oyiga 99 ming so‘m.",
    },
    {
      title: "Freemium voronkasi",
      body: "Bepulda g‘oya sinovdan o‘tadi. Maqsad: 8–10% foydalanuvchi Pro ga o‘tadi — qiymatni ko‘rgach to‘laydi.",
    },
    {
      title: "1-yillik maqsad",
      body: "1 000 Pro + 100 Business ≈ 129 mln so‘m/oy takrorlanuvchi tushum. Yillik tarif LTV ni oshiradi.",
    },
  ],
  faqs: [
    {
      q: "Nega pul to‘lashadi?",
      a: "Bepul tarif g‘oyani ochadi. Pro esa bir nechta biznes, ssenariy va AI copilotni beradi — maslahatchiga 3–8 mln to‘lashdan arzonroq.",
    },
    {
      q: "Qanday foyda chiqadi?",
      a: "Asosiy tushum Pro va Business obunasidan. Yillik to‘lov 2 oy bepul: LTV oshadi, churn kamayadi. Keyingi bosqich — maslahatchilar uchun white-label.",
    },
    {
      q: "To‘lov hozir ishlaydimi?",
      a: "Yo‘q. MVP da tariflar va limitlar tayyor, karta shlyuzi keyingi sprint. Demo rejimida Sozlamalardan tarifni almashtirish mumkin.",
    },
    {
      q: "Bepul foydalanuvchi nima qila oladi?",
      a: "1 ta biznes, kalkulyator, kredit/soliq va bitta biznes-reja. Limitga yetganda Pro ga o‘tish taklif qilinadi.",
    },
  ],
};

export function buildPlanComparison(
  plans: PlanDefinition[],
  page: PricingPageContent = DEFAULT_PRICING_PAGE,
): PlanComparisonRow[] {
  const valuesFor = (pick: (plan: PlanDefinition) => string | boolean | number) =>
    Object.fromEntries(plans.map((plan) => [plan.id, pick(plan)]));

  const rows: PlanComparisonRow[] = [
    {
      label: page.comparisonLimitLabel,
      format: "text",
      values: valuesFor((plan) =>
        plan.businessLimit === null ? page.unlimitedLabel : String(plan.businessLimit),
      ),
    },
    {
      label: page.comparisonMonthlyLabel,
      format: "money",
      values: valuesFor((plan) => plan.monthlyPrice),
    },
    {
      label: page.comparisonYearlyLabel,
      format: "money",
      values: valuesFor((plan) => plan.yearlyPrice),
    },
  ];

  const seen = new Set<string>();
  for (const plan of plans) {
    for (const feature of plan.features) {
      if (seen.has(feature)) continue;
      seen.add(feature);
      rows.push({
        label: feature,
        format: "bool",
        values: valuesFor((item) => item.features.includes(feature)),
      });
    }
  }
  return rows;
}

export function getPlan(id: Plan | null | undefined): PlanDefinition {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

export function planPrice(plan: PlanDefinition, period: BillingPeriod): number {
  return period === "year" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function monthlyEquivalent(plan: PlanDefinition): number {
  return Math.round(plan.yearlyPrice / 12);
}

export function canCreateBusiness(plan: Plan | null | undefined, count: number): boolean {
  const limit = getPlan(plan).businessLimit;
  if (limit === null) return true;
  return count < limit;
}

export function businessLimitLabel(plan: Plan | null | undefined): string {
  const limit = getPlan(plan).businessLimit;
  return limit === null ? "cheksiz" : String(limit);
}
