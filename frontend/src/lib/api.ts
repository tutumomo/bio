const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

export const api = {
  searchGenes: (query: string) =>
    fetchAPI<import("@/types").GeneSearchResult>(`/api/genes/search?q=${encodeURIComponent(query)}`),

  autocomplete: (prefix: string) =>
    fetchAPI<{ symbol: string; name: string }[]>(`/api/genes/autocomplete?q=${encodeURIComponent(prefix)}`),

  getVariants: (geneSymbol: string, ensemblId: string, params: Record<string, string>) => {
    const search = new URLSearchParams({ ensembl_id: ensemblId, ...params });
    return fetchAPI<import("@/types").VariantListResult>(`/api/genes/${geneSymbol}/variants?${search}`);
  },

  getVariantAnnotation: (rsid: string) =>
    fetchAPI<import("@/types").Variant>(`/api/variants/${rsid}/annotation`),

  getMe: () => fetchAPI<import("@/types").User>("/api/user/me"),

  getHistory: () => fetchAPI<{ history: import("@/types").HistoryEntry[]; total: number }>("/api/user/history"),
};
