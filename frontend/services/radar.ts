import { api } from "@/services/api";
import { API_URL, TOKEN_KEY } from "@/config/env";
import type {
  AIInsight,
  AdminDashboard,
  AdminUser,
  AuthResponse,
  Business,
  BusinessReport,
  Competitor,
  CopilotReply,
  FinanceResult,
  LoanResult,
  MchjRegime,
  PlanStats,
  RadarResponse,
  Scenario,
  SystemSetting,
  TaxEntityType,
  TaxResult,
} from "@/types/api";
import type { PlanDefinition, PricingPageContent, PublicPlansResponse } from "@/config/plans";

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: { email: string; password: string; name: string }) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
};

export const businessApi = {
  list: () => api<Business[]>("/businesses"),
  get: (id: string) => api<Business>(`/businesses/${id}`),
  radar: (id: string) => api<RadarResponse>(`/businesses/${id}/radar`),
  create: (payload: unknown) =>
    api<Business>("/businesses", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: unknown) =>
    api<Business>(`/businesses/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => api<{ success: boolean }>(`/businesses/${id}`, { method: "DELETE" }),
};

export const financeApi = {
  calculate: (payload: unknown) =>
    api<FinanceResult>("/finance/calculate", { method: "POST", body: JSON.stringify(payload) }),
  calculateCredit: (payload: { principal: number; annualRatePercent: number; termMonths: number }) =>
    api<LoanResult>("/finance/credit-calculate", { method: "POST", body: JSON.stringify(payload) }),
  calculateTax: (payload: {
    entityType: TaxEntityType;
    revenue: number;
    expenses?: number;
    mchjRegime?: MchjRegime;
    category?: string;
    isVatPayer?: boolean;
  }) => api<TaxResult>("/finance/tax-calculate", { method: "POST", body: JSON.stringify(payload) }),
  scenarios: (businessId: string) => api<Scenario[]>(`/businesses/${businessId}/scenarios`),
  upsertScenario: (businessId: string, payload: { type: string; monthlyUnits: number }) =>
    api<Scenario>(`/businesses/${businessId}/scenarios`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const competitorApi = {
  list: (businessId: string) => api<Competitor[]>(`/businesses/${businessId}/competitors`),
  add: (
    businessId: string,
    payload: { name: string; price: number; location?: string; rating?: number },
  ) =>
    api<Competitor>(`/businesses/${businessId}/competitors`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (businessId: string, competitorId: string) =>
    api<{ success: boolean }>(`/businesses/${businessId}/competitors/${competitorId}`, {
      method: "DELETE",
    }),
};

export const riskApi = {
  analyze: (businessId: string) =>
    api(`/businesses/${businessId}/risks/analyze`, { method: "POST" }),
};

export const aiApi = {
  summary: (businessId: string) =>
    api<AIInsight>("/ai/business-summary", { method: "POST", body: JSON.stringify({ businessId }) }),
  market: (businessId: string) =>
    api<AIInsight>("/ai/market-insights", { method: "POST", body: JSON.stringify({ businessId }) }),
  finance: (businessId: string) =>
    api<AIInsight>("/ai/financial-insights", { method: "POST", body: JSON.stringify({ businessId }) }),
  risks: (businessId: string) =>
    api<AIInsight>("/ai/risk-analysis", { method: "POST", body: JSON.stringify({ businessId }) }),
  validate: (businessId: string) =>
    api<AIInsight>("/ai/validate-assumptions", { method: "POST", body: JSON.stringify({ businessId }) }),
  copilot: (businessId: string, question: string) =>
    api<CopilotReply>("/ai/copilot", { method: "POST", body: JSON.stringify({ businessId, question }) }),
  estimateProduct: (payload: { category: string; region: string; productName: string }) =>
    api<{
      purchasePrice: number;
      sellingPrice: number;
      expectedMonthlySales: number;
      estimatedMonthlyFixedCost: number;
      reasoningUz: string;
      provider: string;
      usedFallback: boolean;
    }>("/ai/estimate-product", { method: "POST", body: JSON.stringify(payload) }),
};

export async function streamAiChat(options: {
  businessId: string;
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const response = await fetch(`${API_URL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      businessId: options.businessId,
      question: options.question,
      history: options.history,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message;
    throw new Error(message || "AI javob bermadi");
  }
  if (!response.body) {
    throw new Error("AI oqimi bo‘sh");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      applySseLine(line, options.onDelta);
    }
  }
  if (buffer.trim()) {
    applySseLine(buffer, options.onDelta);
  }
}

function applySseLine(line: string, onDelta: (text: string) => void) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return;
  const data = trimmed.slice(5).trim();
  if (!data) return;
  try {
    const payload = JSON.parse(data) as { delta?: string; error?: string; done?: boolean };
    if (payload.error) {
      throw new Error(payload.error);
    }
    if (payload.delta) {
      onDelta(payload.delta);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}

export const reportApi = {
  list: () => api<BusinessReport[]>("/reports"),
  get: (id: string) => api<BusinessReport>(`/reports/${id}`),
  create: (businessId: string) =>
    api<BusinessReport>("/reports", { method: "POST", body: JSON.stringify({ businessId }) }),
};

export const usersApi = {
  updatePlan: (plan: "FREE" | "PRO" | "BUSINESS") =>
    api<{ id: string; email: string; name: string; role: string; plan: string; locale: string }>(
      "/users/me/plan",
      { method: "PATCH", body: JSON.stringify({ plan }) },
    ),
};

export const plansApi = {
  public: () => api<PublicPlansResponse>("/plans"),
};

export interface AdminUserPayload {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  plan?: string;
  locale?: string;
}

export const adminApi = {
  dashboard: () => api<AdminDashboard>("/admin/dashboard"),
  users: (params?: { q?: string; role?: string; plan?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.role) search.set("role", params.role);
    if (params?.plan) search.set("plan", params.plan);
    const query = search.toString();
    return api<AdminUser[]>(`/admin/users${query ? `?${query}` : ""}`);
  },
  getUser: (id: string) => api<AdminUser>(`/admin/users/${id}`),
  createUser: (payload: AdminUserPayload) =>
    api<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: AdminUserPayload) =>
    api<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id: string) => api<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  plans: () => api<PlanDefinition[]>("/admin/plans"),
  updatePlans: (plans: PlanDefinition[]) =>
    api<PlanDefinition[]>("/admin/plans", { method: "PATCH", body: JSON.stringify({ plans }) }),
  pricingPage: () => api<PricingPageContent>("/admin/pricing-page"),
  updatePricingPage: (page: PricingPageContent) =>
    api<PricingPageContent>("/admin/pricing-page", { method: "PATCH", body: JSON.stringify(page) }),
  planStats: () => api<PlanStats>("/admin/plan-stats"),
  settings: () => api<SystemSetting[]>("/admin/settings"),
  updateSettings: (items: Array<{ key: string; value: string }>) =>
    api<SystemSetting[]>("/admin/settings", { method: "PATCH", body: JSON.stringify({ items }) }),
  updateProfile: (payload: { name?: string; password?: string }) =>
    api<{ id: string; email: string; name: string; role: string; plan: string; locale: string }>(
      "/admin/profile",
      { method: "PATCH", body: JSON.stringify(payload) },
    ),
};
