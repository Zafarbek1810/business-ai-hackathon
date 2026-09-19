"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingSection } from "@/components/pricing/pricing-section";
import { usersApi } from "@/services/radar";
import { usePlans } from "@/hooks/use-plans";
import type { Plan } from "@/types/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const { getPlan, labels } = usePlans();
  const queryClient = useQueryClient();
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const current = getPlan(user?.plan);

  async function selectPlan(plan: Plan) {
    setLoadingPlan(plan);
    try {
      await usersApi.updatePlan(plan);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`${labels[plan]} tarifiga o‘tildi. To‘lov shlyuzi hozircha demo.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tarif yangilanmadi.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Ism: {user?.name}</p>
          <p>Email: {user?.email}</p>
          <p>Rol: {user?.role}</p>
          <p>
            Tarif: {current.name}
            {current.businessLimit === null ? " · cheksiz biznes" : ` · ${current.businessLimit} ta biznes`}
          </p>
          <p>Til: O‘zbek (lotin), keyingi bosqichda RU/EN.</p>
        </CardContent>
      </Card>

      <PricingSection
        variant="settings"
        currentPlan={user?.plan}
        loadingPlan={loadingPlan}
        onSelect={(plan) => void selectPlan(plan)}
      />
    </div>
  );
}
