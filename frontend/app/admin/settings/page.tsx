"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/services/radar";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/states";

const SETTING_META: Record<string, { label: string; hint: string; type: "text" | "select" }> = {
  platform_name: {
    label: "Platforma nomi",
    hint: "Admin panel va tizim sarlavhasi.",
    type: "text",
  },
  default_currency: {
    label: "Asosiy valyuta",
    hint: "Hisob-kitoblarda ko‘rsatiladigan valyuta.",
    type: "text",
  },
  market_data_mode: {
    label: "Bozor ma’lumoti",
    hint: "AI — jonli taxmin, DEMO — namuna rejim.",
    type: "select",
  },
  support_email: {
    label: "Qo‘llab-quvvatlash email",
    hint: "Admin va yordam uchun aloqa.",
    type: "text",
  },
  registration_enabled: {
    label: "Ro‘yxatdan o‘tish",
    hint: "Yopiq bo‘lsa, yangi userlar /register orqali kira olmaydi.",
    type: "select",
  },
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: adminApi.settings });
  const [values, setValues] = useState<Record<string, string>>({});
  const [name, setName] = useState(user?.name ?? "");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (settings.data) {
      setValues(Object.fromEntries(settings.data.map((item) => [item.key, item.value])));
    }
  }, [settings.data]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const saveSettings = useMutation({
    mutationFn: () =>
      adminApi.updateSettings(Object.entries(values).map(([key, value]) => ({ key, value }))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Sozlamalar saqlandi.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      adminApi.updateProfile({
        name,
        ...(password ? { password } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setPassword("");
      toast.success("Profil yangilandi.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (settings.isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Sozlamalar</h1>
        <p className="mt-1 text-sm text-slate-500">Platforma va admin profili.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.data ?? []).map((item) => {
            const meta = SETTING_META[item.key];
            return (
              <div key={item.key}>
                <Label htmlFor={item.key}>{meta?.label ?? item.key}</Label>
                {item.key === "market_data_mode" ? (
                  <Select
                    id={item.key}
                    value={values[item.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [item.key]: event.target.value }))
                    }
                  >
                    <option value="AI">AI</option>
                    <option value="DEMO">DEMO</option>
                    <option value="MOCK">MOCK</option>
                  </Select>
                ) : item.key === "registration_enabled" ? (
                  <Select
                    id={item.key}
                    value={values[item.key] ?? "true"}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [item.key]: event.target.value }))
                    }
                  >
                    <option value="true">Ochiq</option>
                    <option value="false">Yopiq</option>
                  </Select>
                ) : (
                  <Input
                    id={item.key}
                    value={values[item.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [item.key]: event.target.value }))
                    }
                  />
                )}
                {meta?.hint ? <p className="mt-1 text-xs text-slate-500">{meta.hint}</p> : null}
              </div>
            );
          })}
          <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
            {saveSettings.isPending ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin profili</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label htmlFor="admin-name">Ism</Label>
            <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="admin-password">Yangi parol (ixtiyoriy)</Label>
            <Input
              id="admin-password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Saqlanmoqda..." : "Profilni saqlash"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
