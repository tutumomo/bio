import asyncio
import re
from typing import List, Dict
import httpx


def _strip_html(text: str) -> str:
    """Remove HTML highlight tags returned by Reactome search."""
    return re.sub(r"<[^>]+>", "", text).strip()

REACTOME_BASE = "https://reactome.org/ContentService"


class ReactomeClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    async def search_pathways(self, query: str) -> List[Dict]:
        """Search human pathways by keyword via Reactome full-text search."""
        async with self._semaphore:
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(
                        f"{REACTOME_BASE}/search/query",
                        params={
                            "query": query,
                            "types": "Pathway",
                            "species": "Homo sapiens",
                            "cluster": "true",
                        },
                    )
                    if resp.status_code != 200:
                        return []
                    data = resp.json()
                    results = []
                    for group in data.get("results", []):
                        for entry in group.get("entries", []):
                            st_id = entry.get("stId", "")
                            results.append({
                                "pathway_id": st_id,
                                "name": _strip_html(entry.get("name", "")),
                                "species": "Homo sapiens",
                                "reactome_url": "https://reactome.org/PathwayBrowser/#/{}".format(st_id),
                            })
                    return results[:20]
            except Exception:
                return []

    async def get_pathway_proteins(self, pathway_id: str) -> List[Dict]:
        """Get all proteins that participate in a given Reactome pathway."""
        async with self._semaphore:
            try:
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.get(
                        "{}/data/participants/{}".format(REACTOME_BASE, pathway_id)
                    )
                    if resp.status_code != 200:
                        return []
                    data = resp.json()
                    proteins = []
                    seen: set = set()
                    for item in data:
                        pe = item.get("physicalEntity", {})
                        class_name = pe.get("className", "")
                        gene_names = pe.get("geneName", [])
                        identifier = pe.get("identifier", "")
                        display_name = pe.get("displayName", "")
                        # Keep only proteins that have a mapped gene symbol
                        if gene_names and class_name in (
                            "Protein",
                            "EntityWithAccessionedSequence",
                        ):
                            symbol = gene_names[0]
                            if symbol not in seen:
                                seen.add(symbol)
                                proteins.append({
                                    "symbol": symbol,
                                    "display_name": display_name,
                                    "uniprot_id": identifier,
                                    "uniprot_url": "https://www.uniprot.org/uniprot/{}".format(identifier) if identifier else None,
                                })
                    return proteins
            except Exception:
                return []
