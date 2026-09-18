"use client";

import { useAuth } from "@/features/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p>Ism: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Rol: {user?.role}</p>
        <p>Tarif: {user?.plan}</p>
        <p>Til: O‘zbek (lotin), keyingi bosqichda RU/EN.</p>
      </CardContent>
    </Card>
  );
}
