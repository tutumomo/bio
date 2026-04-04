import { useState } from "react";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useGeneSearch } from "@/hooks/useGeneSearch";
import { GeneTable } from "@/components/GeneTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { exportCSV } from "@/lib/export";
import { FilterPanel } from "@/components/FilterPanel";
import { VariantTable } from "@/components/VariantTable";
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters } from "@/types";

export function ResultsPage() {
  const { query, data, isLoading, error } = useGeneSearch();
  const [activeTab, setActiveTab] = useState<"genes" | "variants">("genes");
  const [filters, setFilters] = useState<VariantFilters>({});
  const { data: variantData, isLoading: variantsLoading } = useVariants(
    data?.genes ?? [],
    filters,
  );

  const handleExportGenes = () => {
    if (!data?.genes) return;
    const headers = ["Gene Symbol", "Product Protein", "Chromosome", "Length (bp)", "NCBI URL", "Ensembl URL"];
    const rows = data.genes.map((g) => [
      g.symbol,
      g.full_name ?? "",
      g.chromosome ?? "",
      g.length?.toString() ?? "",
      g.ncbi_url ?? "",
      g.ensembl_url ?? "",
    ]);
    exportCSV(headers, rows, `gene_overview_${query}.csv`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">
            Results for &ldquo;{query}&rdquo;
          </h1>
          {data && <p className="text-sm text-slate-500 mt-1">{data.total} genes found</p>}
        </div>
        <button
          onClick={handleExportGenes}
          className="flex items-center gap-2 px-4 py-2 bg-[#002045] text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("genes")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "genes"
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

      {isLoading && <SkeletonTable rows={8} cols={5} />}
      {error && (
        <div className="p-8 text-center bg-red-50 rounded-xl text-red-700">
          Error loading data. Please try again.
        </div>
      )}
      {data && activeTab === "genes" && <GeneTable genes={data.genes} />}
      {data && activeTab === "variants" && (
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
    </motion.div>
  );
}
