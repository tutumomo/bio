import { useState } from "react";
import { Download, Network } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useGeneSearch } from "@/hooks/useGeneSearch";
import { GeneTable } from "@/components/GeneTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { exportCSV } from "@/lib/export";
import { FilterPanel } from "@/components/FilterPanel";
import { VariantTable } from "@/components/VariantTable";
import { PathwayResultsPanel } from "@/components/PathwayResultsPanel";
import { useVariants } from "@/hooks/useVariants";
import { api } from "@/lib/api";
import type { VariantFilters, SearchMode } from "@/types";

export function ResultsPage() {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get("mode") ?? "gene") as SearchMode;
  const query = searchParams.get("q") ?? "";

  const [activeTab, setActiveTab] = useState<"overview" | "variants">("overview");
  const [filters, setFilters] = useState<VariantFilters>({});

  // ── Gene mode ──────────────────────────────────────────────────
  const { data: geneData, isLoading: geneLoading, error: geneError } = useGeneSearch();
  const { data: variantData, isLoading: variantsLoading } = useVariants(
    geneData?.genes ?? [],
    filters,
  );

  // ── Pathway mode ───────────────────────────────────────────────
  const { data: pathwayData, isLoading: pathwayLoading } = useQuery({
    queryKey: ["pathways", query],
    queryFn: () => api.searchPathways(query),
    enabled: mode === "pathway" && query.length > 0,
    staleTime: 5 * 60_000,
  });

  const handleExportGenes = () => {
    if (!geneData?.genes) return;
    const headers = ["Gene Symbol", "Product Protein", "Chromosome", "Length (bp)", "NCBI URL", "Ensembl URL"];
    const rows = geneData.genes.map((g) => [
      g.symbol,
      g.full_name ?? "",
      g.chromosome ?? "",
      g.length?.toString() ?? "",
      g.ncbi_url ?? "",
      g.ensembl_url ?? "",
    ]);
    exportCSV(headers, rows, `gene_overview_${query}.csv`);
  };

  const isLoading = mode === "pathway" ? pathwayLoading : geneLoading;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {mode === "pathway" && <Network className="w-6 h-6 text-blue-600" />}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">
              Results for &ldquo;{query}&rdquo;
            </h1>
          </div>
          {mode === "gene" && geneData && (
            <p className="text-sm text-slate-500 mt-1">{geneData.total} genes found</p>
          )}
          {mode === "pathway" && pathwayData && (
            <p className="text-sm text-slate-500 mt-1">
              {pathwayData.total} pathways found — click a pathway to view its proteins
            </p>
          )}
        </div>
        {mode === "gene" && (
          <button
            onClick={handleExportGenes}
            className="flex items-center gap-2 px-4 py-2 bg-[#002045] text-white text-sm font-bold rounded-xl hover:opacity-90"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* ── Pathway mode ─────────────────────────────────────────── */}
      {mode === "pathway" && (
        <>
          {isLoading && <SkeletonTable rows={6} cols={3} />}
          {pathwayData && (
            <PathwayResultsPanel pathways={pathwayData.pathways} />
          )}
        </>
      )}

      {/* ── Gene mode ─────────────────────────────────────────────── */}
      {mode === "gene" && (
        <>
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "text-blue-700 border-blue-700"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              Gene & Protein Overview
            </button>
            <button
              onClick={() => setActiveTab("variants")}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "variants"
                  ? "text-blue-700 border-blue-700"
                  : "text-slate-500 border-transparent hover:text-slate-700"
              }`}
            >
              Genetic Variation & Annotations
            </button>
          </div>

          {geneLoading && <SkeletonTable rows={8} cols={5} />}
          {geneError && (
            <div className="p-8 text-center bg-red-50 rounded-xl text-red-700">
              Error loading data. Please try again.
            </div>
          )}
          {geneData && activeTab === "overview" && <GeneTable genes={geneData.genes} />}
          {geneData && activeTab === "variants" && (
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
                    No variants found with current filters
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
