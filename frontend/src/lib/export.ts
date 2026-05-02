import { CLINICAL_DISCLAIMER_EN } from "@/components/ClinicalDisclaimer";

function exportDisclaimerLine() {
  return `# ${CLINICAL_DISCLAIMER_EN} Generated: ${new Date().toISOString()}`;
}

export interface ManifestSource {
  name: string;
  url: string;
  version: string;
  accessed_at: string;
}

export interface ReproducibilityManifest {
  helix_version: string;
  generated_at: string;
  query_gene_symbol: string | undefined;
  query_filter_criteria: Record<string, unknown>;
  data_sources: ManifestSource[];
  disclaimer: string;
}

const KNOWN_API_SOURCES: ManifestSource[] = [
  {
    name: "NCBI E-utilities (Gene)",
    url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene",
    version: "2026-05 (NCBI Entrez v2.0)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "NCBI E-utilities (ClinVar)",
    url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar",
    version: "2026-05 (NCBI Entrez v2.0)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "NCBI E-utilities (OMIM)",
    url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=omim",
    version: "2026-05 (NCBI Entrez v2.0)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "Ensembl REST API",
    url: "https://rest.ensembl.org",
    version: "Ensembl 113 / GRCh38.p14",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "Ensembl VEP",
    url: "https://rest.ensembl.org/vep/human/region",
    version: "VEP 113 / GRCh38.p14 / CADD v1.6 / GERP++ RS",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "RegulomeDB",
    url: "https://regulomedb.org",
    version: "RegulomeDB v2.2 (2024-06)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "gnomAD",
    url: "https://gnomad.broadinstitute.org/api",
    version: "gnomAD v4.0 (gnomad_r4)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "ClinVar",
    url: "https://www.ncbi.nlm.nih.gov/clinvar/",
    version: "ClinVar (NCBI Entrez, monthly release)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "OMIM",
    url: "https://omim.org/",
    version: "OMIM (NCBI Entrez indexed, updated daily)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "Orphanet",
    url: "https://www.orpha.net/",
    version: "Orphanet (November 2024 release)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "Reactome",
    url: "https://reactome.org/ContentService",
    version: "Reactome v89 (2025-06)",
    accessed_at: new Date().toISOString(),
  },
  {
    name: "STRING DB",
    url: "https://string-db.org/api",
    version: "STRING v12.0 (2024-01)",
    accessed_at: new Date().toISOString(),
  },
];

export function generateManifest(
  geneSymbol: string | undefined,
  filters: Record<string, unknown>
): ReproducibilityManifest {
  return {
    helix_version: "Helix Bio v2.5.0",
    generated_at: new Date().toISOString(),
    query_gene_symbol: geneSymbol,
    query_filter_criteria: filters,
    data_sources: KNOWN_API_SOURCES,
    disclaimer: CLINICAL_DISCLAIMER_EN,
  };
}

export function exportManifestJSON(manifest: ReproducibilityManifest, filename: string) {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    exportDisclaimerLine(),
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTSV(headers: string[], rows: string[][], filename: string) {
  const tsvContent = [exportDisclaimerLine(), headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
  const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
