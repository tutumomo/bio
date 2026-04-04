import asyncio
import httpx
from typing import Dict, List, Optional

REGULOMEDB_API = "https://regulomedb.org/regulome/search"


class RegulomeDBClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    async def get_regulome_scores(self, rsids: List[str]) -> Dict[str, Optional[str]]:
        if not rsids:
            return {}
        tasks = [self._fetch_single(rsid) for rsid in rsids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        scores: Dict[str, Optional[str]] = {}
        for rsid, result in zip(rsids, results):
            if isinstance(result, Exception):
                scores[rsid] = None
            else:
                scores[rsid] = result
        return scores

    async def _fetch_single(self, rsid: str) -> Optional[str]:
        url = f"{REGULOMEDB_API}?regions={rsid}&genome=GRCh38&format=json"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return None
                data = resp.json()
        variants = data.get("variants", [])
        if not variants:
            return None
        for variant in variants:
            ranking = variant.get("regulome_score", {})
            rank = ranking.get("ranking")
            if rank:
                return str(rank)
        return None
