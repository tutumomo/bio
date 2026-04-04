export interface Gene {
  gene_id: string;
  symbol: string;
  full_name: string | null;
  chromosome: string | null;
  length: number | null;
  ncbi_id: string | null;
  ensembl_id: string | null;
  ncbi_url: string | null;
  ensembl_url: string | null;
}

export interface GeneSearchResult {
  genes: Gene[];
  query: string;
  total: number;
}

export interface Variant {
  rsid: string;
  gene_id: string | null;
  gene_symbol: string | null;
  consequence: string | null;
  impact: string | null;
  cadd_score: number | null;
  gerp_score: number | null;
  regulome_rank: string | null;
  protein_position: string | null;
  amino_acid_change: string | null;
  dbsnp_url: string | null;
  ensembl_vep_url: string | null;
}

export interface VariantListResult {
  variants: Variant[];
  total: number;
  page: number;
  limit: number;
}

export interface VariantFilters {
  cadd_min?: number;
  cadd_max?: number;
  gerp_min?: number;
  consequence?: string[];
  impact?: string[];
  regulome_max?: number;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  gene_count: number | null;
  variant_count: number | null;
  searched_at: string;
}

export type ImpactLevel = "HIGH" | "MODERATE" | "LOW" | "MODIFIER";
