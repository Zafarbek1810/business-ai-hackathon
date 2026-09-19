"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_PRICING_PAGE,
  PLANS,
  buildPlanComparison,
  getPlan as getDefaultPlan,
  type PlanDefinition,
  type PricingPageContent,
} from "@/config/plans";
import { plansApi } from "@/services/radar";
import type { Plan } from "@/types/api";

export function usePlans() {
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.public,
    staleTime: 60_000,
  });
  const plans: PlanDefinition[] =
    query.data?.plans && query.data.plans.length > 0 ? query.data.plans : PLANS;
  const page: PricingPageContent = query.data?.page ?? DEFAULT_PRICING_PAGE;
  const comparison =
    query.data?.comparison && query.data.comparison.length > 0
      ? query.data.comparison
      : buildPlanComparison(plans, page);

  function getPlan(id: Plan | null | undefined): PlanDefinition {
    return plans.find((plan) => plan.id === id) ?? getDefaultPlan(id);
  }

  function canCreateBusiness(plan: Plan | null | undefined, count: number): boolean {
    const limit = getPlan(plan).businessLimit;
    if (limit === null) return true;
    return count < limit;
  }

  const labels = {
    FREE: getPlan("FREE").name,
    PRO: getPlan("PRO").name,
    BUSINESS: getPlan("BUSINESS").name,
  } as Record<Plan, string>;

  return { ...query, plans, page, comparison, getPlan, canCreateBusiness, labels };
}
