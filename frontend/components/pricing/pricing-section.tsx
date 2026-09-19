"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type BillingPeriod,
  type PlanComparisonRow,
  type PlanDefinition,
  type PricingPageContent,
  monthlyEquivalent,
  planPrice,
} from "@/config/plans";
import { formatUzs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/api";
import { usePlans } from "@/hooks/use-plans";
import { Skeleton } from "@/components/ui/states";

const HIGHLIGHT_ICONS = [Wallet, Sparkles, TrendingUp];

function formatComparisonValue(
  row: PlanComparisonRow,
  planId: Plan,
  page: PricingPageContent,
) {
  const value = row.values[planId];
  if (row.format === "bool" || typeof value === "boolean") {
    return value ? (
      <Check className="h-4 w-4 text-emerald-600" />
    ) : (
      <Minus className="h-4 w-4 text-slate-300" />
    );
  }
  if (row.format === "money") {
    const amount = Number(value ?? 0);
    return (
      <span className="text-sm font-medium text-navy-900">
        {amount === 0 ? page.freeForever : formatUzs(amount)}
      </span>
    );
  }
  return <span className="text-sm font-medium text-navy-900">{String(value ?? "—")}</span>;
}

export function PlanCards({
  period,
  currentPlan,
  loadingPlan,
  onSelect,
  plans,
  page,
}: {
  period: BillingPeriod;
  currentPlan?: Plan | null;
  loadingPlan?: Plan | null;
  onSelect?: (plan: Plan) => void;
  plans: PlanDefinition[];
  page: PricingPageContent;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const price = planPrice(plan, period);
        const isCurrent = currentPlan === plan.id;
        const busy = loadingPlan === plan.id;
        return (
          <Card
            key={plan.id}
            className={cn(
              "relative overflow-hidden transition-transform duration-300 hover:-translate-y-1",
              plan.highlighted && "border-gold-500 shadow-lg shadow-gold-500/10 ring-1 ring-gold-500",
            )}
          >
            {plan.highlighted ? (
              <p className="bg-navy-950 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gold-300">
                {page.highlightedBadge}
              </p>
            ) : null}
            <CardContent className={cn("flex h-full flex-col p-6", plan.highlighted && "pt-5")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gold-500">{plan.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                </div>
                {isCurrent ? <Badge tone="green">{page.currentPlanLabel}</Badge> : null}
              </div>
              <div className="mt-5">
                <p className="text-3xl font-semibold tracking-tight text-navy-900">
                  {price === 0 ? "0 so‘m" : formatUzs(price)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {price === 0
                    ? page.freeForever
                    : period === "year"
                      ? `${page.perYear} · ${page.perMonth} ${formatUzs(monthlyEquivalent(plan))}`
                      : page.perMonth}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">{plan.audience}</p>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-navy-900">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
                {plan.missing.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-400">
                    <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {onSelect ? (
                <Button
                  className="mt-6 w-full"
                    variant={plan.highlighted ? "gold" : isCurrent ? "secondary" : "outline"}
                  disabled={isCurrent || busy}
                  onClick={() => onSelect(plan.id)}
                >
                  {isCurrent ? page.currentPlanLabel : busy ? "Saqlanmoqda..." : plan.cta}
                </Button>
              ) : (
                <Link href="/register" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "gold" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function PricingSection({
  variant = "landing",
  currentPlan,
  loadingPlan,
  onSelect,
}: {
  variant?: "landing" | "settings";
  currentPlan?: Plan | null;
  loadingPlan?: Plan | null;
  onSelect?: (plan: Plan) => void;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("year");
  const { plans, page, comparison, getPlan, isLoading } = usePlans();
  const current = getPlan(currentPlan);

  if (isLoading && plans.length === 0) {
    return <Skeleton className="h-64" />;
  }

  return (
    <section id="pricing" className={variant === "landing" ? "mx-auto max-w-6xl px-5 py-16 md:px-6" : "space-y-8"}>
      <div className={cn(variant === "landing" ? "max-w-2xl" : "max-w-3xl")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-500">{page.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl text-navy-900 md:text-4xl">
          {variant === "settings" ? page.settingsTitle : page.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
          {variant === "settings" ? page.settingsSubtitle : page.subtitle}
        </p>
      </div>

      {variant === "settings" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">{page.currentPlanLabel}</p>
          <p className="mt-1 text-lg font-semibold text-navy-900">
            {current.name} ·{" "}
            {current.businessLimit === null
              ? page.unlimitedLabel.toLowerCase() + " biznes"
              : `${current.businessLimit} ta biznes`}
          </p>
          <p className="mt-1 text-sm text-slate-500">{current.tagline}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {page.highlights.map((item, index) => {
            const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
            return (
              <div key={`${item.title}-${index}`} className="rounded-3xl border border-navy-900/10 bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-gold-500" />
                <h3 className="mt-3 font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">{page.yearlyHint}</p>
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {(
            [
              ["month", page.monthlyToggle],
              ["year", page.yearlyToggle],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                period === value ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <PlanCards
          period={period}
          currentPlan={currentPlan}
          loadingPlan={loadingPlan}
          onSelect={onSelect}
          plans={plans}
          page={page}
        />
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-5 py-3 font-medium">{page.comparisonFeatureLabel}</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-5 py-3 font-semibold text-navy-900">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-5 py-3 text-slate-600">{row.label}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-5 py-3">
                    {formatComparisonValue(row, plan.id, page)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {variant === "landing" ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {page.faqs.map((item, index) => (
            <div key={`${item.q}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-navy-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
