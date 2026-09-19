"use client";

import { useState } from "react";
import { useRadar } from "@/hooks/use-radar";
import { MetricCard } from "@/components/business/metric-card";
import { SimpleBarChart } from "@/components/charts/simple-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatUzs } from "@/lib/format";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import { CreditCalculator } from "@/components/finance/credit-calculator";
import { TaxCalculator } from "@/components/finance/tax-calculator";
import { CompetitorManager } from "@/components/finance/competitor-manager";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "breakeven", label: "Zararsizlik" },
  { key: "credit", label: "Kredit kalkulyatori" },
  { key: "tax", label: "Soliq kalkulyatori" },
  { key: "market", label: "Bozor tahlili" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FinancePage() {
  const { radar } = useRadar();
  const [tab, setTab] = useState<TabKey>("breakeven");
  const finance = radar?.finance;
  if (!finance) return <p>Avval biznes tanlang.</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Moliyaviy planner</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium",
              tab === item.key
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "breakeven" ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Tushum" value={formatUzs(finance.revenue)} />
            <MetricCard label="COGS" value={formatUzs(finance.cogs)} />
            <MetricCard label="Yalpi foyda" value={formatUzs(finance.grossProfit)} />
            <MetricCard
              label="Sof foyda"
              value={formatUzs(finance.netProfit)}
              tone={finance.netProfit < 0 ? "red" : "green"}
            />
            <MetricCard label="Yalpi marja" value={formatPercent(finance.grossMargin)} />
            <MetricCard label="Operatsion marja" value={formatPercent(finance.operatingMargin)} />
            <MetricCard label="Zararsizlik" value={`${finance.breakEvenUnits ?? "—"} dona`} />
            <MetricCard label="Zararsizlik tushumi" value={formatUzs(finance.breakEvenRevenue ?? 0)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Zararsizlik</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={[
                  { name: "Baza savdo", dona: radar.business.products[0]?.expectedMonthlySales ?? 0 },
                  { name: "Zararsizlik", dona: finance.breakEvenUnits ?? 0 },
                ]}
                xKey="name"
                bars={[{ key: "dona", color: "#d97706", name: "dona/oy" }]}
              />
              <p className="mt-3 text-sm text-slate-600">
                Formula: doimiy xarajat / (sotish narxi − o‘zgaruvchan tannarx) = {formatUzs(finance.operatingExpenses)} /{" "}
                {formatUzs(finance.contributionMargin)} ≈ {finance.breakEvenUnits} dona.
              </p>
            </CardContent>
          </Card>
          <AiInsightPanel businessId={radar.business.id} kind="finance" />
        </div>
      ) : null}

      {tab === "credit" ? <CreditCalculator /> : null}
      {tab === "tax" ? <TaxCalculator /> : null}

      {tab === "market" ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Kategoriya" value={radar.business.category} />
            <MetricCard
              label="O'rtacha narx"
              value={radar.market.averagePrice !== null ? formatUzs(radar.market.averagePrice) : "—"}
            />
            <MetricCard
              label="Min / max narx"
              value={
                radar.market.minPrice !== null && radar.market.maxPrice !== null
                  ? `${formatUzs(radar.market.minPrice)} / ${formatUzs(radar.market.maxPrice)}`
                  : "—"
              }
            />
            <MetricCard
              label="Raqobatchilar"
              value={`${radar.market.competitorCount} ta`}
              hint={
                radar.market.competitorCount > 0
                  ? `${radar.market.competitors.filter((c) => c.source === "USER").length} siz, ${radar.market.competitors.filter((c) => c.source === "AI_WEB").length} AI internet qidiruvi`
                  : undefined
              }
            />
            <MetricCard
              label="Talab darajasi"
              value={radar.market.demandScore !== null ? `${radar.market.demandScore}/100` : "—"}
              hint={radar.market.demandTrend ?? (radar.market.demandScore !== null ? "AI veb-qidiruvi" : undefined)}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bozor xulosasi</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {radar.market.summaryUz ? (
                <p className="mb-2">{radar.market.summaryUz}</p>
              ) : null}
              {radar.market.competitorCount > 0 ? (
                <>
                  {radar.business.category} kategoriyasi bo'yicha {radar.business.region} hududida
                  tizimda qayd etilgan {radar.market.competitorCount} ta raqobatchining o'rtacha
                  narxi {formatUzs(radar.market.averagePrice ?? 0)}. Bu ma'lumotlar real
                  raqobatchilarga (siz kiritgan va/yoki AI internet qidiruvi topgan) asoslangan.
                </>
              ) : (
                <>
                  Hali raqobatchi ma'lumoti topilmagan. Tizim avtomatik internetdan qidirmoqda,
                  yoki pastdagi formadan real raqobatchilarni o'zingiz qo'shishingiz mumkin.
                </>
              )}
            </CardContent>
          </Card>
          <CompetitorManager businessId={radar.business.id} />
          <AiInsightPanel businessId={radar.business.id} kind="market" />
        </div>
      ) : null}
    </div>
  );
}
