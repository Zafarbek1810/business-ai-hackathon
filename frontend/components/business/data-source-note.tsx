import { DemoBadge } from "@/components/ui/badge";

export function DataSourceNote({
  source,
}: {
  source: "DEMO" | "USER" | "CALCULATED" | "AI" | string;
}) {
  const copy: Record<string, string> = {
    DEMO: "Bozor raqamlari prototip / demo to‘plam. Haqiqiy statistika emas.",
    USER: "Foydalanuvchi kiritgan ma’lumot.",
    CALCULATED: "Deterministik formula asosida hisoblangan taxmin.",
    AI: "AI izohi — kafolat yoki bashorat emas.",
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <DemoBadge />
      <span>{copy[source] ?? copy.DEMO}</span>
    </div>
  );
}
