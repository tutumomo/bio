import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ChevronRight, Network } from "lucide-react";
import { api } from "@/lib/api";
import { SourceLinkButtons } from "@/components/SourceLinkButtons";
import { SkeletonTable } from "@/components/SkeletonTable";
import type { Pathway, PathwayProtein } from "@/types";

interface PathwayListProps {
  pathways: Pathway[];
  onSelect: (p: Pathway) => void;
  selected: Pathway | null;
}

function PathwayList({ pathways, onSelect, selected }: PathwayListProps) {
  if (pathways.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl text-slate-500">
        No pathways found. Try a different keyword.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {pathways.map((p) => (
        <button
          key={p.pathway_id}
          onClick={() => onSelect(p)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
            selected?.pathway_id === p.pathway_id
              ? "border-blue-400 bg-blue-50 shadow"
              : "border-slate-100 bg-white hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <Network className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-[#002045] text-sm">{p.name}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.pathway_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={p.reactome_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
            >
              <ExternalLink className="w-3 h-3" />
              Reactome
            </a>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </button>
      ))}
    </div>
  );
}

interface PathwayProteinsTableProps {
  pathway: Pathway;
}

function PathwayProteinsTable({ pathway }: PathwayProteinsTableProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["pathway-proteins", pathway.pathway_id],
    queryFn: () => api.getPathwayProteins(pathway.pathway_id),
    staleTime: 10 * 60_000,
  });

  if (isLoading) return <SkeletonTable rows={8} cols={4} />;

  const proteins: PathwayProtein[] = data?.proteins ?? [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Network className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-bold text-[#002045]">{pathway.name}</h3>
          <p className="text-xs text-slate-500">{proteins.length} proteins in this pathway</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {["Gene Symbol", "Protein Name", "UniProt ID", "Source"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proteins.map((p) => (
              <tr key={p.symbol} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-[#002045]">{p.symbol}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {p.display_name ?? "—"}
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-600">
                  {p.uniprot_id ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <SourceLinkButtons
                    links={[
                      { label: "UniProt", url: p.uniprot_url },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PathwayResultsPanelProps {
  pathways: Pathway[];
}

export function PathwayResultsPanel({ pathways }: PathwayResultsPanelProps) {
  const [selected, setSelected] = useState<Pathway | null>(null);

  return (
    <div className="space-y-6">
      <PathwayList pathways={pathways} onSelect={setSelected} selected={selected} />
      {selected && (
        <div className="mt-6">
          <PathwayProteinsTable pathway={selected} />
        </div>
      )}
    </div>
  );
}
