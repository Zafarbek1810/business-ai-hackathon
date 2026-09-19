"use client";

import { useState } from "react";
import { financeApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/business/metric-card";
import { formatPercent, formatUzs } from "@/lib/format";
import { CATEGORY_LABELS, type BusinessCategory, type TaxEntityType, type MchjRegime, type TaxResult } from "@/types/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const ENTITY_OPTIONS: Array<{ value: TaxEntityType; label: string; hint: string }> = [
  { value: "YATT", label: "YATT", hint: "Yakka tartibdagi tadbirkor — qat'iy belgilangan soliq" },
  { value: "MCHJ", label: "MCHJ", hint: "Yuridik shaxs — aylanma yoki foyda solig'i" },
];

export function TaxCalculator() {
  const [entityType, setEntityType] = useState<TaxEntityType>("YATT");
  const [category, setCategory] = useState<BusinessCategory>("CLOTHING");
  const [revenue, setRevenue] = useState(50000000);
  const [expenses, setExpenses] = useState(20000000);
  const [mchjRegime, setMchjRegime] = useState<MchjRegime>("SIMPLIFIED");
  const [isVatPayer, setIsVatPayer] = useState(false);
  const [hasBenefit, setHasBenefit] = useState(false);
  const [benefitPercent, setBenefitPercent] = useState(0);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const res = await financeApi.calculateTax({
        entityType,
        revenue,
        expenses: entityType === "MCHJ" && mchjRegime === "GENERAL" ? expenses : undefined,
        mchjRegime: entityType === "MCHJ" ? mchjRegime : undefined,
        category: entityType === "YATT" ? category : undefined,
        isVatPayer: entityType === "MCHJ" && mchjRegime === "GENERAL" ? isVatPayer : undefined,
        benefitPercent: hasBenefit ? benefitPercent : undefined,
      });
      setResult(res);
      if (!res.valid) {
        toast.error(res.warnings[0]?.message ?? "Kiritilgan qiymatlar noto'g'ri.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hisoblanmadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soliq kalkulyatori</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Biznes shakli</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENTITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEntityType(option.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm",
                  entityType === option.value
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <p className="font-semibold">{option.label}</p>
                <p className={cn("text-xs", entityType === option.value ? "text-slate-200" : "text-slate-500")}>
                  {option.hint}
                </p>
              </button>
            ))}
          </div>
        </div>

        {entityType === "YATT" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="category">Faoliyat kategoriyasi</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-navy-700 focus:ring-2"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="revenue-yatt">Oylik tushum (ma'lumot uchun, so‘m)</Label>
              <Input
                id="revenue-yatt"
                type="number"
                min={0}
                value={revenue}
                onChange={(e) => setRevenue(Number(e.target.value))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["SIMPLIFIED", "GENERAL"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMchjRegime(option)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium",
                    mchjRegime === option
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {option === "SIMPLIFIED" ? "Yagona soliq (4%)" : "Umumiy tartib — foyda solig'i (15%)"}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="revenue-mchj">Oylik tushum (so‘m)</Label>
                <Input
                  id="revenue-mchj"
                  type="number"
                  min={0}
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                />
              </div>
              {mchjRegime === "GENERAL" ? (
                <div>
                  <Label htmlFor="expenses">Oylik xarajatlar (so‘m)</Label>
                  <Input
                    id="expenses"
                    type="number"
                    min={0}
                    value={expenses}
                    onChange={(e) => setExpenses(Number(e.target.value))}
                  />
                </div>
              ) : null}
            </div>
            {mchjRegime === "GENERAL" ? (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isVatPayer}
                  onChange={(e) => setIsVatPayer(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                NDS (QQS) to‘lovchisiman
              </label>
            ) : null}
          </div>
        )}

        <div className="space-y-2 rounded-xl border border-slate-200 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={hasBenefit}
              onChange={(e) => setHasBenefit(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Soliq yengilligim bor (masalan IT Park rezidentligi, boshlang‘ich davr yoki hududiy imtiyoz)
          </label>
          {hasBenefit ? (
            <div>
              <Label htmlFor="benefit-percent">Yengillik foizi (%)</Label>
              <Input
                id="benefit-percent"
                type="number"
                min={0}
                max={100}
                value={benefitPercent}
                onChange={(e) => setBenefitPercent(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-slate-500">
                Aniq foizni o‘zingiz kiritasiz — tizim huquqni avtomatik tekshirmaydi. Guvohnoma yoki
                soliq.uz ma’lumotiga qarab kiriting.
              </p>
            </div>
          ) : null}
        </div>

        <Button onClick={() => void calculate()} disabled={loading}>
          {loading ? "Hisoblanmoqda..." : "Hisoblash"}
        </Button>

        {result && result.valid ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Soliq summasi" value={formatUzs(result.taxAmount)} tone="red" />
              <MetricCard label="Samarali stavka" value={formatPercent(result.effectiveRate)} />
              <MetricCard label="Sof daromad" value={formatUzs(result.netIncome)} tone="green" />
              {result.vatEstimate !== null ? (
                <MetricCard label="NDS (ma'lumot uchun)" value={formatUzs(result.vatEstimate)} tone="amber" />
              ) : null}
              {result.benefitAmount > 0 ? (
                <MetricCard
                  label={`Yengillik bilan tejaldi (${result.benefitPercent}%)`}
                  value={formatUzs(result.benefitAmount)}
                  tone="green"
                />
              ) : null}
            </div>
            {result.disclaimers.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                {result.disclaimers.map((text, index) => (
                  <div key={index} className="flex gap-2 text-xs text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
