"use client";

import { useState } from "react";
import { toast } from "sonner";
import { aiApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIInsight } from "@/types/api";

export type AiInsightKind = "summary" | "market" | "finance" | "risks" | "validate";

const COPY: Record<
  AiInsightKind,
  { title: string; button: string; empty: string }
> = {
  summary: {
    title: "AI biznes xulosasi",
    button: "AI xulosa yaratish",
    empty: "Radar asosida umumiy AI izohini yarating.",
  },
  market: {
    title: "AI bozor tahlili",
    button: "Bozorni AI tahlil qilish",
    empty: "Narx, talab va raqobat bo‘yicha AI izohini oling.",
  },
  finance: {
    title: "AI moliyaviy izoh",
    button: "Moliyani AI tahlil qilish",
    empty: "Marja, zararsizlik va ssenariylar bo‘yicha AI izohini oling.",
  },
  risks: {
    title: "AI xavf izohi",
    button: "Xavflarni AI tahlil qilish",
    empty: "Hisoblangan xavflarni AI izohlab bersin.",
  },
  validate: {
    title: "AI tekshiruv savollari",
    button: "Taxminlarni AI tekshirish",
    empty: "Qaysi taxminlarni avval tekshirish kerakligini so‘rang.",
  },
};

function List({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc space-y-2 pl-4 text-sm text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AiInsightPanel({
  businessId,
  kind,
  variant = "compact",
}: {
  businessId?: string | null;
  kind: AiInsightKind;
  variant?: "compact" | "full";
}) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const copy = COPY[kind];

  async function generate() {
    if (!businessId) {
      toast.error("Avval biznes tanlang");
      return;
    }
    setLoading(true);
    try {
      const result =
        kind === "summary"
          ? await aiApi.summary(businessId)
          : kind === "market"
            ? await aiApi.market(businessId)
            : kind === "finance"
              ? await aiApi.finance(businessId)
              : kind === "risks"
                ? await aiApi.risks(businessId)
                : await aiApi.validate(businessId);
      setInsight(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI tahlil yaratilmadi");
    } finally {
      setLoading(false);
    }
  }

  const body = insight ? (
    variant === "full" ? (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ijro xulosasi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">{insight.summary}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bozor izohi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">{insight.marketExplanation}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Moliyaviy izoh</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-600">{insight.financialExplanation}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Imkoniyatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={insight.opportunities} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Xavflar</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={insight.risks} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tavsiyalar</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={insight.recommendations} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tekshirish savollari</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={insight.validationQuestions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asoslar</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Provider: {insight.provider}
            {insight.usedFallback ? " (fallback)" : ""} · {insight.citations.join(" · ")}
          </CardContent>
        </Card>
      </div>
    ) : (
      <div className="space-y-3 text-sm leading-6 text-slate-600">
        {kind === "market" ? <p>{insight.marketExplanation}</p> : null}
        {kind === "finance" ? <p>{insight.financialExplanation}</p> : null}
        {kind === "summary" ? <p>{insight.summary}</p> : null}
        {kind === "risks" ? (
          <>
            <p>{insight.summary}</p>
            <List items={insight.risks} />
          </>
        ) : null}
        {kind === "validate" ? <List items={insight.validationQuestions} /> : null}
        {kind === "market" || kind === "summary" ? <List items={insight.opportunities} /> : null}
        {kind === "finance" ? <List items={insight.recommendations} /> : null}
        <p className="text-xs text-slate-400">
          Provider: {insight.provider}
          {insight.usedFallback ? " (fallback)" : ""}
        </p>
      </div>
    )
  ) : (
    <p className="text-sm text-slate-500">{copy.empty}</p>
  );

  if (variant === "full") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <Button onClick={() => void generate()} disabled={loading || !businessId}>
            {loading ? "Yozilmoqda..." : copy.button}
          </Button>
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <Button
          size="sm"
          variant="accent"
          onClick={() => void generate()}
          disabled={loading || !businessId}
        >
          {loading ? "Yozilmoqda..." : copy.button}
        </Button>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
