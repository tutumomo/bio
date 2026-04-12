import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { sourceLinks } from "@/lib/source-links";
import { VariantTable } from "@/components/VariantTable";
import { FilterPanel } from "@/components/FilterPanel";
import SkeletonTable from "@/components/SkeletonTable";
import { ErrorState } from "@/components/ErrorState";
import { SourceLinkButtons } from "@/components/SourceLinkButtons";
import { StringPartnersPanel } from "@/components/StringPartnersPanel";
import TissueExpressionChart from "@/components/TissueExpressionChart";
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters, Gene } from "@/types";

export function GeneDetailPage() {
  const { geneSymbol } = useParams<{ geneSymbol: string }>();
  const [searchParams] = useSearchParams();
  const ensemblId = searchParams.get("ensembl_id") || "";
  const [filters, setFilters] = useState<VariantFilters>({});
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: geneData, isLoading: geneLoading, error: geneError, refetch: refetchGene } = useQuery({
    queryKey: ["gene-detail", geneSymbol],
    queryFn: () => api.searchGenes(geneSymbol!),
    enabled: !!geneSymbol,
  });

  const gene = geneData?.genes.find((g) => g.symbol === geneSymbol) ?? null;

  const geneForVariants: Gene[] = gene
    ? [{ ...gene, ensembl_id: ensemblId || gene.ensembl_id }]
    : [];
  const { data: variantData, isLoading: variantsLoading, error: variantsError, refetch: refetchVariants } = useVariants(geneForVariants, filters, page, limit);

  if (geneLoading) {
    return (
      <div className="space-y-10 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="bg-white dark:bg-slate-950 rounded-xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-32" />
        <div className="bg-white dark:bg-slate-950 rounded-xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 h-64" />
        <div className="h-96">
          <SkeletonTable rows={10} columns={8} />
        </div>
      </div>
    );
  }

  if (geneError || (!geneLoading && !gene)) {
    return (
      <div className="py-12">
        <ErrorState 
          error={geneError || new Error("Gene not found")} 
          onRetry={() => refetchGene()} 
          title="Gene not found"
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-20">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#002045] dark:text-slate-100">
          {geneSymbol}
        </h1>
        {gene && (
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {gene.full_name} &mdash; <span className="text-[#002045] dark:text-blue-400">Chromosome {gene.chromosome}</span>
          </p>
        )}
      </header>

      {/* Gene Info Card */}
      {gene && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 ring-1 ring-black/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Symbol</p>
              <p className="text-xl font-bold text-[#002045] dark:text-slate-100">{gene.symbol}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Chromosome</p>
              <p className="text-xl font-mono font-bold text-[#002045] dark:text-slate-100">{gene.chromosome ?? "N/A"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Length</p>
              <p className="text-xl font-mono font-bold text-[#002045] dark:text-slate-100">
                {gene.length ? gene.length.toLocaleString() + " bp" : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-2">Source Links</p>
              <SourceLinkButtons
                links={[
                  { label: "NCBI", url: gene.ncbi_url },
                  { label: "Ensembl", url: gene.ensembl_url },
                  { label: "UniProt", url: sourceLinks.uniprot(gene.symbol) },
                  { label: "ClinVar", url: sourceLinks.clinvar(gene.symbol) },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Functional Context Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* STRING Functional Partners */}
        {geneSymbol && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-h-[400px]">
            <StringPartnersPanel geneSymbol={geneSymbol} />
          </div>
        )}

        {/* Tissue Expression Chart */}
        {geneSymbol && (
          <TissueExpressionChart geneSymbol={geneSymbol} ensemblId={ensemblId || undefined} />
        )}
      </div>

      {/* Variant Table Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-2xl font-bold text-[#002045] dark:text-slate-100">Genetic Variation & Functional Annotations</h2>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 flex-shrink-0">
            <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          </div>
          <div className="flex-1 min-w-0">
            {variantsLoading ? (
              <SkeletonTable rows={12} columns={8} />
            ) : variantsError ? (
              <ErrorState error={variantsError} onRetry={() => refetchVariants()} />
            ) : variantData?.variants.length ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                   <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Found {variantData.total.toLocaleString()} variants matching criteria</span>
                </div>
                <VariantTable variants={variantData.variants} />
                {variantData.total > limit && (
                  <div className="flex items-center justify-between mt-8 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <button
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 800, behavior: "smooth" });
                      }}
                      disabled={page === 1}
                      className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Page</span>
                      <span className="text-sm font-bold text-[#002045] dark:text-slate-100">{page}</span>
                      <span className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">of</span>
                      <span className="text-sm font-bold text-[#002045] dark:text-slate-100">{Math.ceil(variantData.total / limit)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setPage((p) => p + 1);
                        window.scrollTo({ top: 800, behavior: "smooth" });
                      }}
                      disabled={page >= Math.ceil(variantData.total / limit)}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-[#002045] dark:bg-blue-700 rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-lg font-bold text-slate-400 dark:text-slate-500">No variants found matching current filters</p>
                <button 
                  onClick={() => setFilters({})}
                  className="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
