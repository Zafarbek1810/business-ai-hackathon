"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiApi, businessApi, reportApi } from "@/services/radar";
import { useAuth } from "@/features/auth/auth-context";
import { CATEGORY_LABELS, REGIONS, type BusinessCategory } from "@/types/api";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ExperienceLevel = "BEGINNER" | "EXPERIENCED";

const STEPS = [
  "Tajriba darajasi",
  "Nomi",
  "Muammo va yechim",
  "Kategoriya",
  "Hudud",
  "Mahsulotlar",
  "Kapital",
  "Xarajatlar",
  "Boshlanish",
  "Reja",
];

export default function NewBusinessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActiveBusinessId } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [name, setName] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [category, setCategory] = useState<BusinessCategory>(
    Object.keys(CATEGORY_LABELS)[0] as BusinessCategory,
  );
  const [region, setRegion] = useState(REGIONS[0]);
  const [city, setCity] = useState("");
  const [productName, setProductName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [units, setUnits] = useState(0);
  const [capital, setCapital] = useState(0);
  const [rent, setRent] = useState(0);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [estimating, setEstimating] = useState(false);
  const [estimateReason, setEstimateReason] = useState<string | null>(null);
  const [estimateDone, setEstimateDone] = useState(false);
  const [showManualNumbers, setShowManualNumbers] = useState(false);

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
      setEstimateDone(true);
      toast.success("AI taxminiy raqamlarni to'ldirdi — tekshirib, kerak bo'lsa o'zgartiring.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Taxmin qilinmadi.");
    } finally {
      setEstimating(false);
    }
  }

  async function submit() {
    setLoading(true);
    try {
      const business = await businessApi.create({
        name,
        category,
        region,
        city,
        availableCapital: capital,
        startDate: new Date(startDate).toISOString(),
        products: [
          {
            name: productName,
            purchasePrice,
            sellingPrice,
            expectedMonthlySales: units,
          },
        ],
        expenses: [
          {
            kind: "FIXED",
            category: "RENT",
            label: "Ijara va doimiy xarajatlar",
            amount: rent,
          },
        ],
      });
      setActiveBusinessId(business.id);
      await queryClient.invalidateQueries();
      toast.success("Biznes yaratildi — AI biznes-rejangizni tayyorlamoqda...");
      try {
        const report = await reportApi.create(business.id);
        router.push(`/dashboard/reports/${report.id}`);
      } catch {
        toast.error("Biznes-reja avtomatik yaratilmadi — 'Biznes rejam' bo'limidan qo'lda urinib ko'ring.");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Saqlanmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>
          Biznes-reja yaratish · {step + 1}/{STEPS.length} · {STEPS[step]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 && (
          <div className="grid gap-3">
            <p className="text-sm text-slate-600">
              Bu bizga keyingi qadamlarda sizga qanday yordam berishni belgilashga yordam beradi.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setExperience("BEGINNER")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  experience === "BEGINNER"
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <p className="font-semibold">Yangi boshlayapman</p>
                <p className={cn("mt-1 text-sm", experience === "BEGINNER" ? "text-slate-200" : "text-slate-500")}>
                  Hali biznesim yo'q, xarid/sotish narxi va savdo hajmini bilmayman — AI menga taxmin qilib bersin.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setExperience("EXPERIENCED")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  experience === "EXPERIENCED"
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <p className="font-semibold">Tajribam bor</p>
                <p className={cn("mt-1 text-sm", experience === "EXPERIENCED" ? "text-slate-200" : "text-slate-500")}>
                  Narxlarimni va oylik savdo hajmimni bilaman, o'zim kiritaman.
                </p>
              </button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <Label>Biznes nomi</Label>
            <Input
              placeholder="Masalan: Mening do'konim"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <div>
              <Label>Qanday muammoni hal qilyapsiz?</Label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none ring-navy-700 focus:ring-2"
                placeholder="Masalan: mahallamizda sifatli sport krossovkalari yetishmayapti..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Kim sizning mijozingiz?</Label>
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none ring-navy-700 focus:ring-2"
                placeholder="Masalan: 20-40 yosh, sport bilan shug'ullanadigan erkaklar..."
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Bu matn AI biznes-rejangizda kontekst sifatida ishlatiladi.
            </p>
          </div>
        )}
        {step === 3 && (
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
        )}
        {step === 4 && (
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
              <Input placeholder="Masalan: Urganch" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="grid gap-3">
            <div>
              <Label>{experience === "BEGINNER" ? "Mahsulot turi" : "Mahsulot"}</Label>
              <Input
                placeholder="Masalan: erkaklar krossovkasi"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {experience === "BEGINNER" && !showManualNumbers ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-sm text-indigo-900">
                  Siz "Yangi boshlayapman" dedingiz — xarid narxi, sotish narxi va oylik savdoni
                  siz o'rniga AI taxmin qiladi. Faqat mahsulot turini yozing va tugmani bosing.
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
                  {estimating ? "AI hisoblamoqda..." : "AI bilan hisoblab bering"}
                </Button>

                {estimateDone ? (
                  <div className="mt-3 space-y-2 rounded-lg bg-white p-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Xarid narxi</p>
                        <p className="font-semibold text-navy-900">{purchasePrice.toLocaleString("uz-UZ")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Sotish narxi</p>
                        <p className="font-semibold text-navy-900">{sellingPrice.toLocaleString("uz-UZ")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Oylik savdo</p>
                        <p className="font-semibold text-navy-900">{units.toLocaleString("uz-UZ")} dona</p>
                      </div>
                    </div>
                    {estimateReason ? <p className="text-xs text-indigo-800">{estimateReason}</p> : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setShowManualNumbers(true)}
                  className="mt-2 text-xs text-indigo-700 underline"
                >
                  Bu raqamlarni o'zim bilaman, qo'lda kiritmoqchiman
                </button>
              </div>
            ) : (
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
            )}

            {experience === "EXPERIENCED" ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-sm text-indigo-900">
                  Aniq raqamga ishonchingiz komil emasmi? AI taxminiy yo'nalish bera oladi.
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
                {estimateReason ? (
                  <p className="mt-2 text-xs text-indigo-800">{estimateReason}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {step === 6 && (
          <div>
            <Label>Mavjud kapital (so‘m)</Label>
            <Input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
          </div>
        )}
        {step === 7 && (
          <div className="grid gap-3">
            <div>
              <Label>Oylik doimiy xarajat (ijara, kommunal, xodim va h.k.)</Label>
              <Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
            </div>
            {estimateDone && rent > 0 ? (
              <p className="text-xs text-slate-500">
                Bu qiymat AI taxminidan avtomatik to'ldirildi — xohlasangiz o'zgartiring.
              </p>
            ) : (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-sm text-indigo-900">
                  Oylik xarajatingizni bilmaysizmi? AI kategoriya va hudud bo'yicha taxmin bera oladi.
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
                  {estimating ? "AI hisoblamoqda..." : "AI bilan hisoblab bering"}
                </Button>
              </div>
            )}
          </div>
        )}
        {step === 8 && (
          <div>
            <Label>Boshlanish sanasi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        )}
        {step === 9 && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>{name} uchun AI biznes-reja yaratiladi. Moliyaviy model backendda hisoblanadi.</p>
            {problemDescription ? <p>Muammo: {problemDescription}</p> : null}
            {targetCustomer ? <p>Mijoz: {targetCustomer}</p> : null}
            <p>
              {productName}: {purchasePrice} → {sellingPrice}, {units} dona/oy, kapital {capital}.
            </p>
          </div>
        )}
        {step === 5 && (purchasePrice <= 0 || sellingPrice <= 0 || units <= 0) ? (
          <p className="text-xs text-amber-700">
            Davom etish uchun avval "AI bilan hisoblab bering" tugmasini bosing yoki raqamlarni qo'lda kiriting.
          </p>
        ) : null}
        <div className="flex justify-between pt-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Orqaga
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && !experience) ||
                (step === 5 && (purchasePrice <= 0 || sellingPrice <= 0 || units <= 0))
              }
            >
              Keyingi
            </Button>
          ) : (
            <Button onClick={() => void submit()} disabled={loading}>
              {loading ? "Reja tayyorlanmoqda..." : "Biznes-rejamni yarating"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
