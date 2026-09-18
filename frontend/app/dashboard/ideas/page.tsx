"use client";

import Link from "next/link";
import { useRadar } from "@/hooks/use-radar";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/badge";
import { formatUzs } from "@/lib/format";
import { CATEGORY_LABELS } from "@/types/api";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";

export default function IdeasPage() {
  const { businesses, businessesLoading, activeBusinessId: radarBusinessId } = useRadar();
  const { setActiveBusinessId, activeBusinessId } = useAuth();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mening bizneslarim</h1>
        <Link href="/dashboard/ideas/new">
          <Button>Yangi biznes</Button>
        </Link>
      </div>
      {businessesLoading ? <p>Yuklanmoqda...</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {businesses.map((item) => (
          <Card key={item.id} className={item.id === activeBusinessId ? "ring-2 ring-navy-900" : ""}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-navy-900">{item.name}</h2>
                  <p className="text-sm text-slate-500">
                    {CATEGORY_LABELS[item.category]} · {item.city}, {item.region}
                  </p>
                </div>
                {item.isDemo ? <DemoBadge /> : null}
              </div>
              <p className="mt-3 text-sm">Kapital: {formatUzs(Number(item.availableCapital))}</p>
              <Button
                className="mt-4"
                variant={item.id === activeBusinessId ? "default" : "outline"}
                onClick={() => setActiveBusinessId(item.id)}
              >
                Radar qilish
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <AiInsightPanel businessId={radarBusinessId} kind="validate" />
    </div>
  );
}
