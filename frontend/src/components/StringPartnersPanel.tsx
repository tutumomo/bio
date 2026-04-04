import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Link } from "lucide-react";
import { api } from "@/lib/api";
import type { StringPartner } from "@/types";

/** Mini confidence bar, 0–1 range */
function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.9 ? "bg-emerald-500" : value >= 0.7 ? "bg-blue-500" : value >= 0.4 ? "bg-orange-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs w-10 text-right">{pct}</span>
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
  const { data, isLoading } = useQuery({
    queryKey: ["string-partners", geneSymbol],
    queryFn: () => api.getStringPartners(geneSymbol),
    staleTime: 30 * 60_000, // 30 min — STRING data is stable
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const partners: StringPartner[] = data?.partners ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#002045] text-lg">
            Predicted Functional Partners
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Source: STRING DB — {partners.length} partners for {geneSymbol}
          </p>
        </div>
        {data?.string_search_url && (
          <a
            href={data.string_search_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
            View in STRING
          </a>
        )}
      </div>

      {partners.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-sm">
          No STRING partners found for {geneSymbol}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
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
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((p) => (
                <tr key={p.symbol} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#002045]">{p.symbol}</td>
                  <td className="px-4 py-3">
                    <ConfidenceBadge score={p.combined_score} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={p.combined_score} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={p.experimental_score} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={p.database_score} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar value={p.textmining_score} />
                  </td>
                  <td className="px-4 py-3">
                    {p.string_url && (
                      <a
                        href={p.string_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
                      >
                        <ExternalLink className="w-3 h-3" />
                        STRING
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
