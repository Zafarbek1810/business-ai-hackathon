import { api } from "@/services/api";
import { API_URL, TOKEN_KEY } from "@/config/env";
import type {
  AIInsight,
  AuthResponse,
  Business,
  BusinessReport,
  CopilotReply,
  FinanceResult,
  LoanResult,
  MchjRegime,
  RadarResponse,
  Scenario,
  TaxEntityType,
  TaxResult,
} from "@/types/api";

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

export const adminApi = {
  dashboard: () =>
    api<{
      totalUsers: number;
      activeBusinesses: number;
      analysesCreated: number;
      aiAnalyses: number;
      reports: number;
      popularCategories: Array<{ category: string; _count: { category: number } }>;
    }>("/admin/dashboard"),
  users: () =>
    api<Array<{ id: string; email: string; name: string; role: string; plan: string; createdAt: string; _count: { businesses: number } }>>(
      "/admin/users",
    ),
  businesses: () =>
    api<Array<{ id: string; name: string; category: string; isDemo: boolean; user: { email: string } }>>(
      "/admin/businesses",
    ),
};
