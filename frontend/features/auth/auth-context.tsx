"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { BUSINESS_KEY, TOKEN_KEY } from "@/config/env";
import type { AuthResponse, AuthUser, Business } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: { email: string; password: string; name: string }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readStorage(TOKEN_KEY));
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() =>
    readStorage(BUSINESS_KEY),
  );

  const meQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => api<AuthUser>("/auth/me"),
    enabled: Boolean(token),
    retry: false,
  });

  const setActiveBusinessId = useCallback((id: string | null) => {
    setActiveBusinessIdState(id);
    if (id) localStorage.setItem(BUSINESS_KEY, id);
    else localStorage.removeItem(BUSINESS_KEY);
  }, []);

  const persistToken = useCallback((value: string) => {
    localStorage.setItem(TOKEN_KEY, value);
    setToken(value);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persistToken(result.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (result.user.role !== "ADMIN") {
        const businesses = await api<Business[]>("/businesses");
        if (businesses[0]) setActiveBusinessId(businesses[0].id);
      }
      return result.user;
    },
    [persistToken, queryClient, setActiveBusinessId],
  );

  const register = useCallback(
    async (payload: { email: string; password: string; name: string }) => {
      const result = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      persistToken(result.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      return result.user;
    },
    [persistToken, queryClient],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(BUSINESS_KEY);
    setToken(null);
    setActiveBusinessIdState(null);
    queryClient.clear();
  }, [queryClient]);

  const user = meQuery.data ?? null;
  const loading = Boolean(token) && meQuery.isPending;

  const value = useMemo(
    () => ({
      user: meQuery.isError ? null : user,
      token,
      loading,
      activeBusinessId,
      setActiveBusinessId,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      loading,
      activeBusinessId,
      setActiveBusinessId,
      login,
      register,
      logout,
      meQuery.isError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
