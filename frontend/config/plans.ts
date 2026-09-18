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

export const PLAN_COMPARISON = [
  { label: "Bizneslar soni", values: { FREE: "1", PRO: "5", BUSINESS: "Cheksiz" } },
  { label: "Moliyaviy kalkulyator", values: { FREE: true, PRO: true, BUSINESS: true } },
  { label: "Kredit va soliq", values: { FREE: true, PRO: true, BUSINESS: true } },
  { label: "Biznes-reja hujjati", values: { FREE: "1 ta", PRO: "Cheksiz", BUSINESS: "Cheksiz" } },
  { label: "Ssenariy tahlili", values: { FREE: false, PRO: true, BUSINESS: true } },
  { label: "To‘liq AI tahlil", values: { FREE: false, PRO: true, BUSINESS: true } },
  { label: "Xavf tahlili", values: { FREE: false, PRO: true, BUSINESS: true } },
  { label: "Jamoa va API", values: { FREE: false, PRO: false, BUSINESS: true } },
] as const;

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Bepul",
  PRO: "Pro",
  BUSINESS: "Business",
};

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
