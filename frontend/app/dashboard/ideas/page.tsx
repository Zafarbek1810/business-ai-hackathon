"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { useRadar } from "@/hooks/use-radar";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatUzs } from "@/lib/format";
import { CATEGORY_LABELS, type Business } from "@/types/api";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import { businessApi } from "@/services/radar";
import { usePlans } from "@/hooks/use-plans";

export default function IdeasPage() {
  const queryClient = useQueryClient();
  const { businesses, businessesLoading, activeBusinessId: radarBusinessId } = useRadar();
  const { user, setActiveBusinessId, activeBusinessId } = useAuth();
  const { canCreateBusiness, getPlan } = usePlans();
  const atLimit = !canCreateBusiness(user?.plan, businesses.length);
  const plan = getPlan(user?.plan);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeBusiness(item: Business) {
    setDeletingId(item.id);
    try {
      await businessApi.remove(item.id);
      const remaining = businesses.filter((business) => business.id !== item.id);
      if (activeBusinessId === item.id) {
        setActiveBusinessId(remaining[0]?.id ?? null);
      }
      await queryClient.invalidateQueries();
      setConfirmDeleteId(null);
      toast.success(`“${item.name}” o‘chirildi.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O‘chirilmadi.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mening bizneslarim</h1>
        {atLimit ? (
          <Link href="/dashboard/settings">
            <Button>Tarifni yangilash</Button>
          </Link>
        ) : (
          <Link href="/dashboard/ideas/new">
            <Button>Yangi biznes</Button>
          </Link>
        )}
      </div>
      {atLimit ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {plan.name} tarifida {plan.businessLimit} ta biznes limiti tugadi. Yangi model qo‘shish uchun Pro yoki
          Business ga o‘ting.
        </p>
      ) : null}
      {businessesLoading ? <p>Yuklanmoqda...</p> : null}
      {!businessesLoading && businesses.length === 0 ? (
        <EmptyState
          title="Hali biznes yo‘q"
          description="Yangi biznes qo‘shing — keyin uni shu yerda tahrirlashingiz yoki o‘chirishingiz mumkin."
          action={
            <Link href="/dashboard/ideas/new">
              <Button>Yangi biznes</Button>
            </Link>
          }
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {businesses.map((item) => (
          <Card key={item.id} className={item.id === activeBusinessId ? "ring-2 ring-navy-900" : ""}>
            <CardContent className="p-5">
              <div>
                <h2 className="font-semibold text-navy-900">{item.name}</h2>
                <p className="text-sm text-slate-500">
                  {CATEGORY_LABELS[item.category]} · {item.city}, {item.region}
                </p>
              </div>
              <p className="mt-3 text-sm">Kapital: {formatUzs(Number(item.availableCapital))}</p>
              {confirmDeleteId === item.id ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">
                    “{item.name}” ni o‘chirishni tasdiqlaysizmi? Bu amalni qaytarib bo‘lmaydi.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => void removeBusiness(item)}
                    >
                      {deletingId === item.id ? "O‘chirilmoqda..." : "Ha, o‘chirish"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Bekor qilish
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={item.id === activeBusinessId ? "default" : "outline"}
                    onClick={() => setActiveBusinessId(item.id)}
                  >
                    Radar qilish
                  </Button>
                  <Link href={`/dashboard/ideas/${item.id}/edit`}>
                    <Button type="button" variant="outline">
                      <Pencil className="h-4 w-4" />
                      Tahrirlash
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDeleteId(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    O‘chirish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <AiInsightPanel businessId={radarBusinessId} kind="validate" />
    </div>
  );
}
