import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "green" | "amber" | "red" | "indigo";
}) {
  const tones = {
    default: "text-navy-900",
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-700",
    indigo: "text-indigo-700",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className={cn("mt-2 text-xl font-semibold", tones[tone])}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
