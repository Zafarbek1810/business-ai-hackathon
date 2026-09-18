"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PLANS,
  PLAN_COMPARISON,
  type BillingPeriod,
  getPlan,
  monthlyEquivalent,
  planPrice,
} from "@/config/plans";
import { formatUzs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/api";

function formatFeatureValue(value: string | boolean) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-600" />;
  if (value === false) return <Minus className="h-4 w-4 text-slate-300" />;
  return <span className="text-sm font-medium text-navy-900">{value}</span>;
}

export function PlanCards({
  period,
  currentPlan,
  loadingPlan,
  onSelect,
}: {
  period: BillingPeriod;
  currentPlan?: Plan | null;
  loadingPlan?: Plan | null;
  onSelect?: (plan: Plan) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((plan) => {
        const price = planPrice(plan, period);
        const isCurrent = currentPlan === plan.id;
        const busy = loadingPlan === plan.id;
        return (
          <Card
            key={plan.id}
            className={cn(
              "relative overflow-hidden",
              plan.highlighted && "border-indigo-500 shadow-lg shadow-indigo-100 ring-1 ring-indigo-500",
            )}
          >
            {plan.highlighted ? (
              <p className="bg-indigo-600 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                Eng ko‘p tanlanadi
              </p>
            ) : null}
            <CardContent className={cn("flex h-full flex-col p-6", plan.highlighted && "pt-5")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">{plan.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
                </div>
                {isCurrent ? <Badge tone="green">Joriy</Badge> : null}
              </div>
              <div className="mt-5">
                <p className="text-3xl font-semibold tracking-tight text-navy-900">
                  {price === 0 ? "0 so‘m" : formatUzs(price)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {price === 0
                    ? "Doim bepul"
                    : period === "year"
                      ? `yiliga · oyiga ${formatUzs(monthlyEquivalent(plan))}`
                      : "oyiga"}
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
                  variant={plan.highlighted ? "accent" : isCurrent ? "secondary" : "outline"}
                  disabled={isCurrent || busy}
                  onClick={() => onSelect(plan.id)}
                >
                  {isCurrent ? "Joriy tarif" : busy ? "Saqlanmoqda..." : plan.cta}
                </Button>
              ) : (
                <Link href="/register" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "accent" : "outline"}
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
  const current = getPlan(currentPlan);

  return (
    <section id="pricing" className={variant === "landing" ? "mx-auto max-w-6xl px-6 py-16" : "space-y-8"}>
      <div className={cn(variant === "landing" ? "max-w-2xl" : "max-w-3xl")}>
        <p className="text-sm font-medium text-indigo-600">Tariflar va foyda</p>
        <h2 className="mt-2 text-2xl font-semibold text-navy-900 md:text-3xl">
          {variant === "settings" ? "Tarifni tanlang" : "Platforma qanday pul topadi — va sizga nima qoladi"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
          {variant === "settings"
            ? "To‘lov shlyuzi hozircha demo: tarifni tanlasangiz, biznes limiti darhol yangilanadi. Karta yechilmaydi."
            : "Maslahatchidan biznes-reja 3–8 mln so‘m. Pro yillik tarif shu xizmatning bir qismini doimiy yangilab beradi. To‘lov shlyuzi hozircha demo: arxitektura tayyor, karta yechilmaydi."}
        </p>
      </div>

      {variant === "settings" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Joriy tarif</p>
          <p className="mt-1 text-lg font-semibold text-navy-900">
            {current.name} · {current.businessLimit === null ? "cheksiz biznes" : `${current.businessLimit} ta biznes`}
          </p>
          <p className="mt-1 text-sm text-slate-500">{current.tagline}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Mijoz uchun foyda",
              body: "Bitta yomon investitsiyani oldini olish 10–50 mln so‘mni saqlab qolishi mumkin. Pro oyiga 99 ming so‘m.",
            },
            {
              icon: Sparkles,
              title: "Freemium voronkasi",
              body: "Bepulda g‘oya sinovdan o‘tadi. Maqsad: 8–10% foydalanuvchi Pro ga o‘tadi — qiymatni ko‘rgach to‘laydi.",
            },
            {
              icon: TrendingUp,
              title: "1-yillik maqsad",
              body: "1 000 Pro + 100 Business ≈ 129 mln so‘m/oy takrorlanuvchi tushum. Yillik tarif LTV ni oshiradi.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
              <item.icon className="h-5 w-5 text-indigo-600" />
              <h3 className="mt-3 font-semibold text-navy-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">Yillik to‘lovda 2 oy bepul.</p>
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {(
            [
              ["month", "Oylik"],
              ["year", "Yillik · 2 oy bepul"],
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
        />
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="px-5 py-3 font-medium">Imkoniyat</th>
              {PLANS.map((plan) => (
                <th key={plan.id} className="px-5 py-3 font-semibold text-navy-900">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-5 py-3 text-slate-600">{row.label}</td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-5 py-3">
                    {formatFeatureValue(row.values[plan.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {variant === "landing" ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
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
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-navy-900">{item.q}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
