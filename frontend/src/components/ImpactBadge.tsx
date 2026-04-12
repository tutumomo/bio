import type { ImpactLevel } from "@/types";

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  MODERATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  LOW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  MODIFIER: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function ImpactBadge({ impact }: { impact: string | null }) {
  if (!impact) return <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>;
  const colors = IMPACT_COLORS[impact as ImpactLevel] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors}`}>
      {impact}
    </span>
  );
}
