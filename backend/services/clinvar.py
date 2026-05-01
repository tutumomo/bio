from __future__ import annotations

import asyncio
from typing import Dict, List, Optional

import httpx

from backend.core.config import settings
from backend.core.resilience import retry_http

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

_REVIEW_STARS = {
    "practice guideline": 4,
    "reviewed by expert panel": 3,
    "criteria provided, multiple submitters, no conflicts": 2,
    "criteria provided, single submitter": 1,
    "criteria provided, conflicting classifications": 1,
    "criteria provided, conflicting interpretations": 1,
    "no assertion criteria provided": 0,
    "no assertion provided": 0,
}


def review_status_to_stars(review_status: str) -> int:
    if not review_status:
        return 0
    return _REVIEW_STARS.get(review_status.lower().strip(), 0)


class ClinVarClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(10 if settings.ncbi_api_key else 3)
        self._request_lock = asyncio.Lock()
        self._last_request_at = 0.0
        self._api_key_param = f"&api_key={settings.ncbi_api_key}" if settings.ncbi_api_key else ""
        self._min_request_interval = 0.12 if settings.ncbi_api_key else 0.36

    async def _get_json(self, url: str) -> dict:
        async with self._semaphore:
            async with self._request_lock:
                loop = asyncio.get_running_loop()
                elapsed = loop.time() - self._last_request_at
                if elapsed < self._min_request_interval:
                    await asyncio.sleep(self._min_request_interval - elapsed)

                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(url)
                self._last_request_at = loop.time()

        resp.raise_for_status()
        return resp.json()

    @retry_http(attempts=3)
    async def _esearch(self, rsid: str) -> List[str]:
        url = (
            f"{NCBI_BASE}/esearch.fcgi?db=clinvar"
            f"&term={rsid}&retmode=json{self._api_key_param}"
        )
        data = await self._get_json(url)
        return data.get("esearchresult", {}).get("idlist", [])

    @retry_http(attempts=3)
    async def _esummary(self, clinvar_id: str) -> Optional[Dict]:
        url = (
            f"{NCBI_BASE}/esummary.fcgi?db=clinvar"
            f"&id={clinvar_id}&retmode=json{self._api_key_param}"
        )
        data = await self._get_json(url)
        return (data.get("result") or {}).get(clinvar_id)

    async def get_classification(self, rsid: str) -> Optional[Dict]:
        if not rsid or not rsid.startswith("rs"):
            return None

        ids = await self._esearch(rsid)
        if not ids:
            return None

        doc = await self._esummary(ids[0])
        if not doc:
            return None

        germline = doc.get("germline_classification") or {}
        classification = germline.get("description") or "not provided"
        review_status = germline.get("review_status") or ""
        last_evaluated = germline.get("last_evaluated") or ""
        conditions = []

        for trait in germline.get("trait_set") or []:
            xrefs = trait.get("trait_xrefs") or []
            xref_map = {xref.get("db_source"): xref.get("db_id") for xref in xrefs}
            conditions.append({
                "name": trait.get("trait_name"),
                "omim_id": xref_map.get("OMIM"),
                "orphanet_id": xref_map.get("Orphanet"),
                "medgen_id": xref_map.get("MedGen"),
                "mondo_id": xref_map.get("MONDO"),
            })

        return {
            "clinvar_id": doc.get("uid"),
            "accession": doc.get("accession"),
            "classification": classification,
            "review_status": review_status,
            "review_stars": review_status_to_stars(review_status),
            "last_evaluated": last_evaluated,
            "conditions": conditions,
        }

    async def get_classifications_batch(self, rsids: List[str]) -> Dict[str, Optional[Dict]]:
        if not rsids:
            return {}

        tasks = [self.get_classification(rsid) for rsid in rsids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return {
            rsid: (result if not isinstance(result, Exception) else None)
            for rsid, result in zip(rsids, results)
        }
