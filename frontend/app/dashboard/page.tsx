"use client";

import Link from "next/link";
import { useRadar } from "@/hooks/use-radar";
import { MetricCard } from "@/components/business/metric-card";
import { DataSourceNote } from "@/components/business/data-source-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { CopilotPanel } from "@/components/ai/copilot-panel";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import { SimpleBarChart } from "@/components/charts/simple-charts";
import { formatPercent, formatUzs } from "@/lib/format";
import { CATEGORY_LABELS } from "@/types/api";

export default function DashboardPage() {
  const { radar, isLoading, isError, businesses, refetch } = useRadar();

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!radar) {
    return (
      <EmptyState
        title="Hali biznes yo‘q"
        description="Birinchi biznesingizni yarating — AI sizga moliyaviy reja va ko'nikma tavsiyalarini tayyorlab beradi."
        action={
          <Link href="/dashboard/ideas/new">
            <Button>Yangi biznes</Button>
          </Link>
        }
      />
    );
  }

  if (isError) {
    return <ErrorState message="Radar yuklanmadi. Qayta urinib ko‘ring." />;
  }

  const { business, finance, market, scenarios, risks } = radar;
  const riskTone =
    risks?.overallLevel === "HIGH" ? "red" : risks?.overallLevel === "MEDIUM" ? "amber" : "green";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Biznes Radar Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            {business.name} · {CATEGORY_LABELS[business.category]} · {business.city}, {business.region}
          </p>
        </div>
        <Link href="/dashboard/ideas/new">
          <Button variant="secondary">Yangi g‘oya</Button>
        </Link>
      </div>

      <DataSourceNote source={String(market.provenance)} />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Bozor imkoniyati"
          value={market.demandScore !== null ? `${market.demandScore}/100` : "—"}
          hint="AI talab signali"
          tone="indigo"
        />
        <MetricCard label="Raqobat" value={`${market.competitorCount} ta`} hint="AI taxmini" />
        <MetricCard
          label="Talab trendi"
          value={market.demandTrend ?? "—"}
          hint="Haqiqiy prognoz emas"
        />
        <MetricCard
          label="Taxminiy marja"
          value={formatPercent(finance.grossMargin)}
          tone={finance.grossMargin && finance.grossMargin < 0.25 ? "amber" : "green"}
        />
        <MetricCard
          label="Zararsizlik"
          value={finance.breakEvenUnits !== null ? `${finance.breakEvenUnits} dona` : "—"}
          hint="Formula: FC / (P - V)"
        />
        <MetricCard
          label="Xavf darajasi"
          value={risks ? `${risks.overallLevel} · ${risks.overallScore}` : "—"}
          tone={riskTone}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moliyaviy model</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={[
                { name: "Tushum", qiymat: finance.revenue },
                { name: "COGS", qiymat: finance.cogs },
                { name: "Foyda", qiymat: finance.netProfit },
              ]}
              xKey="name"
              bars={[{ key: "qiymat", color: "#0b1f3a", name: "so‘m" }]}
            />
            <p className="mt-2 text-sm text-slate-500">
              Baza ssenariy foydasi {formatUzs(finance.netProfit)}. Bu kafolat emas.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ssenariylar</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={scenarios.map((item) => ({
                name: item.type,
                foyda: Number(item.profit),
                tushum: Number(item.revenue),
              }))}
              xKey="name"
              bars={[
                { key: "tushum", color: "#4f46e5", name: "Tushum" },
                { key: "foyda", color: "#059669", name: "Foyda" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asosiy xulosalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Kiritilgan sotish narxi {formatUzs(Number(business.products[0]?.sellingPrice))} va tannarx{" "}
              {formatUzs(Number(business.products[0]?.purchasePrice))}. Ulushli marja{" "}
              {formatUzs(finance.contributionMargin)}.
            </p>
            <p>
              Doimiy xarajat {formatUzs(finance.operatingExpenses)} bo‘lsa, zararsizlik nuqtasi taxminan{" "}
              {finance.breakEvenUnits ?? "—"} dona/oy. Baza savdo{" "}
              {business.products[0]?.expectedMonthlySales} dona.
            </p>
            <p className="text-xs text-slate-500">
              Qaror foydalanuvchida qoladi. Platforma professional moliyaviy maslahat emas.
            </p>
          </CardContent>
        </Card>
        <CopilotPanel businessId={business.id} />
      </div>
      <AiInsightPanel businessId={business.id} kind="summary" />

      {businesses.length > 1 ? (
        <p className="text-xs text-slate-500">{businesses.length} ta biznes hisobda saqlangan.</p>
      ) : null}
      <button type="button" className="hidden" onClick={() => void refetch()} />
    </div>
  );
}
