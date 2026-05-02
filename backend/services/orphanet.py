"""
Orphanet rare disease cross-reference client.

Orphanet does not offer a standard REST API. We provide:
  1. Cross-reference lookup from OMIM MIM number to Orphanet ORPHA code
     using the public search endpoint (returns HTML page with ORPHA codes).
  2. Orphanet disease URL builder for direct linking.

The primary Orphanet data reaches the user through:
  - ClinVar condition xrefs (already include orphanet_id in v1.3.0)
  - Direct Orphanet search links from the disease panel
"""
from __future__ import annotations

import asyncio
import re
from typing import Dict, List, Optional
from urllib.parse import quote

import httpx

from backend.core.resilience import retry_http

ORPHANET_BASE = "https://www.orpha.net"
ORPHANET_SEARCH = f"{ORPHANET_BASE}/en/disease/search"


def orpha_search_url(query: str) -> str:
    """Build Orphanet disease search URL for a gene symbol or disease name."""
    return f"{ORPHANET_SEARCH}?search={quote(query)}"


def orpha_entry_url(orpha_code: str) -> str:
    """Build Orphanet disease entry URL for a specific ORPHA code."""
    if not orpha_code:
        return ""
    return f"{ORPHANET_BASE}/en/disease/detail/{orpha_code}"


class OrphanetClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(3)

    @retry_http(attempts=3)
    async def lookup_by_gene(self, gene_symbol: str) -> List[Dict]:
        """
        Search Orphanet for diseases associated with a gene.

        Orphanet search returns HTML; we extract ORPHA codes and disease
        names from the search results page. This is fragile — Orphanet may
        change their page structure.

        Returns list of {"orpha_code": str, "name": str} or empty list.
        """
        if not gene_symbol:
            return []

        # Try the Orphanet search API endpoint (JSON if available)
        search_url = f"{ORPHANET_BASE}/en/api/disease/search?query={quote(gene_symbol)}"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(search_url)
                if resp.status_code == 404:
                    return []
                resp.raise_for_status()

                try:
                    data = resp.json()
                    results = []
                    raw_results = data.get("results", data.get("diseases", []))
                    if isinstance(raw_results, list):
                        for entry in raw_results[:20]:
                            results.append({
                                "orpha_code": str(entry.get("code", entry.get("orphaCode", entry.get("id", "")))),
                                "name": entry.get("name", entry.get("diseaseName", "")),
                                "url": orpha_entry_url(str(entry.get("code", entry.get("orphaCode", entry.get("id", ""))))),
                            })
                    return results
                except (ValueError, KeyError):
                    return []