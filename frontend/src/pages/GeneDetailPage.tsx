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
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters, Gene } from "@/types";

export function GeneDetailPage() {
  const { geneSymbol } = useParams<{ geneSymbol: string }>();
  const [searchParams] = useSearchParams();
  const ensemblId = searchParams.get("ensembl_id") || "";
  const [filters, setFilters] = useState<VariantFilters>({});

  const { data: geneData } = useQuery({
    queryKey: ["gene-detail", geneSymbol],
    queryFn: () => api.searchGenes(geneSymbol!),
    enabled: !!geneSymbol,
  });

  const gene = geneData?.genes.find((g) => g.symbol === geneSymbol) ?? null;

  const geneForVariants: Gene[] = gene
    ? [{ ...gene, ensembl_id: ensemblId || gene.ensembl_id }]
    : [];
  const { data: variantData, isLoading: variantsLoading } = useVariants(geneForVariants, filters);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
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

      {/* Variant Table */}
      <h2 className="text-xl font-bold text-[#002045]">SNP Annotations</h2>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>
        <div className="flex-1">
          {variantsLoading ? (
            <SkeletonTable rows={10} cols={8} />
          ) : variantData?.variants.length ? (
            <VariantTable variants={variantData.variants} />
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
              No variants found
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
