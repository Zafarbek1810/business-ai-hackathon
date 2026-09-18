"use client";

import { useRadar } from "@/hooks/use-radar";
import { MetricCard } from "@/components/business/metric-card";
import { DataSourceNote } from "@/components/business/data-source-note";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RiskItem } from "@/types/api";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";

export default function RisksPage() {
  const { radar } = useRadar();
  const risks = radar?.risks;
  const items = (risks?.items ?? []) as RiskItem[];
  const tone = risks?.overallLevel === "HIGH" ? "red" : risks?.overallLevel === "MEDIUM" ? "amber" : "green";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Xavf tahlili</h1>
      <DataSourceNote source="CALCULATED" />
      <MetricCard
        label="Umumiy xavf"
        value={risks ? `${risks.overallLevel} · ${risks.overallScore}/100` : "—"}
        tone={tone}
        hint="Analitik qo‘llab-quvvatlash, moliyaviy maslahat emas"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{item.titleUz}</h2>
                <Badge tone={item.level === "HIGH" ? "red" : item.level === "MEDIUM" ? "amber" : "green"}>
                  {item.level} · {item.score}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.reasonUz}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <AiInsightPanel businessId={radar?.business.id} kind="risks" />
    </div>
  );
}
