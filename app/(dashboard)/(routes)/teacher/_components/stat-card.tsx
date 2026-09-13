import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "amber" | "sky";
}

const tones = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
};

export const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) => (
  <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
    <div className="flex items-start justify-between gap-x-3">
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      </div>
      <span className={cn("rounded-lg p-2.5", tones[tone])}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
    {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default StatCard;
