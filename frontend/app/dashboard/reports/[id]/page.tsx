"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { reportApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/business/metric-card";
import { SimpleBarChart } from "@/components/charts/simple-charts";
import { Skeleton } from "@/components/ui/states";
import { formatDate, formatPercent, formatUzs } from "@/lib/format";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { FinanceResult, RiskAnalysis, Scenario } from "@/types/api";

interface SkillRecommendation {
  skill: string;
  reasonUz: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionHref?: string;
  actionLabel?: string;
}

interface ReportSections {
  overview: {
    name: string;
    category: string;
    location: string;
    capital: number | string;
    isDemo: boolean;
  };
  market: {
    provenance: string;
    averagePrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    demandScore: number | null;
    demandTrend: string | null;
    competitorCount: number;
  };
  finance: FinanceResult;
  scenarios: Scenario[];
  risks: RiskAnalysis | null;
  insights: {
    summary: string;
    opportunities: string[];
    recommendations: string[];
  };
  skillRecommendations: SkillRecommendation[];
  checklist: string[];
  disclaimer: string;
}

const PRIORITY_TONE: Record<SkillRecommendation["priority"], "red" | "amber" | "slate"> = {
  HIGH: "red",
  MEDIUM: "amber",
  LOW: "slate",
};

const PRIORITY_LABEL: Record<SkillRecommendation["priority"], string> = {
  HIGH: "Muhim",
  MEDIUM: "Tavsiya etiladi",
  LOW: "Ixtiyoriy",
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["report", params.id],
    queryFn: () => reportApi.get(params.id),
  });

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Hisobot topilmadi.</p>
        <Link href="/dashboard/reports">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Biznes rejam
          </Button>
        </Link>
      </div>
    );
  }

  const report = query.data;
  const sections = report.sections as unknown as ReportSections;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between no-print">
        <Link href="/dashboard/reports" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" />
          Biznes rejam
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          Chop etish / PDF
        </Button>
      </div>

      <div className="print-report space-y-6 rounded-2xl border border-slate-200 bg-white p-8">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">{sections.overview.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {sections.overview.location} · {formatDate(report.createdAt)}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">1. Biznes g&apos;oyasi</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Kategoriya" value={sections.overview.category} />
            <MetricCard label="Hudud" value={sections.overview.location} />
            <MetricCard label="Mavjud kapital" value={formatUzs(sections.overview.capital)} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">2. Bozor konteksti</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="O'rtacha narx" value={formatUzs(sections.market.averagePrice ?? 0)} />
            <MetricCard label="Raqobatchilar" value={`${sections.market.competitorCount} ta`} />
            <MetricCard
              label="Talab"
              value={sections.market.demandScore !== null ? `${sections.market.demandScore}/100` : "—"}
              hint={sections.market.demandTrend ?? undefined}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">3. Moliyaviy model</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <MetricCard label="Tushum" value={formatUzs(sections.finance.revenue)} />
            <MetricCard
              label="Sof foyda"
              value={formatUzs(sections.finance.netProfit)}
              tone={sections.finance.netProfit < 0 ? "red" : "green"}
            />
            <MetricCard label="Yalpi marja" value={formatPercent(sections.finance.grossMargin)} />
            <MetricCard label="Zararsizlik" value={`${sections.finance.breakEvenUnits ?? "—"} dona`} />
          </div>
          {sections.scenarios.length > 0 ? (
            <SimpleBarChart
              data={sections.scenarios.map((s) => ({
                name: s.type,
                foyda: Number(s.profit),
              }))}
              xKey="name"
              bars={[{ key: "foyda", color: "#4f46e5", name: "Foyda (so'm)" }]}
            />
          ) : null}
        </section>

        {sections.risks ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-navy-900">4. Xavflar</h2>
            <MetricCard
              label="Umumiy xavf"
              value={sections.risks.overallLevel}
              tone={sections.risks.overallLevel === "HIGH" ? "red" : sections.risks.overallLevel === "MEDIUM" ? "amber" : "green"}
              hint={`${sections.risks.overallScore}/100`}
            />
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {sections.risks.items.map((item) => (
                <li key={item.key}>
                  <span className="font-medium">{item.titleUz}:</span> {item.reasonUz}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">5. AI xulosasi</h2>
          <p className="text-sm leading-6 text-slate-700">{sections.insights.summary}</p>
          {sections.insights.opportunities?.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-slate-800">Imkoniyatlar</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {sections.insights.opportunities.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">6. Sizga tavsiya etiladigan ko&apos;nikmalar</h2>
          <p className="text-sm text-slate-500">
            Moliyaviy ko'rsatkichlaringiz asosida quyidagi ko'nikmalarni o'rganishni tavsiya qilamiz.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(sections.skillRecommendations ?? []).map((rec, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-sm">{rec.skill}</CardTitle>
                  <Badge tone={PRIORITY_TONE[rec.priority]}>{PRIORITY_LABEL[rec.priority]}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                  <p>{rec.reasonUz}</p>
                  {rec.actionHref ? (
                    <Link
                      href={rec.actionHref}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline no-print"
                    >
                      {rec.actionLabel ?? "Ko'rish"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">7. Tekshirish savollari</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {(sections.checklist ?? []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">{sections.disclaimer}</p>
      </div>
    </div>
  );
}
