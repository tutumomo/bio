import type {
  GeneSearchResult,
  VariantListResult,
  Variant,
  User,
  HistoryEntry,
  PathwaySearchResult,
  PathwayProteinsResult,
  StringPartnersResult,
} from "@/types";

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
    fetchAPI<GeneSearchResult>(`/api/genes/search?q=${encodeURIComponent(query)}`),

  autocomplete: (prefix: string) =>
    fetchAPI<{ symbol: string; name: string }[]>(`/api/genes/autocomplete?q=${encodeURIComponent(prefix)}`),

  getVariants: (geneSymbol: string, ensemblId: string, params: Record<string, string>) => {
    const search = new URLSearchParams({ ensembl_id: ensemblId, ...params });
    return fetchAPI<VariantListResult>(`/api/genes/${geneSymbol}/variants?${search}`);
  },

  getVariantAnnotation: (rsid: string) =>
    fetchAPI<Variant>(`/api/variants/${rsid}/annotation`),

  getMe: () => fetchAPI<User>("/api/user/me"),

  getHistory: () => fetchAPI<{ history: HistoryEntry[]; total: number }>("/api/user/history"),

  deleteHistoryEntry: (id: string) =>
    fetchAPI<{ status: string }>(`/api/user/history/${id}`, { method: "DELETE" }),

  clearHistory: () =>
    fetchAPI<{ status: string }>("/api/user/history", { method: "DELETE" }),

  // Pathway (Reactome)
  searchPathways: (query: string) =>
    fetchAPI<PathwaySearchResult>(`/api/pathways/search?q=${encodeURIComponent(query)}`),

  getPathwayProteins: (pathwayId: string) =>
    fetchAPI<PathwayProteinsResult>(`/api/pathways/${encodeURIComponent(pathwayId)}/proteins`),

  // STRING DB functional partners
  getStringPartners: (geneSymbol: string, limit = 20) =>
    fetchAPI<StringPartnersResult>(
      `/api/genes/${encodeURIComponent(geneSymbol)}/string-partners?limit=${limit}`
    ),
};
