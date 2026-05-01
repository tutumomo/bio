"""
OMIM disease association client via NCBI E-utilities (esearch db=omim + esummary).

OMIM is a paid API; NCBI E-utilities provides free access to OMIM gene-disease
relationships through the omim database.

Flow:
  1. Given a gene symbol, esearch db=omim for "{gene}[gene]" to get OMIM entries
  2. esummary db=omim to get disease title, MIM number, inheritance, description
"""
from __future__ import annotations

import asyncio
from typing import Dict, List, Optional

import httpx

from backend.core.config import settings
from backend.core.resilience import retry_http

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class OmimClient:
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
                now = loop.time()
                gap = now - self._last_request_at
                if gap < self._min_request_interval:
                    await asyncio.sleep(self._min_request_interval - gap)
                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(url)
                self._last_request_at = loop.time()
        resp.raise_for_status()
        return resp.json()

    @retry_http(attempts=3)
    async def _esearch(self, term: str) -> List[str]:
        url = (
            f"{NCBI_BASE}/esearch.fcgi?db=omim"
            f"&term={term}&retmax=50&retmode=json"
            f"{self._api_key_param}"
        )
        data = await self._get_json(url)
        return data.get("esearchresult", {}).get("idlist", [])

    async def _esummary_batch(self, omim_ids: List[str]) -> Dict[str, dict]:
        if not omim_ids:
            return {}
        ids_str = ",".join(omim_ids)
        url = (
            f"{NCBI_BASE}/esummary.fcgi?db=omim"
            f"&id={ids_str}&retmode=json"
            f"{self._api_key_param}"
        )
        data = await self._get_json(url)
        results = data.get("result", {})
        return {uid: results[uid] for uid in omim_ids if uid in results}

    async def get_diseases_for_gene(self, gene_symbol: str, limit: int = 20) -> List[Dict]:
        """
        Search OMIM for phenotype entries linked to a gene symbol.
        Uses "{gene}[gene]" syntax to find gene-phenotype relationships.

        Returns list of disease entries with:
          - mim_number, title, inheritance, description, phenotype_type,
            gene_symbol, chromosome, last_updated
        """
        if not gene_symbol:
            return []

        # Search OMIM for entries where this gene is mentioned
        ids = await self._esearch(f"{gene_symbol}[gene]")
        if not ids:
            return []

        summaries = await self._esummary_batch(ids)
        results = []
        for omim_id in ids:
            doc = summaries.get(omim_id)
            if not doc:
                continue

            title = doc.get("title") or ""
            # Only include phenotype entries (not gene-only entries)
            prefix = doc.get("prefix", "")

            results.append({
                "mim_number": doc.get("uid"),
                "title": title,
                "phenotype_type": prefix,
                "chromosome": doc.get("chromosome"),
                "gene_symbols": doc.get("genes") or [],
                "description": doc.get("description") or "",
                "inheritance": self._extract_inheritance(doc),
                "last_updated": doc.get("last_updated"),
            })

        return results[:limit]

    @staticmethod
    def _extract_inheritance(doc: dict) -> Optional[str]:
        """Extract inheritance pattern from OMIM clinical synopsis or description."""
        text = (doc.get("clinicalsynopsis") or "").lower()
        if not text:
            text = (doc.get("description") or "").lower()

        patterns = [
            ("autosomal dominant", "Autosomal dominant"),
            ("autosomal recessive", "Autosomal recessive"),
            ("x-linked dominant", "X-linked dominant"),
            ("x-linked recessive", "X-linked recessive"),
            ("mitochondrial", "Mitochondrial"),
            ("multifactorial", "Multifactorial"),
            ("somatic", "Somatic"),
        ]
        for keyword, label in patterns:
            if keyword in text:
                return label
        return None