import { API_URL, TOKEN_KEY } from "@/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | T
    | null;

  if (!response.ok) {
    const message = extractMessage(payload) || "So‘rov bajarilmadi.";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const message = (payload as { message?: string | string[] }).message;
  if (Array.isArray(message)) {
    return message.join(" ");
  }
  return message ?? null;
}
