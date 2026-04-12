import asyncio
from typing import List, Optional

import httpx

ENSEMBL_REST = "https://rest.ensembl.org"


class EnsemblClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(15)

    async def get_ensembl_id(self, gene_symbol: str) -> Optional[str]:
        url = f"{ENSEMBL_REST}/xrefs/symbol/homo_sapiens/{gene_symbol}"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, headers={"Content-Type": "application/json"})
                if resp.status_code == 400:
                    return None
                resp.raise_for_status()
                data = resp.json()

        for entry in data:
            if entry.get("type") == "gene":
                return entry["id"]
        return data[0]["id"] if data else None

    async def get_variants_for_gene(self, ensembl_id: str, limit: Optional[int] = None) -> List[str]:
        url = f"{ENSEMBL_REST}/overlap/id/{ensembl_id}?feature=variation"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(url, headers={"Content-Type": "application/json"})
                resp.raise_for_status()
                data = resp.json()

        rsids = [v["id"] for v in data if "id" in v]
        if limit:
            rsids = rsids[:limit]
        return rsids

    async def get_tissue_expression(self, ensembl_id: str) -> List[dict]:
        """
        Fetches tissue-specific median gene expression data from the GTEx v8 public API.
        
        :param ensembl_id: Ensembl gene ID (e.g., ENSG00000139618)
        :return: A list of dictionaries containing tissue name and median TPM value.
        """
        # 1. First, we need to resolve the versioned Gencode ID as GTEx medianGeneExpression 
        # API requires the exact versioned ID (e.g., ENSG00000139618.14).
        lookup_url = f"https://gtexportal.org/api/v2/reference/gene?geneId={ensembl_id}&format=json"
        
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                # Resolve canonical gencodeId
                resp = await client.get(lookup_url)
                if resp.status_code != 200:
                    return []
                
                gene_data = resp.json().get("data", [])
                if not gene_data:
                    return []
                
                # Take the first gencodeId matching the input ensembl_id
                gencode_id = gene_data[0]["gencodeId"]
                
                # 2. Get median expression data for the versioned Gencode ID
                # We use datasetId=gtex_v8 (the latest version generally used for this API).
                expr_url = f"https://gtexportal.org/api/v2/expression/medianGeneExpression?datasetId=gtex_v8&gencodeId={gencode_id}&format=json"
                resp = await client.get(expr_url)
                if resp.status_code != 200:
                    return []
                    
                data = resp.json().get("data", [])
        
        # Format the result for the frontend
        results = [
            {
                "tissue": item.get("tissueSiteDetailId", "Unknown").replace("_", " "), 
                "tpm": float(item.get("median", 0.0))
            }
            for item in data
        ]
        
        # Sort by TPM value descending
        return sorted(results, key=lambda x: x["tpm"], reverse=True)
