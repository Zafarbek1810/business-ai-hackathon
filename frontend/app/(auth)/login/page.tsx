"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { homePathForRole } from "@/lib/auth-redirect";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(homePathForRole(user.role));
    }
  }, [authLoading, router, user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      router.replace(homePathForRole(loggedIn.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kirish amalga oshmadi");
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
            <CardTitle>Tizimga kirish</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={loading}>
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              Yangi hisob?{" "}
              <Link href="/register" className="text-indigo-600">
                Ro‘yxatdan o‘tish
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
