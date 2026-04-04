import asyncio
from typing import List, Dict
import httpx

STRING_BASE = "https://string-db.org/api"


class StringDBClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    async def get_interaction_partners(
        self,
        gene_symbol: str,
        species: int = 9606,
        limit: int = 20,
    ) -> List[Dict]:
        """
        Fetch predicted functional partners from STRING DB.
        Returns partners sorted by combined confidence score (descending).
        Score interpretation: >= 0.9 highest, >= 0.7 high, >= 0.4 medium.
        """
        async with self._semaphore:
            try:
                async with httpx.AsyncClient(timeout=20) as client:
                    resp = await client.get(
                        "{}/json/interaction_partners".format(STRING_BASE),
                        params={
                            "identifiers": gene_symbol,
                            "species": species,
                            "limit": limit,
                            "caller_identity": "helixbio_annotation",
                        },
                    )
                    if resp.status_code != 200:
                        return []
                    data = resp.json()
                    if isinstance(data, dict) and data.get("error"):
                        return []
                    partners = []
                    for item in data:
                        preferred_b = item.get("preferredName_B", "")
                        # Exclude self-interactions
                        if preferred_b and preferred_b.upper() != gene_symbol.upper():
                            string_id_a = item.get("stringId_A", "")
                            string_id_b = item.get("stringId_B", "")
                            partners.append({
                                "symbol": preferred_b,
                                "string_id": string_id_b,
                                "combined_score": round(float(item.get("score", 0)), 3),
                                "neighborhood_score": round(float(item.get("nscore", 0)), 3),
                                "fusion_score": round(float(item.get("fscore", 0)), 3),
                                "cooccurrence_score": round(float(item.get("pscore", 0)), 3),
                                "experimental_score": round(float(item.get("escore", 0)), 3),
                                "database_score": round(float(item.get("dscore", 0)), 3),
                                "textmining_score": round(float(item.get("tscore", 0)), 3),
                                "string_url": "https://string-db.org/cgi/network?identifiers={}&species={}".format(
                                    gene_symbol + "%0D" + preferred_b, species
                                ),
                            })
                    return sorted(partners, key=lambda x: x["combined_score"], reverse=True)
            except Exception:
                return []
