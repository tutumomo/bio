import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export function useGeneSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const result = useQuery({
    queryKey: ["genes", query],
    queryFn: () => api.searchGenes(query),
    enabled: query.length > 0,
  });

  return { query, ...result };
}
