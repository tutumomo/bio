import asyncio
import httpx
from backend.core.config import settings
from backend.core.resilience import retry_http

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class NCBIClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(10 if settings.ncbi_api_key else 3)
        self._api_key_param = f"&api_key={settings.ncbi_api_key}" if settings.ncbi_api_key else ""

    @retry_http(attempts=3)
    async def search_genes(self, query: str, max_results: int = 20) -> list:
        url = (
            f"{NCBI_BASE}/esearch.fcgi?db=gene"
            f"&term={query}[gene]+AND+human[orgn]"
            f"&retmax={max_results}&retmode=json"
            f"{self._api_key_param}"
        )
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
        return data.get("esearchresult", {}).get("idlist", [])

    @retry_http(attempts=3)
    async def get_gene_summaries(self, gene_ids: list) -> list:
        if not gene_ids:
            return []
        ids_str = ",".join(gene_ids)
        url = (
            f"{NCBI_BASE}/esummary.fcgi?db=gene"
            f"&id={ids_str}&retmode=json"
            f"{self._api_key_param}"
        )
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

        results = []
        doc_sums = data.get("result", {})
        for gid in gene_ids:
            info = doc_sums.get(gid, {})
            if not info or "error" in info:
                continue
            genomic_info = info.get("genomicinfo", [{}])
            chrom_loc = info.get("maplocation", "")
            gene_length = None
            if genomic_info and "chrstart" in genomic_info[0] and "chrstop" in genomic_info[0]:
                start = genomic_info[0]["chrstart"]
                stop = genomic_info[0]["chrstop"]
                gene_length = abs(stop - start) + 1

            results.append({
                "ncbi_id": gid,
                "symbol": info.get("name", ""),
                "name": info.get("description", ""),
                "chromosome": chrom_loc,
                "length": gene_length,
                "organism": info.get("organism", {}).get("commonname", ""),
            })
        return results
