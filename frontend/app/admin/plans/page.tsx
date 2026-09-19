"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/services/radar";
import { DEFAULT_PRICING_PAGE, type PlanDefinition, type PricingPageContent } from "@/config/plans";
import { MetricCard } from "@/components/business/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/states";
import { formatPercent, formatUzs } from "@/lib/format";
import { cn } from "@/lib/utils";

type PlanDraft = PlanDefinition & { featuresText: string; missingText: string; limitText: string };

function toDraft(plan: PlanDefinition): PlanDraft {
  return {
    ...plan,
    featuresText: plan.features.join("\n"),
    missingText: plan.missing.join("\n"),
    limitText: plan.businessLimit === null ? "" : String(plan.businessLimit),
  };
}

function fromDraft(draft: PlanDraft): PlanDefinition {
  return {
    id: draft.id,
    name: draft.name,
    tagline: draft.tagline,
    audience: draft.audience,
    monthlyPrice: Number(draft.monthlyPrice) || 0,
    yearlyPrice: Number(draft.yearlyPrice) || 0,
    highlighted: draft.highlighted,
    businessLimit: draft.limitText.trim() === "" ? null : Number(draft.limitText),
    features: draft.featuresText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    missing: draft.missingText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    cta: draft.cta,
  };
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const stats = useQuery({ queryKey: ["admin-plan-stats"], queryFn: adminApi.planStats });
  const catalog = useQuery({ queryKey: ["admin-plans"], queryFn: adminApi.plans });
  const pageQuery = useQuery({ queryKey: ["admin-pricing-page"], queryFn: adminApi.pricingPage });
  const [drafts, setDrafts] = useState<PlanDraft[]>([]);
  const [pageDraft, setPageDraft] = useState<PricingPageContent>(DEFAULT_PRICING_PAGE);

  useEffect(() => {
    if (catalog.data) {
      setDrafts(catalog.data.map(toDraft));
    }
  }, [catalog.data]);

  useEffect(() => {
    if (pageQuery.data) {
      setPageDraft(pageQuery.data);
    }
  }, [pageQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updatePlans(drafts.map(fromDraft)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-plan-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
      toast.success("Tarif rejalari saqlandi.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const savePageMutation = useMutation({
    mutationFn: () => adminApi.updatePricingPage(pageDraft),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-pricing-page"] });
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Sayt tariflar matni saqlandi.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function updateDraft(id: string, patch: Partial<PlanDraft>) {
    setDrafts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  if (stats.isLoading || catalog.isLoading || pageQuery.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Tarif rejalari</h1>
        <p className="mt-1 text-sm text-slate-500">
          Foydalanuvchilar taqsimoti, taxminiy tushum va tarif matnlarini shu yerda boshqarasiz.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Jami userlar" value={String(stats.data?.totalUsers ?? 0)} />
        <MetricCard label="Pullik userlar" value={String(stats.data?.paidUsers ?? 0)} tone="indigo" />
        <MetricCard label="Taxminiy MRR" value={formatUzs(stats.data?.estimatedMrr ?? 0)} tone="green" />
        <MetricCard label="Taxminiy ARR" value={formatUzs(stats.data?.estimatedArr ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tariflar bo‘yicha ma’lumot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(stats.data?.plans ?? []).map((item) => (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-navy-900">{item.name}</span>
                <span className="text-slate-500">
                  {item.users} user · {formatPercent(item.share)} · {formatUzs(item.estimatedMrr)}/oy
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full bg-indigo-600")}
                  style={{ width: `${Math.max(item.share * 100, item.users > 0 ? 4 : 0)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Limit: {item.businessLimit === null ? "cheksiz" : `${item.businessLimit} ta biznes`} ·{" "}
                {item.businesses} ta biznes · oyiga {formatUzs(item.monthlyPrice)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy-900">Tariflarni tahrirlash</h2>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || drafts.length === 0}>
          {saveMutation.isPending ? "Saqlanmoqda..." : "Barchasini saqlash"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {drafts.map((plan) => (
          <Card key={plan.id} className={cn(plan.highlighted && "ring-1 ring-indigo-500")}>
            <CardHeader>
              <CardTitle>{plan.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Nomi</Label>
                <Input value={plan.name} onChange={(event) => updateDraft(plan.id, { name: event.target.value })} />
              </div>
              <div>
                <Label>Qisqa izoh</Label>
                <Input
                  value={plan.tagline}
                  onChange={(event) => updateDraft(plan.id, { tagline: event.target.value })}
                />
              </div>
              <div>
                <Label>Auditoriya</Label>
                <Input
                  value={plan.audience}
                  onChange={(event) => updateDraft(plan.id, { audience: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Oylik narx</Label>
                  <Input
                    type="number"
                    min={0}
                    value={plan.monthlyPrice}
                    onChange={(event) =>
                      updateDraft(plan.id, { monthlyPrice: Number(event.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Yillik narx</Label>
                  <Input
                    type="number"
                    min={0}
                    value={plan.yearlyPrice}
                    onChange={(event) =>
                      updateDraft(plan.id, { yearlyPrice: Number(event.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Biznes limiti (bo‘sh = cheksiz)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Cheksiz"
                  value={plan.limitText}
                  onChange={(event) => updateDraft(plan.id, { limitText: event.target.value })}
                />
              </div>
              <div>
                <Label>Tugma matni</Label>
                <Input value={plan.cta} onChange={(event) => updateDraft(plan.id, { cta: event.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={plan.highlighted}
                  onChange={(event) => updateDraft(plan.id, { highlighted: event.target.checked })}
                />
                Asosiy tarif sifatida belgilash
              </label>
              <div>
                <Label>Imkoniyatlar (har qator — 1 ta)</Label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-navy-700 focus:ring-2"
                  value={plan.featuresText}
                  onChange={(event) => updateDraft(plan.id, { featuresText: event.target.value })}
                />
              </div>
              <div>
                <Label>Yo‘q imkoniyatlar</Label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-navy-700 focus:ring-2"
                  value={plan.missingText}
                  onChange={(event) => updateDraft(plan.id, { missingText: event.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>Sayt Tariflar bo‘limi</CardTitle>
          <p className="text-sm font-normal text-slate-500">
            Bosh sahifadagi sarlavha, izohlar, FAQ va taqqoslash jadvali matnlari. Kartalar esa yuqoridagi tariflardan olinadi.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Yuqori yozuv</Label>
              <Input
                value={pageDraft.eyebrow}
                onChange={(event) => setPageDraft((prev) => ({ ...prev, eyebrow: event.target.value }))}
              />
            </div>
            <div>
              <Label>Asosiy belgi</Label>
              <Input
                value={pageDraft.highlightedBadge}
                onChange={(event) =>
                  setPageDraft((prev) => ({ ...prev, highlightedBadge: event.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Sarlavha</Label>
            <Input
              value={pageDraft.title}
              onChange={(event) => setPageDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
          </div>
          <div>
            <Label>Izoh</Label>
            <textarea
              className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-navy-700 focus:ring-2"
              value={pageDraft.subtitle}
              onChange={(event) => setPageDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Sozlamalar sarlavhasi</Label>
              <Input
                value={pageDraft.settingsTitle}
                onChange={(event) => setPageDraft((prev) => ({ ...prev, settingsTitle: event.target.value }))}
              />
            </div>
            <div>
              <Label>Joriy tarif yozuvi</Label>
              <Input
                value={pageDraft.currentPlanLabel}
                onChange={(event) =>
                  setPageDraft((prev) => ({ ...prev, currentPlanLabel: event.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Sozlamalar izohi</Label>
            <textarea
              className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-navy-700 focus:ring-2"
              value={pageDraft.settingsSubtitle}
              onChange={(event) => setPageDraft((prev) => ({ ...prev, settingsSubtitle: event.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Yillik eslatma</Label>
              <Input
                value={pageDraft.yearlyHint}
                onChange={(event) => setPageDraft((prev) => ({ ...prev, yearlyHint: event.target.value }))}
              />
            </div>
            <div>
              <Label>Oylik tugma</Label>
              <Input
                value={pageDraft.monthlyToggle}
                onChange={(event) => setPageDraft((prev) => ({ ...prev, monthlyToggle: event.target.value }))}
              />
            </div>
            <div>
              <Label>Yillik tugma</Label>
              <Input
                value={pageDraft.yearlyToggle}
                onChange={(event) => setPageDraft((prev) => ({ ...prev, yearlyToggle: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Taqqoslash: biznes limiti</Label>
              <Input
                value={pageDraft.comparisonLimitLabel}
                onChange={(event) =>
                  setPageDraft((prev) => ({ ...prev, comparisonLimitLabel: event.target.value }))
                }
              />
            </div>
            <div>
              <Label>Taqqoslash: oylik</Label>
              <Input
                value={pageDraft.comparisonMonthlyLabel}
                onChange={(event) =>
                  setPageDraft((prev) => ({ ...prev, comparisonMonthlyLabel: event.target.value }))
                }
              />
            </div>
            <div>
              <Label>Taqqoslash: yillik</Label>
              <Input
                value={pageDraft.comparisonYearlyLabel}
                onChange={(event) =>
                  setPageDraft((prev) => ({ ...prev, comparisonYearlyLabel: event.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Foyda kartalari</Label>
            <div className="mt-2 space-y-3">
              {pageDraft.highlights.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-2">
                  <Input
                    value={item.title}
                    onChange={(event) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        highlights: prev.highlights.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, title: event.target.value } : row,
                        ),
                      }))
                    }
                  />
                  <Input
                    value={item.body}
                    onChange={(event) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        highlights: prev.highlights.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, body: event.target.value } : row,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>FAQ</Label>
            <div className="mt-2 space-y-3">
              {pageDraft.faqs.map((item, index) => (
                <div key={index} className="space-y-2 rounded-xl border border-slate-100 p-3">
                  <Input
                    value={item.q}
                    onChange={(event) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        faqs: prev.faqs.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, q: event.target.value } : row,
                        ),
                      }))
                    }
                  />
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-navy-700 focus:ring-2"
                    value={item.a}
                    onChange={(event) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        faqs: prev.faqs.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, a: event.target.value } : row,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => savePageMutation.mutate()} disabled={savePageMutation.isPending}>
            {savePageMutation.isPending ? "Saqlanmoqda..." : "Sayt matnini saqlash"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
