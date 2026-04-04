import { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { VariantFilters } from "@/types";

const CONSEQUENCE_OPTIONS = [
  "missense_variant",
  "stop_gained",
  "frameshift_variant",
  "splice_acceptor_variant",
  "splice_donor_variant",
  "synonymous_variant",
  "intron_variant",
  "5_prime_UTR_variant",
  "3_prime_UTR_variant",
];

const IMPACT_OPTIONS = ["HIGH", "MODERATE", "LOW", "MODIFIER"];

interface FilterPanelProps {
  filters: VariantFilters;
  onChange: (filters: VariantFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<VariantFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-[#002045] uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5" /> Filters
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-slate-100 pt-4">
          {/* CADD Score Range */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              CADD Score
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.cadd_min ?? ""}
                onChange={(e) => update({ cadd_min: e.target.value ? Number(e.target.value) : undefined })}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              />
              <span className="text-slate-400">—</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.cadd_max ?? ""}
                onChange={(e) => update({ cadd_max: e.target.value ? Number(e.target.value) : undefined })}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* GERP++ Min */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              GERP++ Min
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 2.0"
              value={filters.gerp_min ?? ""}
              onChange={(e) => update({ gerp_min: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>

          {/* Consequence */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Consequence
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {CONSEQUENCE_OPTIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.consequence?.includes(c) ?? false}
                    onChange={(e) => {
                      const current = filters.consequence ?? [];
                      update({
                        consequence: e.target.checked ? [...current, c] : current.filter((x) => x !== c),
                      });
                    }}
                    className="rounded border-slate-300"
                  />
                  {c.replace(/_/g, " ")}
                </label>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Impact
            </label>
            <div className="flex flex-wrap gap-2">
              {IMPACT_OPTIONS.map((imp) => {
                const selected = filters.impact?.includes(imp) ?? false;
                return (
                  <button
                    key={imp}
                    onClick={() => {
                      const current = filters.impact ?? [];
                      update({ impact: selected ? current.filter((x) => x !== imp) : [...current, imp] });
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      selected ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {imp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RegulomeDB Max */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              RegulomeDB Rank (max)
            </label>
            <select
              value={filters.regulome_max ?? ""}
              onChange={(e) => update({ regulome_max: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  &le; {n}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange({})}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
