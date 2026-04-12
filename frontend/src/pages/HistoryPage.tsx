import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Clock, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { HistoryEntry } from "@/types";

export function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [limit] = useState(15);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["history", limit, offset],
    queryFn: () => api.getHistory(limit, offset),
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHistoryEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearHistory(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  const handleReplay = (entry: HistoryEntry) => {
    const params = new URLSearchParams({ q: entry.query, mode: "gene" });
    if (entry.filters) {
      const f = entry.filters;
      if (f.cadd_min !== undefined) params.set("cadd_min", String(f.cadd_min));
      if (f.cadd_max !== undefined) params.set("cadd_max", String(f.cadd_max));
      if (f.gerp_min !== undefined) params.set("gerp_min", String(f.gerp_min));
      if (f.regulome_max !== undefined) params.set("regulome_max", String(f.regulome_max));
      if (f.consequence?.length) params.set("consequence", f.consequence.join(","));
      if (f.impact?.length) params.set("impact", f.impact.join(","));
    }
    navigate(`/results?${params.toString()}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Clock className="w-16 h-16 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-bold text-[#002045] dark:text-slate-100">Sign in to view history</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Your search history will appear here after logging in.</p>
      </div>
    );
  }

  const total = data?.total ?? 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002045] dark:text-slate-100">Search History</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} previous searches</p>
        </div>
        {data && data.history.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all search history?")) clearMutation.mutate();
            }}
            disabled={clearMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50 font-bold"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && data?.history.length === 0 && (
        <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No search history yet. Start by searching for a gene.</p>
        </div>
      )}

      <div className={`space-y-3 transition-opacity ${isFetching ? "opacity-50" : ""}`}>
        {data?.history.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-2 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900 transition-all"
          >
            <button
              onClick={() => handleReplay(entry)}
              className="flex-1 flex items-center justify-between text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#002045] dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {entry.query}
                  </p>
                  {entry.filters && Object.keys(entry.filters).length > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      Filtered
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {entry.gene_count ?? 0} genes found &middot; {entry.variant_count ?? 0} variants
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(entry.searched_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">
                  {new Date(entry.searched_at).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(entry.id);
              }}
              disabled={deleteMutation.isPending}
              className="p-2 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={offset === 0}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={offset + limit >= total}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
