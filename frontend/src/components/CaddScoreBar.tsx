export function CaddScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 dark:text-slate-600 text-xs">N/A</span>;
  const pct = Math.min((score / 50) * 100, 100);
  const color = score >= 25 ? "bg-red-500" : score >= 15 ? "bg-orange-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm font-bold ${score >= 25 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-200"}`}>
        {score.toFixed(1)}
      </span>
      <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
