"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  Cpu,
  FileText,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/ui/badge";
import { useRadar } from "@/hooks/use-radar";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ideas", label: "Mening bizneslarim", icon: Building2 },
  { href: "/dashboard/finance", label: "Moliyaviy planner", icon: Landmark },
  { href: "/dashboard/scenarios", label: "Ssenariylar", icon: BarChart3 },
  { href: "/dashboard/risks", label: "Xavflar", icon: ShieldAlert },
  { href: "/dashboard/insights", label: "AI tahlil", icon: Cpu },
  { href: "/dashboard/reports", label: "Biznes rejam", icon: FileText },
  { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { radar } = useRadar();

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/dashboard" className="block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Business Radar AI
            </p>
            <h1 className="mt-1 text-lg font-semibold text-navy-900">Biznes Radar AI</h1>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                  active ? "bg-navy-900 text-white" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Users className="h-4 w-4" />
              Admin panel
            </Link>
          ) : null}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="text-sm font-medium text-navy-900">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy-900"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {radar?.business.name ?? "Biznes Radar"}
              </p>
              <p className="text-xs text-slate-500">
                {radar ? `${radar.business.city}, ${radar.business.region}` : "Biznes tanlang"}
              </p>
            </div>
            {radar?.business.isDemo ? <DemoBadge /> : null}
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-navy-900">
            Bosh sahifa
          </Link>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
