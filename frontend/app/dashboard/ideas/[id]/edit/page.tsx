"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { aiApi, businessApi } from "@/services/radar";
import { CATEGORY_LABELS, REGIONS, type Business, type BusinessCategory } from "@/types/api";

function toNumber(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function toDateInput(value: string | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function rentAmount(business: Business): number {
  const rent = business.expenses.find((item) => item.category === "RENT") ?? business.expenses[0];
  return toNumber(rent?.amount);
}

export default function EditBusinessPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const businessQuery = useQuery({
    queryKey: ["business", id],
    queryFn: () => businessApi.get(id),
    enabled: Boolean(id),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("OTHER");
  const [region, setRegion] = useState(REGIONS[0]);
  const [city, setCity] = useState("");
  const [productName, setProductName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [units, setUnits] = useState(0);
  const [capital, setCapital] = useState(0);
  const [rent, setRent] = useState(0);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimateReason, setEstimateReason] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const business = businessQuery.data;
    if (!business || hydrated) return;
    const product = business.products[0];
    setName(business.name);
    setDescription(business.description ?? "");
    setCategory(business.category);
    setRegion(business.region);
    setCity(business.city);
    setProductName(product?.name ?? "");
    setPurchasePrice(toNumber(product?.purchasePrice));
    setSellingPrice(toNumber(product?.sellingPrice));
    setUnits(product?.expectedMonthlySales ?? 0);
    setCapital(toNumber(business.availableCapital));
    setRent(rentAmount(business));
    setStartDate(toDateInput(business.startDate));
    setHydrated(true);
  }, [businessQuery.data, hydrated]);

  async function estimateWithAi() {
    setEstimating(true);
    setEstimateReason(null);
    try {
      const result = await aiApi.estimateProduct({
        category,
        region,
        productName: productName || "umumiy mahsulot",
      });
      setPurchasePrice(Math.round(result.purchasePrice));
      setSellingPrice(Math.round(result.sellingPrice));
      setUnits(Math.round(result.expectedMonthlySales));
      setRent(Math.round(result.estimatedMonthlyFixedCost));
      setEstimateReason(result.reasoningUz);
      toast.success("AI taxminiy raqamlarni yangiladi — tekshirib saqlang.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Taxmin qilinmadi.");
    } finally {
      setEstimating(false);
    }
  }

  async function submit() {
    if (!name.trim()) {
      toast.error("Biznes nomini kiriting.");
      return;
    }
    if (!productName.trim()) {
      toast.error("Mahsulot nomini kiriting.");
      return;
    }
    setLoading(true);
    try {
      const extras = (businessQuery.data?.products ?? []).slice(1).map((item) => ({
        name: item.name,
        purchasePrice: toNumber(item.purchasePrice),
        sellingPrice: toNumber(item.sellingPrice),
        expectedMonthlySales: item.expectedMonthlySales,
      }));
      const otherExpenses = (businessQuery.data?.expenses ?? [])
        .filter((item) => item.category !== "RENT")
        .map((item) => ({
          kind: item.kind,
          category: item.category,
          label: item.label,
          amount: toNumber(item.amount),
        }));

      await businessApi.update(id, {
        name: name.trim(),
        category,
        region,
        city: city.trim(),
        description: description.trim() || undefined,
        availableCapital: capital,
        startDate: new Date(startDate).toISOString(),
        products: [
          {
            name: productName.trim(),
            purchasePrice,
            sellingPrice,
            expectedMonthlySales: units,
          },
          ...extras,
        ],
        expenses: [
          {
            kind: "FIXED",
            category: "RENT",
            label: "Ijara va doimiy xarajatlar",
            amount: rent,
          },
          ...otherExpenses,
        ],
      });
      await queryClient.invalidateQueries();
      toast.success("Biznes yangilandi.");
      router.push("/dashboard/ideas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
    } finally {
      setLoading(false);
    }
  }

  if (businessQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (businessQuery.isError || !businessQuery.data) {
    return (
      <div className="space-y-4">
        <ErrorState message="Biznes topilmadi yoki yuklanmadi." />
        <Link href="/dashboard/ideas">
          <Button variant="outline">Ortga</Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <div>
          <Link
            href="/dashboard/ideas"
            className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Mening bizneslarim
          </Link>
          <CardTitle>Biznesni tahrirlash</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Biznes nomi</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Tavsif</Label>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none ring-navy-700 focus:ring-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Kategoriya</Label>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Viloyat</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Shahar / tuman</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Mahsulot</Label>
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Xarid narxi</Label>
            <Input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Sotish narxi</Label>
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Oylik savdo (dona)</Label>
            <Input type="number" value={units} onChange={(e) => setUnits(Number(e.target.value))} />
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-sm text-indigo-900">
            Narxlarni qayta taxmin qilish kerak bo‘lsa, AI yordamida yangilashingiz mumkin.
          </p>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="mt-2"
            onClick={() => void estimateWithAi()}
            disabled={estimating}
          >
            <Sparkles className="h-4 w-4" />
            {estimating ? "AI hisoblamoqda..." : "AI yordamida taxmin qilish"}
          </Button>
          {estimateReason ? <p className="mt-2 text-xs text-indigo-800">{estimateReason}</p> : null}
        </div>
        <div>
          <Label>Mavjud kapital (so‘m)</Label>
          <Input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
        </div>
        <div>
          <Label>Oylik doimiy xarajat</Label>
          <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
        </div>
        <div>
          <Label>Boshlanish sanasi</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex justify-between pt-2">
          <Link href="/dashboard/ideas">
            <Button variant="outline">Bekor qilish</Button>
          </Link>
          <Button onClick={() => void submit()} disabled={loading}>
            {loading ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
