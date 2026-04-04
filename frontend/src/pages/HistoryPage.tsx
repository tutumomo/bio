import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: api.getHistory,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Clock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-[#002045]">Sign in to view history</h2>
        <p className="text-slate-500 text-sm">Your search history will appear here after logging in.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">Search History</h1>

      {isLoading && <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}</div>}

      {data?.history.length === 0 && (
        <div className="p-12 text-center bg-slate-50 rounded-xl">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No search history yet. Start by searching for a gene.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => navigate(`/results?q=${encodeURIComponent(entry.query)}`)}
            className="w-full flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all text-left"
          >
            <div>
              <p className="font-bold text-[#002045]">{entry.query}</p>
              <p className="text-xs text-slate-500 mt-1">
                {entry.gene_count ?? 0} genes &middot; {entry.variant_count ?? 0} variants
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(entry.searched_at).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
