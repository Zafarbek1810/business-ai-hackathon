"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { adminApi } from "@/services/radar";
import { MetricCard } from "@/components/business/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const dash = useQuery({
    queryKey: ["admin-dash"],
    queryFn: adminApi.dashboard,
    enabled: user?.role === "ADMIN",
  });
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.users,
    enabled: user?.role === "ADMIN",
  });

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (dash.isLoading) return <Skeleton className="h-64" />;
  const data = dash.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold">Admin panel</h1>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Foydalanuvchilar" value={String(data?.totalUsers ?? 0)} />
        <MetricCard label="Bizneslar" value={String(data?.activeBusinesses ?? 0)} />
        <MetricCard label="Tahlillar" value={String(data?.analysesCreated ?? 0)} />
        <MetricCard label="AI tahlillar" value={String(data?.aiAnalyses ?? 0)} />
        <MetricCard label="Hisobotlar" value={String(data?.reports ?? 0)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2">Ism</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Tarif</th>
                <th>Bizneslar</th>
              </tr>
            </thead>
            <tbody>
              {(users.data ?? []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2">{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.plan}</td>
                  <td>{item._count.businesses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
