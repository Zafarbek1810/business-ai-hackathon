"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportApi } from "@/services/radar";
import { useRadar } from "@/hooks/use-radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { ArrowRight, FileText, Trash2 } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { businesses } = useRadar();
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const list = useQuery({ queryKey: ["reports"], queryFn: reportApi.list });

  async function remove(id: string) {
    if (deletingId) return;
    if (!window.confirm("Bu biznes-rejani o'chirmoqchimisiz?")) return;
    setDeletingId(id);
    try {
      await reportApi.remove(id);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Biznes-reja o'chirildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O'chirib bo'lmadi.");
    } finally {
      setDeletingId(null);
    }
  }

  async function create() {
    if (creatingRef.current) return;
    if (!businesses.length) {
      toast.error("Avval biznes qo'shing.");
      return;
    }
    creatingRef.current = true;
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        businesses.map((business) => reportApi.create(business.id)),
      );
      const created = results.filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof reportApi.create>>> =>
          r.status === "fulfilled",
      );
      const failed = results.length - created.length;
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      if (created.length === 0) {
        toast.error("Biznes-reja yaratilmadi.");
        return;
      }
      if (failed > 0) {
        toast.error(`${failed} ta biznes uchun reja yaratilmadi.`);
      }
      if (created.length === 1) {
        router.push(`/dashboard/reports/${created[0].value.id}`);
      } else {
        toast.success(`${created.length} ta biznes uchun reja yaratildi.`);
      }
    } finally {
      setLoading(false);
      creatingRef.current = false;
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Biznes rejam</h1>
          <p className="text-sm text-slate-500">
            Har bir biznesingiz uchun AI yordamida to'liq biznes-reja va moliyaviy ko'nikmalar tavsiyasini oling.
          </p>
        </div>
        <Button onClick={() => void create()} disabled={loading || !businesses.length}>
          {loading ? "Tayyorlanmoqda..." : "Barcha bizneslar uchun reja yaratish"}
        </Button>
      </div>

      {list.data && list.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.data.map((item) => (
            <Card key={item.id} className="relative h-full transition-colors hover:border-navy-700">
              <button
                type="button"
                aria-label="Biznes-rejani o'chirish"
                disabled={deletingId === item.id}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void remove(item.id);
                }}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Link href={`/dashboard/reports/${item.id}`} className="block h-full">
                <CardHeader>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="pr-8 font-medium text-navy-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  <p className="inline-flex items-center gap-1 text-sm text-indigo-600">
                    Ko'rish <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            Hali biznes-reja yaratilmagan. "Yangi reja yaratish" tugmasini bosing.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
