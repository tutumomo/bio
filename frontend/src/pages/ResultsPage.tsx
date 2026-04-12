import { useState } from "react";
import { Download, Network } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useGeneSearch } from "@/hooks/useGeneSearch";
import { GeneTable } from "@/components/GeneTable";
import SkeletonTable from "@/components/SkeletonTable";
import { ErrorState } from "@/components/ErrorState";
import { exportCSV, exportTSV } from "@/lib/export";
import { FilterPanel } from "@/components/FilterPanel";
import { VariantTable } from "@/components/VariantTable";
import { PathwayResultsPanel } from "@/components/PathwayResultsPanel";
import { useVariants } from "@/hooks/useVariants";
import { api } from "@/lib/api";
import type { VariantFilters, SearchMode } from "@/types";

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") ?? "gene") as SearchMode;
  const query = searchParams.get("q") ?? "";

  const [activeTab, setActiveTab] = useState<"overview" | "variants">("overview");

  // Derive filters from URL
  const filters: VariantFilters = {
    cadd_min: searchParams.get("cadd_min") ? Number(searchParams.get("cadd_min")) : undefined,
    cadd_max: searchParams.get("cadd_max") ? Number(searchParams.get("cadd_max")) : undefined,
    gerp_min: searchParams.get("gerp_min") ? Number(searchParams.get("gerp_min")) : undefined,
    regulome_max: searchParams.get("regulome_max") ? Number(searchParams.get("regulome_max")) : undefined,
    consequence: searchParams.get("consequence")?.split(",").filter(Boolean),
    impact: searchParams.get("impact")?.split(",").filter(Boolean),
  };

  const setFilters = (newFilters: VariantFilters) => {
    const nextParams = new URLSearchParams(searchParams);
    // Clear old
    ["cadd_min", "cadd_max", "gerp_min", "regulome_max", "consequence", "impact"].forEach((k) =>
      nextParams.delete(k)
    );
    // Set new
    if (newFilters.cadd_min !== undefined) nextParams.set("cadd_min", String(newFilters.cadd_min));
    if (newFilters.cadd_max !== undefined) nextParams.set("cadd_max", String(newFilters.cadd_max));
    if (newFilters.gerp_min !== undefined) nextParams.set("gerp_min", String(newFilters.gerp_min));
    if (newFilters.regulome_max !== undefined) nextParams.set("regulome_max", String(newFilters.regulome_max));
    if (newFilters.consequence?.length) nextParams.set("consequence", newFilters.consequence.join(","));
    if (newFilters.impact?.length) nextParams.set("impact", newFilters.impact.join(","));
    setSearchParams(nextParams);
  };

  // ── Gene mode ──────────────────────────────────────────────────
  const { data: geneData, isLoading: geneLoading, error: geneError, refetch: refetchGenes } = useGeneSearch();
  const { data: variantData, isLoading: variantsLoading, error: variantsError, refetch: refetchVariants } = useVariants(
    geneData?.genes ?? [],
    filters,
  );

  // ── Pathway mode ───────────────────────────────────────────────
  const { data: pathwayData, isLoading: pathwayLoading, error: pathwayError, refetch: refetchPathways } = useQuery({
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

  const VARIANT_HEADERS = ["Gene", "rsID", "Consequence", "Impact", "CADD", "GERP++", "RegulomeDB", "Protein Position", "Amino Acid Change", "dbSNP URL", "VEP URL"];
  const variantRows = () =>
    (variantData?.variants ?? []).map((v) => [
      v.gene_symbol ?? "",
      v.rsid,
      v.consequence ?? "",
      v.impact ?? "",
      v.cadd_score?.toString() ?? "",
      v.gerp_score?.toString() ?? "",
      v.regulome_rank ?? "",
      v.protein_position ?? "",
      v.amino_acid_change ?? "",
      v.dbsnp_url ?? "",
      v.ensembl_vep_url ?? "",
    ]);

  const handleExportVariantsCSV = () => exportCSV(VARIANT_HEADERS, variantRows(), `variants_${query}.csv`);
  const handleExportVariantsTSV = () => exportTSV(VARIANT_HEADERS, variantRows(), `variants_${query}.tsv`);

  const isLoading = mode === "pathway" ? pathwayLoading : geneLoading;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {mode === "pathway" && <Network className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#002045] dark:text-slate-100">
              Results for &ldquo;{query}&rdquo;
            </h1>
          </div>
          {mode === "gene" && geneData && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{geneData.total} genes found</p>
          )}
          {mode === "pathway" && pathwayData && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {pathwayData.total} pathways found — click a pathway to view its proteins
            </p>
          )}
        </div>
        {mode === "gene" && (
          <button
            onClick={handleExportGenes}
            className="flex items-center gap-2 px-4 py-2 bg-[#002045] dark:bg-blue-700 text-white text-sm font-bold rounded-xl hover:opacity-90"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* ── Pathway mode ─────────────────────────────────────────── */}
      {mode === "pathway" && (
        <>
          {isLoading && <SkeletonTable rows={6} columns={3} />}
          {pathwayError && (
             <ErrorState error={pathwayError} onRetry={() => refetchPathways()} />
          )}
          {pathwayData && (
            <PathwayResultsPanel pathways={pathwayData.pathways} />
          )}
        </>
      )}

      {/* ── Gene mode ─────────────────────────────────────────────── */}
      {mode === "gene" && (
        <>
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "text-blue-700 dark:text-blue-400 border-blue-700 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Gene & Protein Overview
            </button>
            <button
              onClick={() => setActiveTab("variants")}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === "variants"
                  ? "text-blue-700 dark:text-blue-400 border-blue-700 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Genetic Variation & Annotations
            </button>
          </div>

          {geneLoading && <SkeletonTable rows={8} columns={5} />}
          {geneError && (
             <ErrorState error={geneError} onRetry={() => refetchGenes()} />
          )}
          {geneData && activeTab === "overview" && <GeneTable genes={geneData.genes} />}
          {geneData && activeTab === "variants" && (
            <div className="flex gap-6">
              <div className="w-64 flex-shrink-0">
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>
              <div className="flex-1 space-y-3">
                {variantData?.variants.length ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{variantData.total} variants</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportVariantsCSV}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#002045] dark:bg-blue-700 text-white text-xs font-bold rounded-lg hover:opacity-90"
                      >
                        <Download className="w-3 h-3" /> CSV
                      </button>
                      <button
                        onClick={handleExportVariantsTSV}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-[#002045] dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Download className="w-3 h-3" /> TSV
                      </button>
                    </div>
                  </div>
                ) : null}
                {variantsLoading ? (
                  <SkeletonTable rows={10} columns={8} />
                ) : variantsError ? (
                  <ErrorState error={variantsError} onRetry={() => refetchVariants()} />
                ) : variantData?.variants.length ? (
                  <VariantTable variants={variantData.variants} />
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
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
