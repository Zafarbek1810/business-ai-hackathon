"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/states";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/features/auth/auth-context";
import { usePlans } from "@/hooks/use-plans";
import { ROLE_LABELS, type AdminUser, type Plan, type Role } from "@/types/api";

const ROLES: Role[] = ["USER", "ADMIN", "ANALYST", "BUSINESS_CONSULTANT", "ENTERPRISE"];
const PLANS: Plan[] = ["FREE", "PRO", "BUSINESS"];

type FormState = {
  name: string;
  email: string;
  password: string;
  role: Role;
  plan: Plan;
  locale: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  plan: "FREE",
  locale: "uz",
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { labels } = usePlans();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [plan, setPlan] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["admin-users", q, role, plan],
    queryFn: () => adminApi.users({ q: q || undefined, role: role || undefined, plan: plan || undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        plan: form.plan,
        locale: form.locale,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) {
        return adminApi.updateUser(editing.id, payload);
      }
      if (!form.password) {
        throw new Error("Yangi foydalanuvchi uchun parol kerak.");
      }
      return adminApi.createUser({ ...payload, password: form.password });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
      toast.success(editing ? "Foydalanuvchi yangilandi." : "Foydalanuvchi yaratildi.");
      closeForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dash"] });
      toast.success("Foydalanuvchi o‘chirildi.");
      setConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const confirmUser = useMemo(
    () => users.data?.find((item) => item.id === confirmId) ?? null,
    [confirmId, users.data],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setCreating(true);
  }

  function openEdit(item: AdminUser) {
    setCreating(false);
    setEditing(item);
    setForm({
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      plan: item.plan,
      locale: item.locale,
    });
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-slate-500">Yaratish, tahrirlash va o‘chirish.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Yangi foydalanuvchi
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input
            placeholder="Ism yoki email qidirish"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">Barcha rollar</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </Select>
          <Select value={plan} onChange={(event) => setPlan(event.target.value)}>
            <option value="">Barcha tariflar</option>
            {PLANS.map((item) => (
              <option key={item} value={item}>
                {labels[item]}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              setQ("");
              setRole("");
              setPlan("");
            }}
          >
            Tozalash
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ro‘yxat · {users.data?.length ?? 0}</CardTitle>
        </CardHeader>
        <CardContent>
          {users.isLoading ? <Skeleton className="h-40" /> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Foydalanuvchi</th>
                  <th>Rol</th>
                  <th>Tarif</th>
                  <th>Bizneslar</th>
                  <th>Sana</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-3">
                      <p className="font-medium text-navy-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </td>
                    <td>
                      <Badge tone={item.role === "ADMIN" ? "indigo" : "slate"}>
                        {ROLE_LABELS[item.role]}
                      </Badge>
                    </td>
                    <td>{labels[item.plan]}</td>
                    <td>{item._count.businesses}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Tahrirlash
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={item.id === me?.id}
                          onClick={() => setConfirmId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          O‘chirish
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={creating || Boolean(editing)}
        title={editing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
        description={
          editing
            ? "Parolni bo‘sh qoldirsangiz, u o‘zgarmaydi."
            : "Yangi hisob darhol tizimga kira oladi."
        }
        onClose={closeForm}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="name">Ism</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Parol {editing ? "(ixtiyoriy)" : ""}</Label>
            <Input
              id="password"
              type="password"
              minLength={editing ? undefined : 8}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required={!editing}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select
                id="role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as Role }))}
              >
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="plan">Tarif</Label>
              <Select
                id="plan"
                value={form.plan}
                onChange={(event) => setForm((prev) => ({ ...prev, plan: event.target.value as Plan }))}
              >
                {PLANS.map((item) => (
                  <option key={item} value={item}>
                    {labels[item]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Bekor
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmUser)}
        title="Foydalanuvchini o‘chirish"
        description={
          confirmUser
            ? `${confirmUser.name} (${confirmUser.email}) va uning bizneslari o‘chiriladi.`
            : undefined
        }
        onClose={() => setConfirmId(null)}
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmId(null)}>
            Bekor
          </Button>
          <Button
            variant="danger"
            disabled={!confirmUser || deleteMutation.isPending}
            onClick={() => confirmUser && deleteMutation.mutate(confirmUser.id)}
          >
            {deleteMutation.isPending ? "O‘chirilmoqda..." : "O‘chirish"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
