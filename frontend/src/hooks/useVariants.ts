import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VariantFilters, Gene } from "@/types";

export function useVariants(genes: Gene[], filters: VariantFilters, page = 1, limit = 200) {
  return useQuery({
    queryKey: ["variants", genes.map((g) => g.symbol), filters, page, limit],
    queryFn: async () => {
      const allVariants = await Promise.all(
        genes
          .filter((g) => g.ensembl_id)
          .map((g) => {
            const params: Record<string, string> = {
              page: String(page),
              limit: String(limit),
              ...((filters.cadd_min !== undefined) && { cadd_min: String(filters.cadd_min) }),
              ...((filters.cadd_max !== undefined) && { cadd_max: String(filters.cadd_max) }),
              ...((filters.gerp_min !== undefined) && { gerp_min: String(filters.gerp_min) }),
              ...((filters.consequence?.length) && { consequence: filters.consequence.join(",") }),
              ...((filters.impact?.length) && { impact: filters.impact.join(",") }),
              ...((filters.regulome_max !== undefined) && { regulome_max: String(filters.regulome_max) }),
            };
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
