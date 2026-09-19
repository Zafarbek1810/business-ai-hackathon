"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await register({ name , email, password });
      router.push("/dashboard/ideas/new");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ro‘yxatdan o‘tish amalga oshmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="flex w-full max-w-md flex-col items-center">
        <Link href="/" className="mb-4 block transition-opacity hover:opacity-80" aria-label="Bosh sahifa">
          <img
            src="/logobiznes.png"
            alt="Biznes Radar AI"
            className="h-28 w-auto object-contain"
          />
        </Link>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Hisob yaratish</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <div>
                <Label>Ism</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Parol (kamida 8 belgi)</Label>
                <Input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? "Yaratilmoqda..." : "Davom etish"}
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              Hisobingiz bormi?{" "}
              <Link href="/login" className="text-indigo-600">
                Kirish
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
