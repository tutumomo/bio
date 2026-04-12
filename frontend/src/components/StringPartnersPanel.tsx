import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Link } from "lucide-react";
import { api } from "@/lib/api";
import type { StringPartner } from "@/types";
import SkeletonTable from "./SkeletonTable";
import { ErrorState } from "./ErrorState";

/** Mini confidence bar, 0–1 range */
function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.9 ? "bg-emerald-500" : value >= 0.7 ? "bg-blue-500" : value >= 0.4 ? "bg-orange-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-10 text-right">{pct}</span>
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Confidence tier badge */
function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.9)
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-100 text-emerald-700">
        Highest
      </span>
    );
  if (score >= 0.7)
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-blue-100 text-blue-700">
        High
      </span>
    );
  if (score >= 0.4)
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-orange-100 text-orange-700">
        Medium
      </span>
    );
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-500">
      Low
    </span>
  );
}

interface StringPartnersPanelProps {
  geneSymbol: string;
}

export function StringPartnersPanel({ geneSymbol }: StringPartnersPanelProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["string-partners", geneSymbol],
    queryFn: () => api.getStringPartners(geneSymbol),
    staleTime: 30 * 60_000, // 30 min — STRING data is stable
  });

  if (isLoading) {
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-4" />
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  if (isError) {
     return <ErrorState error={error} onRetry={() => refetch()} title="Functional partners error" />;
  }

  const partners: StringPartner[] = data?.partners ?? [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#002045] text-xl">
            Predicted Functional Partners
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Source: <span className="font-bold text-slate-700">STRING DB</span> &mdash; {partners.length} partners identified for {geneSymbol}
          </p>
        </div>
        {data?.string_search_url && (
          <a
            href={data.string_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
          >
            <Link className="w-4 h-4" />
            View in STRING
          </a>
        )}
      </div>

      {partners.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">No STRING partners found for {geneSymbol}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  "Partner Gene",
                  "Confidence",
                  "Combined",
                  "Experimental",
                  "Database",
                  "Textmining",
                  "Source",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partners.map((p) => (
                <tr key={p.symbol} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-4 py-4 font-bold text-[#002045]">{p.symbol}</td>
                  <td className="px-4 py-4">
                    <ConfidenceBadge score={p.combined_score} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={p.combined_score} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={p.experimental_score} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={p.database_score} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={p.textmining_score} />
                  </td>
                  <td className="px-4 py-4">
                    {p.string_url && (
                      <a
                        href={p.string_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Details
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
