"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/plans", label: "Tarif rejalari", icon: CreditCard },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 bg-navy-900 lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/admin" className="block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Admin
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">Biznes Radar</h1>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                  active ? "bg-white text-navy-900" : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mt-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-navy-900">Admin panel</p>
              <p className="text-xs text-slate-500">Foydalanuvchilar, tariflar va sozlamalar</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 lg:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs text-slate-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
