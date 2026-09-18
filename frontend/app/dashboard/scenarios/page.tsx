"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRadar } from "@/hooks/use-radar";
import { financeApi } from "@/services/radar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleBarChart } from "@/components/charts/simple-charts";
import { formatUzs } from "@/lib/format";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";

export default function ScenariosPage() {
  const { radar, activeBusinessId, refetch } = useRadar();
  const queryClient = useQueryClient();
  const [units, setUnits] = useState({ PESSIMISTIC: 80, BASE: 120, OPTIMISTIC: 170 });

  async function save(type: "PESSIMISTIC" | "BASE" | "OPTIMISTIC") {
    if (!activeBusinessId) return;
    await financeApi.upsertScenario(activeBusinessId, { type, monthlyUnits: units[type] });
    await queryClient.invalidateQueries();
    await refetch();
    toast.success("Ssenariy yangilandi");
  }

  const scenarios = radar?.scenarios ?? [];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Ssenariy planner</h1>
      <p className="text-sm text-slate-500">Bu ssenariylar, kafolatlangan prognoz emas.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {(["PESSIMISTIC", "BASE", "OPTIMISTIC"] as const).map((type) => {
          const row = scenarios.find((item) => item.type === type);
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{type}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Input
                  type="number"
                  value={units[type]}
                  onChange={(e) => setUnits((prev) => ({ ...prev, [type]: Number(e.target.value) }))}
                />
                <p>Tushum: {formatUzs(Number(row?.revenue ?? 0))}</p>
                <p>Xarajat: {formatUzs(Number(row?.costs ?? 0))}</p>
                <p>Foyda: {formatUzs(Number(row?.profit ?? 0))}</p>
                <Button variant="outline" onClick={() => void save(type)}>
                  Qayta hisoblash
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <SimpleBarChart
        data={scenarios.map((item) => ({
          name: item.type,
          foyda: Number(item.profit),
        }))}
        xKey="name"
        bars={[{ key: "foyda", color: "#0b1f3a", name: "Foyda" }]}
      />
      <AiInsightPanel businessId={activeBusinessId} kind="finance" />
    </div>
  );
}
