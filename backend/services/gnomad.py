from __future__ import annotations

import asyncio
from typing import Dict, List, Optional

import httpx

from backend.core.resilience import retry_http

GNOMAD_API = "https://gnomad.broadinstitute.org/api"
DATASET = "gnomad_r4"

_VARIANT_QUERY = """
query VariantByRsid($rsid: String!) {
  variant(rsid: $rsid, dataset: %s) {
    variant_id
    rsids
    exome { ac an af populations { id ac an } filters }
    genome { ac an af populations { id ac an } filters }
  }
}
""" % DATASET


def _compute_population_af(populations: List[Dict]) -> List[Dict]:
    out = []
    for p in populations or []:
        an = p.get("an") or 0
        ac = p.get("ac") or 0
        af = (ac / an) if an else None
        out.append({
            "id": p.get("id"),
            "ac": ac,
            "an": an,
            "af": af,
        })
    return out


def _summarize_variant(raw: Dict) -> Dict:
    exome = raw.get("exome") or {}
    genome = raw.get("genome") or {}
    primary = exome if exome.get("af") is not None else genome
    populations = _compute_population_af(primary.get("populations") or [])

    main_pops = [
        p for p in populations
        if p["id"] in {"afr", "amr", "asj", "eas", "fin", "nfe", "sas", "mid"}
        and p.get("af") is not None
    ]
    af_popmax = max((p["af"] for p in main_pops), default=None)
    popmax_pop = None
    if af_popmax is not None:
        popmax_pop = next(p["id"] for p in main_pops if p["af"] == af_popmax)

    return {
        "variant_id": raw.get("variant_id"),
        "af": primary.get("af"),
        "ac": primary.get("ac"),
        "an": primary.get("an"),
        "af_popmax": af_popmax,
        "popmax_population": popmax_pop,
        "filters": primary.get("filters") or [],
        "populations": populations,
        "source": "exome" if exome.get("af") is not None else "genome",
    }


class GnomadClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    @retry_http(attempts=3)
    async def get_variant_frequencies(self, rsid: str) -> Optional[Dict]:
        if not rsid or not rsid.startswith("rs"):
            return None

        payload = {"query": _VARIANT_QUERY, "variables": {"rsid": rsid}}
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(GNOMAD_API, json=payload)
                resp.raise_for_status()
                data = resp.json()

        if data.get("errors"):
            return None
        variant = (data.get("data") or {}).get("variant")
        if not variant:
            return None
        return _summarize_variant(variant)

    async def get_variants_batch(self, rsids: List[str]) -> Dict[str, Optional[Dict]]:
        if not rsids:
            return {}

        tasks = [self.get_variant_frequencies(rsid) for rsid in rsids]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return {
            rsid: (result if not isinstance(result, Exception) else None)
            for rsid, result in zip(rsids, results)
        }
