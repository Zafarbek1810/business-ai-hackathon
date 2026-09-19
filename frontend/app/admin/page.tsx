"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/services/radar";
import { MetricCard } from "@/components/business/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatUzs } from "@/lib/format";
import { CATEGORY_LABELS, ROLE_LABELS, type BusinessCategory } from "@/types/api";
import { usePlans } from "@/hooks/use-plans";

export default function AdminDashboardPage() {
  const { labels } = usePlans();
  const dash = useQuery({
    queryKey: ["admin-dash"],
    queryFn: adminApi.dashboard,
  });

  if (dash.isLoading) return <Skeleton className="h-64" />;
  const data = dash.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Foydalanuvchilar, tariflar va platforma holati.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Foydalanuvchilar" value={String(data?.totalUsers ?? 0)} />
        <MetricCard label="Bizneslar" value={String(data?.activeBusinesses ?? 0)} />
        <MetricCard label="Tahlillar" value={String(data?.analysesCreated ?? 0)} />
        <MetricCard label="AI tahlillar" value={String(data?.aiAnalyses ?? 0)} />
        <MetricCard label="Hisobotlar" value={String(data?.reports ?? 0)} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(data?.planBreakdown ?? []).map((item) => (
          <Card key={item.plan}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-indigo-600">{item.name}</p>
              <p className="mt-2 text-2xl font-semibold text-navy-900">{item.users} ta user</p>
              <p className="mt-1 text-sm text-slate-500">{item.businesses} ta biznes</p>
              <p className="mt-2 text-sm text-slate-600">
                Taxminiy MRR: {formatUzs(item.estimatedMrr)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>So‘nggi foydalanuvchilar</CardTitle>
            <Link href="/admin/users" className="text-sm text-indigo-600">
              Barchasi
            </Link>
          </CardHeader>
          <CardContent>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Ism</th>
                  <th>Rol</th>
                  <th>Tarif</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentUsers ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-2">
                      <p className="font-medium text-navy-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </td>
                    <td>
                      <Badge tone={item.role === "ADMIN" ? "indigo" : "slate"}>
                        {ROLE_LABELS[item.role]}
                      </Badge>
                    </td>
                    <td>{labels[item.plan]}</td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mashhur kategoriyalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.popularCategories ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Hali biznes yo‘q.</p>
            ) : (
              (data?.popularCategories ?? []).map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {CATEGORY_LABELS[item.category as BusinessCategory] ?? item.category}
                  </span>
                  <span className="font-medium text-navy-900">{item._count.category}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
