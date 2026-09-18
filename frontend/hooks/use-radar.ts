"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { businessApi } from "@/services/radar";

export function useRadar() {
  const { activeBusinessId, setActiveBusinessId } = useAuth();
  const businessesQuery = useQuery({
    queryKey: ["businesses"],
    queryFn: businessApi.list,
  });

  const businesses = businessesQuery.data ?? [];
  const fallbackId = businesses[0]?.id ?? null;

  useEffect(() => {
    if (!activeBusinessId && fallbackId) {
      setActiveBusinessId(fallbackId);
    }
  }, [activeBusinessId, fallbackId, setActiveBusinessId]);

  const resolvedId = activeBusinessId ?? fallbackId;
  const radarQuery = useQuery({
    queryKey: ["radar", resolvedId],
    queryFn: () => businessApi.radar(resolvedId as string),
    enabled: Boolean(resolvedId),
  });

  return {
    businesses,
    businessesLoading: businessesQuery.isLoading,
    radar: radarQuery.data,
    isLoading: Boolean(resolvedId) && radarQuery.isLoading,
    isError: radarQuery.isError,
    error: radarQuery.error,
    refetch: radarQuery.refetch,
    activeBusinessId: resolvedId,
  };
}
