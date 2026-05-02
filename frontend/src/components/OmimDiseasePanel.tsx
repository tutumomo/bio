import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SkeletonChart from "@/components/SkeletonChart";
import type { OmimDisease } from "@/types";

const INHERITANCE_BADGE: Record<string, string> = {
  "Autosomal dominant": "bg-red-50 text-red-700 border-red-200",
  "Autosomal recessive": "bg-blue-50 text-blue-700 border-blue-200",
  "X-linked dominant": "bg-orange-50 text-orange-700 border-orange-200",
  "X-linked recessive": "bg-amber-50 text-amber-700 border-amber-200",
  "Mitochondrial": "bg-purple-50 text-purple-700 border-purple-200",
  "Multifactorial": "bg-slate-50 text-slate-700 border-slate-200",
  "Somatic": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function OmimDiseaseCard({ disease }: { disease: OmimDisease }) {
  const badge = disease.inheritance
    ? INHERITANCE_BADGE[disease.inheritance] ?? "bg-gray-50 text-gray-600 border-gray-200"
    : null;

  return (
    <a
      href={`https://omim.org/entry/${disease.mim_number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all bg-white dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-[#002045] dark:text-slate-100 leading-snug">
          {disease.title}
        </h4>
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
          MIM {disease.mim_number}
        </span>
      </div>
      {disease.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
          {disease.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {disease.phenotype_type && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {disease.phenotype_type}
          </span>
        )}
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge}`}>
            {disease.inheritance}
          </span>
        )}
        {disease.chromosome && (
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Chr {disease.chromosome}
          </span>
        )}
        {disease.orphanet_url && (
          <a
            href={disease.orphanet_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
          >
            Orphanet
          </a>
        )}
      </div>
    </a>
  );
}

export function OmimDiseasePanel({ geneSymbol }: { geneSymbol: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["omim-diseases", geneSymbol],
    queryFn: () => api.getOmimDiseases(geneSymbol, 20),
    enabled: !!geneSymbol,
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-[#002045] dark:text-slate-100">
          Related Diseases{" "}
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
            (OMIM)
          </span>
        </h3>
        {data && (
          <div className="flex items-center gap-3">
            <a
              href={data.omim_search_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View on OMIM
            </a>
            <a
              href={data.orpha_search_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Search on Orphanet
            </a>
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonChart />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
          <p className="text-sm font-medium">Failed to load OMIM data</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : data && data.diseases.length > 0 ? (
        <div className="space-y-3 overflow-y-auto flex-1 max-h-[600px] pr-1">
          {data.diseases.map((disease) => (
            <OmimDiseaseCard key={disease.mim_number} disease={disease} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-slate-400 dark:text-slate-500">
          No OMIM disease associations found
        </div>
      )}
    </div>
  );
}