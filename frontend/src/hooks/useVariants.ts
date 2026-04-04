import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VariantFilters, Gene } from "@/types";

export function useVariants(genes: Gene[], filters: VariantFilters, page = 1, limit = 50) {
  return useQuery({
    queryKey: ["variants", genes.map((g) => g.symbol), filters, page, limit],
    queryFn: async () => {
      const allVariants = await Promise.all(
        genes
          .filter((g) => g.ensembl_id)
          .map((g) => {
            const params: Record<string, string> = { page: String(page), limit: String(limit) };
            if (filters.cadd_min !== undefined) params.cadd_min = String(filters.cadd_min);
            if (filters.cadd_max !== undefined) params.cadd_max = String(filters.cadd_max);
            if (filters.gerp_min !== undefined) params.gerp_min = String(filters.gerp_min);
            if (filters.consequence?.length) params.consequence = filters.consequence.join(",");
            if (filters.impact?.length) params.impact = filters.impact.join(",");
            if (filters.regulome_max !== undefined) params.regulome_max = String(filters.regulome_max);
            return api.getVariants(g.symbol, g.ensembl_id!, params);
          }),
      );
      return {
        variants: allVariants.flatMap((r) => r.variants),
        total: allVariants.reduce((sum, r) => sum + r.total, 0),
      };
    },
    enabled: genes.length > 0 && genes.some((g) => g.ensembl_id),
  });
}
