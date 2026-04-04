export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-slate-100 h-10 rounded-t-xl mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
