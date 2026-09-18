"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportApi } from "@/services/radar";
import { useRadar } from "@/hooks/use-radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { ArrowRight, FileText } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const { activeBusinessId } = useRadar();
  const [loading, setLoading] = useState(false);
  const list = useQuery({ queryKey: ["reports"], queryFn: reportApi.list });

  async function create() {
    if (!activeBusinessId) {
      toast.error("Avval biznes tanlang.");
      return;
    }
    setLoading(true);
    try {
      const report = await reportApi.create(activeBusinessId);
      router.push(`/dashboard/reports/${report.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Biznes-reja yaratilmadi.");
    } finally {
      setLoading(false);
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
        <Button onClick={() => void create()} disabled={loading}>
          {loading ? "Tayyorlanmoqda..." : "Yangi reja yaratish"}
        </Button>
      </div>

      {list.data && list.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.data.map((item) => (
            <Link key={item.id} href={`/dashboard/reports/${item.id}`}>
              <Card className="h-full transition-colors hover:border-navy-700">
                <CardHeader>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <FileText className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy-900">{item.title}</p>
                    {item.business?.isDemo ? <DemoBadge /> : null}
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  <p className="inline-flex items-center gap-1 text-sm text-indigo-600">
                    Ko'rish <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </CardContent>
              </Card>
            </Link>
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
