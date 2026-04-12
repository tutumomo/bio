import asyncio
import httpx
from typing import Dict, List, Optional
from backend.core.resilience import retry_http

REGULOMEDB_API = "https://regulomedb.org/regulome-search/"


class RegulomeDBClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    async def get_regulome_scores(self, rsids: List[str]) -> Dict[str, Optional[str]]:
        if not rsids:
            return {}
        
        chunk_size = 200
        scores: Dict[str, Optional[str]] = {rsid: None for rsid in rsids}
        
        # Batch rsids in chunks to avoid URL length issues
        for i in range(0, len(rsids), chunk_size):
            batch = rsids[i : i + chunk_size]
            try:
                batch_results = await self._fetch_batch(batch)
                scores.update(batch_results)
            except Exception:
                # For RegulomeDB, we can afford to return None if it fails even after retries
                # as requested by "Return empty results or meaningful error objects"
                pass
            
        return scores

    @retry_http(attempts=3)
    async def _fetch_batch(self, rsids: List[str]) -> Dict[str, Optional[str]]:
        regions = " ".join(rsids)
        url = f"{REGULOMEDB_API}?regions={regions}&genome=GRCh38&format=json"
        
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
        
        batch_scores: Dict[str, Optional[str]] = {rsid: None for rsid in rsids}
        variants = data.get("variants", [])
        for variant in variants:
            ranking = variant.get("regulome_score", {}).get("ranking")
            if ranking:
                variant_rsids = variant.get("rsids", [])
                for v_rsid in variant_rsids:
                    if v_rsid in batch_scores:
                        batch_scores[v_rsid] = str(ranking)
        return batch_scores
