export const sourceLinks = {
  ncbiGene: (ncbiId: string) => `https://www.ncbi.nlm.nih.gov/gene/${encodeURIComponent(ncbiId)}`,
  ensemblGene: (ensemblId: string) => `https://ensembl.org/Homo_sapiens/Gene/Summary?g=${encodeURIComponent(ensemblId)}`,
  dbsnp: (rsid: string) => `https://www.ncbi.nlm.nih.gov/snp/${encodeURIComponent(rsid)}`,
  ensemblVariation: (rsid: string) => `https://ensembl.org/Homo_sapiens/Variation/Explore?v=${encodeURIComponent(rsid)}`,
  uniprot: (symbol: string) => `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(symbol)}+AND+organism_id:9606`,
  clinvar: (symbol: string) => `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(symbol)}[gene]`,
  regulomedb: (rsid: string) => `https://regulomedb.org/regulome-search/?regions=${encodeURIComponent(rsid)}`,
};
