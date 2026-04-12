import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { sourceLinks } from "@/lib/source-links";
import { VariantTable } from "@/components/VariantTable";
import { FilterPanel } from "@/components/FilterPanel";
import { SkeletonTable } from "@/components/SkeletonTable";
import { SourceLinkButtons } from "@/components/SourceLinkButtons";
import { StringPartnersPanel } from "@/components/StringPartnersPanel";
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters, Gene } from "@/types";

export function GeneDetailPage() {
  const { geneSymbol } = useParams<{ geneSymbol: string }>();
  const [searchParams] = useSearchParams();
  const ensemblId = searchParams.get("ensembl_id") || "";
  const [filters, setFilters] = useState<VariantFilters>({});
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: geneData } = useQuery({
    queryKey: ["gene-detail", geneSymbol],
    queryFn: () => api.searchGenes(geneSymbol!),
    enabled: !!geneSymbol,
  });

  const gene = geneData?.genes.find((g) => g.symbol === geneSymbol) ?? null;

  const geneForVariants: Gene[] = gene
    ? [{ ...gene, ensembl_id: ensemblId || gene.ensembl_id }]
    : [];
  const { data: variantData, isLoading: variantsLoading } = useVariants(geneForVariants, filters, page, limit);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">
          {geneSymbol}
        </h1>
        {gene && (
          <p className="text-slate-500 mt-1">{gene.full_name} &mdash; Chromosome {gene.chromosome}</p>
        )}
      </header>

      {/* Gene Info Card */}
      {gene && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Symbol</p>
              <p className="text-lg font-bold text-[#002045]">{gene.symbol}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Chromosome</p>
              <p className="text-lg font-mono text-[#002045]">{gene.chromosome ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Length</p>
              <p className="text-lg font-mono text-[#002045]">
                {gene.length ? gene.length.toLocaleString() + " bp" : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Source</p>
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

      {/* STRING Functional Partners */}
      {geneSymbol && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <StringPartnersPanel geneSymbol={geneSymbol} />
        </div>
      )}

      {/* Variant Table */}
      <div>
        <h2 className="text-xl font-bold text-[#002045] mb-4">SNP Annotations</h2>
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
          </div>
          <div className="flex-1">
            {variantsLoading ? (
              <SkeletonTable rows={10} cols={8} />
            ) : variantData?.variants.length ? (
              <>
                <VariantTable variants={variantData.variants} />
                {variantData.total > limit && (
                  <div className="flex items-center justify-between mt-4 px-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {page} of {Math.ceil(variantData.total / limit)}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(variantData.total / limit)}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
                No variants found
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
