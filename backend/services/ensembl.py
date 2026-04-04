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
