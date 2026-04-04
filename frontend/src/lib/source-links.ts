export const sourceLinks = {
  ncbiGene: (ncbiId: string) => `https://www.ncbi.nlm.nih.gov/gene/${ncbiId}`,
  ensemblGene: (ensemblId: string) => `https://ensembl.org/Homo_sapiens/Gene/Summary?g=${ensemblId}`,
  dbsnp: (rsid: string) => `https://www.ncbi.nlm.nih.gov/snp/${rsid}`,
  ensemblVariation: (rsid: string) => `https://ensembl.org/Homo_sapiens/Variation/Explore?v=${rsid}`,
  uniprot: (symbol: string) => `https://www.uniprot.org/uniprotkb?query=${symbol}+AND+organism_id:9606`,
  clinvar: (symbol: string) => `https://www.ncbi.nlm.nih.gov/clinvar/?term=${symbol}[gene]`,
  regulomedb: (rsid: string) => `https://regulomedb.org/regulome-search/?regions=${rsid}`,
};
