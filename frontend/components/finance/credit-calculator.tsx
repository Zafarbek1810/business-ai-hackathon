"use client";

import { useState } from "react";
import { financeApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/business/metric-card";
import { formatUzs } from "@/lib/format";
import type { LoanResult } from "@/types/api";
import { toast } from "sonner";

export function CreditCalculator() {
  const [principal, setPrincipal] = useState(50000000);
  const [rate, setRate] = useState(24);
  const [term, setTerm] = useState(12);
  const [result, setResult] = useState<LoanResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const res = await financeApi.calculateCredit({
        principal,
        annualRatePercent: rate,
        termMonths: term,
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
        <CardTitle>Kredit kalkulyatori</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="principal">Kredit summasi (so‘m)</Label>
            <Input
              id="principal"
              type="number"
              min={0}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="rate">Yillik foiz stavkasi (%)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="term">Muddat (oy)</Label>
            <Input
              id="term"
              type="number"
              min={1}
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={() => void calculate()} disabled={loading}>
          {loading ? "Hisoblanmoqda..." : "Hisoblash"}
        </Button>

        {result && result.valid ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Oylik to‘lov" value={formatUzs(result.monthlyPayment)} />
              <MetricCard label="Jami to‘lov" value={formatUzs(result.totalPayment)} />
              <MetricCard
                label="Jami foiz"
                value={formatUzs(result.totalInterest)}
                tone="amber"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4">Oy</th>
                    <th className="py-2 pr-4">To‘lov</th>
                    <th className="py-2 pr-4">Asosiy qarz</th>
                    <th className="py-2 pr-4">Foiz</th>
                    <th className="py-2 pr-4">Qoldiq</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.slice(0, 12).map((row) => (
                    <tr key={row.month} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{row.month}</td>
                      <td className="py-2 pr-4">{formatUzs(row.payment)}</td>
                      <td className="py-2 pr-4">{formatUzs(row.principalPaid)}</td>
                      <td className="py-2 pr-4">{formatUzs(row.interestPaid)}</td>
                      <td className="py-2 pr-4">{formatUzs(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.schedule.length > 12 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Faqat birinchi 12 oy ko‘rsatildi (jami {result.schedule.length} oy).
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
