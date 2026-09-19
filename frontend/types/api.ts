export type Role = "USER" | "ADMIN" | "ANALYST" | "BUSINESS_CONSULTANT" | "ENTERPRISE";
export type Plan = "FREE" | "PRO" | "BUSINESS";
export type BusinessCategory =
  | "GROCERY"
  | "CLOTHING"
  | "RESTAURANT"
  | "COFFEE_SHOP"
  | "PHARMACY"
  | "ELECTRONICS"
  | "BEAUTY"
  | "EDUCATION"
  | "AGRICULTURE"
  | "CONSTRUCTION"
  | "SERVICES"
  | "ECOMMERCE"
  | "OTHER";

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  GROCERY: "Oziq-ovqat",
  CLOTHING: "Kiyim-kechak",
  RESTAURANT: "Restoran",
  COFFEE_SHOP: "Qahvaxona",
  PHARMACY: "Dorixona",
  ELECTRONICS: "Elektronika",
  BEAUTY: "Go‘zallik",
  EDUCATION: "Ta’lim",
  AGRICULTURE: "Qishloq xo‘jaligi",
  CONSTRUCTION: "Qurilish",
  SERVICES: "Xizmatlar",
  ECOMMERCE: "Elektron tijorat",
  OTHER: "Boshqa",
};

export const REGIONS = [
  "Xorazm",
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Andijon",
  "Farg‘ona",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Jizzax",
  "Sirdaryo",
  "Navoiy",
  "Qoraqalpog‘iston",
];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
  locale: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Foydalanuvchi",
  ADMIN: "Admin",
  ANALYST: "Tahlilchi",
  BUSINESS_CONSULTANT: "Maslahatchi",
  ENTERPRISE: "Korxona",
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
  locale: string;
  createdAt: string;
  updatedAt: string;
  _count: { businesses: number };
}

export interface AdminDashboard {
  totalUsers: number;
  activeBusinesses: number;
  analysesCreated: number;
  aiAnalyses: number;
  reports: number;
  popularCategories: Array<{ category: string; _count: { category: number } }>;
  planBreakdown: Array<{
    plan: Plan;
    name: string;
    users: number;
    businesses: number;
    estimatedMrr: number;
  }>;
  recentUsers: AdminUser[];
}

export interface PlanStats {
  plans: Array<{
    id: Plan;
    name: string;
    tagline: string;
    monthlyPrice: number;
    yearlyPrice: number;
    businessLimit: number | null;
    users: number;
    businesses: number;
    estimatedMrr: number;
    share: number;
  }>;
  totalUsers: number;
  paidUsers: number;
  estimatedMrr: number;
  estimatedArr: number;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string | null;
}

export interface BusinessProduct {
  id?: string;
  name: string;
  purchasePrice: number | string;
  sellingPrice: number | string;
  expectedMonthlySales: number;
}

export interface BusinessExpense {
  id?: string;
  kind: "FIXED" | "VARIABLE";
  category: string;
  label: string;
  amount: number | string;
}

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  country: string;
  region: string;
  city: string;
  availableCapital: number | string;
  startDate: string;
  description?: string | null;
  isDemo: boolean;
  products: BusinessProduct[];
  expenses: BusinessExpense[];
  scenarios?: Scenario[];
  risks?: RiskAnalysis[];
  snapshots?: FinanceSnapshot[];
}

export interface FinanceResult {
  revenue: number;
  cogs: number;
  productCogs: number;
  variableOverheads: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number | null;
  operatingMargin: number | null;
  contributionMargin: number;
  breakEvenUnits: number | null;
  breakEvenRevenue: number | null;
  roiAnnualEstimate: number | null;
  cashCoverageMonths: number | null;
  valid: boolean;
  warnings: Array<{ code: string; message: string }>;
}

export interface LoanScheduleEntry {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: LoanScheduleEntry[];
  valid: boolean;
  warnings: Array<{ code: string; message: string }>;
}

export type TaxEntityType = "YATT" | "MCHJ";
export type MchjRegime = "SIMPLIFIED" | "GENERAL";

export interface TaxResult {
  entityType: TaxEntityType;
  mchjRegime: MchjRegime | null;
  taxAmount: number;
  vatEstimate: number | null;
  effectiveRate: number | null;
  netIncome: number;
  valid: boolean;
  warnings: Array<{ code: string; message: string }>;
  disclaimers: string[];
}

export interface Scenario {
  id: string;
  type: "PESSIMISTIC" | "BASE" | "OPTIMISTIC";
  monthlyUnits: number;
  sellingPrice: number | string;
  variableCost: number | string;
  fixedCosts: number | string;
  revenue: number | string;
  costs: number | string;
  profit: number | string;
  breakEvenUnits: number | string;
  cashRequirement: number | string;
}

export interface RiskItem {
  key: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasonUz: string;
  reasonRu: string;
  reasonEn: string;
}

export interface RiskAnalysis {
  id: string;
  overallScore: number;
  overallLevel: "LOW" | "MEDIUM" | "HIGH";
  items: RiskItem[];
  createdAt: string;
}

export interface FinanceSnapshot {
  id: string;
  revenue: number | string;
  netProfit: number | string;
  breakEvenUnits: number | string | null;
}

export interface RadarResponse {
  business: Business;
  market: {
    provenance: string;
    productId: string | null;
    nameUz: string | null;
    averagePrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    trendPercent: number | null;
    competitorCount: number;
    competitors: Array<{
      name: string;
      price: number;
      location: string | null;
      source: "USER" | "AI_WEB" | "MAP";
    }>;
    demandScore: number | null;
    demandTrend: string | null;
    seasonalFactor: number | null;
    summaryUz: string | null;
    labeledDemo: boolean;
  };
  finance: FinanceResult;
  scenarios: Scenario[];
  risks: RiskAnalysis | null;
  provenance: Record<string, string>;
}

export interface AIInsight {
  type?: string;
  summary: string;
  marketExplanation: string;
  financialExplanation: string;
  opportunities: string[];
  risks: string[];
  validationQuestions: string[];
  recommendations: string[];
  citations: string[];
  provider: string;
  usedFallback: boolean;
}

export interface CopilotReply {
  answer: string;
  citations: string[];
  provider: string;
  usedFallback: boolean;
}

export interface Competitor {
  id: string;
  businessId: string;
  name: string;
  price: number | string;
  location: string | null;
  rating: number | string | null;
  source: "USER" | "AI_WEB" | "MAP";
  createdAt: string;
}

export interface BusinessReport {
  id: string;
  title: string;
  sections: Record<string, unknown>;
  createdAt: string;
  business?: { name: string; isDemo: boolean };
}
