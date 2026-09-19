"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitorApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUzs } from "@/lib/format";

export function CompetitorManager({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const competitorsQuery = useQuery({
    queryKey: ["competitors", businessId],
    queryFn: () => competitorApi.list(businessId),
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const competitors = competitorsQuery.data ?? [];

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["competitors", businessId] }),
      queryClient.invalidateQueries({ queryKey: ["radar", businessId] }),
    ]);
  }

  async function handleAdd() {
    const priceNumber = Number(price);
    if (!name.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0) {
      toast.error("Nom va narxni to'g'ri kiriting.");
      return;
    }
    setSubmitting(true);
    try {
      await competitorApi.add(businessId, {
        name: name.trim(),
        price: priceNumber,
        location: location.trim() || undefined,
        rating: rating ? Number(rating) : undefined,
      });
      setName("");
      setPrice("");
      setLocation("");
      setRating("");
      await refreshAll();
      toast.success("Raqobatchi qo'shildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Qo'shib bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(competitorId: string) {
    try {
      await competitorApi.remove(businessId, competitorId);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O'chirib bo'lmadi.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real raqobatchilar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {competitors.length === 0 ? (
          <p className="text-sm text-slate-600">
            Hali raqobatchi kiritilmagan. Kamida 2-3 tasini qo'shing — bu xavf tahlilini
            aniqroq qiladi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-3">Nomi</th>
                  <th className="py-2 pr-3">Narxi</th>
                  <th className="py-2 pr-3">Joylashuvi</th>
                  <th className="py-2 pr-3">Reyting</th>
                  <th className="py-2 pr-3">Manba</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{c.name}</td>
                    <td className="py-2 pr-3">
                      {Number(c.price) > 0 ? formatUzs(Number(c.price)) : "—"}
                    </td>
                    <td className="py-2 pr-3">{c.location ?? "—"}</td>
                    <td className="py-2 pr-3">{c.rating ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          c.source === "MAP"
                            ? "rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700"
                            : c.source === "AI_WEB"
                              ? "rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                              : "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                        }
                      >
                        {c.source === "MAP"
                          ? "Xaritadan topilgan"
                          : c.source === "AI_WEB"
                            ? "AI internet qidiruvi"
                            : "Siz kiritgan"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(c.id)}
                      >
                        O'chirish
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="competitor-name">Nomi</Label>
            <Input
              id="competitor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Dilnoza do'koni"
            />
          </div>
          <div>
            <Label htmlFor="competitor-price">Narxi (so'm)</Label>
            <Input
              id="competitor-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="competitor-location">Joylashuvi (ixtiyoriy)</Label>
            <Input
              id="competitor-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="competitor-rating">Reyting 0-5 (ixtiyoriy)</Label>
            <Input
              id="competitor-rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={handleAdd} disabled={submitting}>
          {submitting ? "Qo'shilmoqda..." : "Raqobatchi qo'shish"}
        </Button>
      </CardContent>
    </Card>
  );
}
