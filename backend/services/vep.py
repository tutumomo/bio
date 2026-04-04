import asyncio
from typing import Dict, List, Optional

import httpx

ENSEMBL_REST = "https://rest.ensembl.org"
VEP_BATCH_SIZE = 200


class VEPClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(15)

    async def annotate_variants(self, rsids: List[str]) -> List[Dict]:
        if not rsids:
            return []
        all_results: List[Dict] = []
        for i in range(0, len(rsids), VEP_BATCH_SIZE):
            batch = rsids[i : i + VEP_BATCH_SIZE]
            batch_results = await self._annotate_batch(batch)
            all_results.extend(batch_results)
        return all_results

    async def _annotate_batch(self, rsids: List[str]) -> List[Dict]:
        url = f"{ENSEMBL_REST}/vep/human/id"
        payload = {"ids": rsids}
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        params = {"CADD": 1, "Conservation": 1}

        async with self._semaphore:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, json=payload, headers=headers, params=params)
                resp.raise_for_status()
                data = resp.json()

        results: List[Dict] = []
        for entry in data:
            rsid: str = entry.get("id", "")
            most_severe: str = entry.get("most_severe_consequence", "")
            transcript_cons: List[Dict] = entry.get("transcript_consequences", [])
            impact: str = ""
            cadd_score: Optional[float] = None
            gerp_score: Optional[float] = None
            protein_position: Optional[str] = None
            amino_acid_change: Optional[str] = None

            if transcript_cons:
                canonical = next(
                    (tc for tc in transcript_cons if tc.get("canonical", 0) == 1),
                    transcript_cons[0],
                )
                impact = canonical.get("impact", "")
                protein_position = (
                    str(canonical.get("protein_start", ""))
                    if canonical.get("protein_start")
                    else None
                )
                amino_acids: str = canonical.get("amino_acids", "")
                amino_acid_change = amino_acids if amino_acids else None
                cadd_phred = canonical.get("cadd_phred")
                if cadd_phred is not None:
                    cadd_score = float(cadd_phred)
                conservation = canonical.get("conservation")
                if conservation is not None:
                    gerp_score = float(conservation)

            results.append(
                {
                    "rsid": rsid,
                    "consequence": most_severe,
                    "impact": impact,
                    "cadd_score": cadd_score,
                    "gerp_score": gerp_score,
                    "protein_position": protein_position,
                    "amino_acid_change": amino_acid_change,
                }
            )
        return results
