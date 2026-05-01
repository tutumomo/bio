import pytest
from datetime import datetime, timezone

from backend.models.gene import GeneCache
from backend.models.variant import VariantCache


@pytest.mark.asyncio
async def test_cached_brca1_variant_includes_clinical_fields(client, db_session):
    fetched_at = datetime.now(timezone.utc).replace(tzinfo=None)
    gene = GeneCache(
        gene_id="BRCA1_672",
        symbol="BRCA1",
        ncbi_id="672",
        ensembl_id="ENSG00000012048",
        fetched_at=fetched_at,
    )
    variant = VariantCache(
        rsid="rs80357906",
        gene_id="BRCA1_672",
        consequence="frameshift_variant",
        impact="HIGH",
        cadd_score=35,
        gerp_score=5.0,
        hgvsc="ENST00000357654.9:c.5266dup",
        hgvsp="ENSP00000350283.4:p.Gln1756ProfsTer74",
        fetched_at=fetched_at,
    )
    db_session.add(gene)
    db_session.add(variant)
    await db_session.commit()

    variant_response = await client.get(
        "/api/genes/BRCA1/variants?ensembl_id=ENSG00000012048&limit=5"
    )
    assert variant_response.status_code == 200, variant_response.text
    variants = variant_response.json().get("variants") or []
    assert len(variants) > 0

    for result in variants:
        assert "clinvar_significance" in result
        assert "gnomad_af_popmax" in result
        assert result["acmg_tier"] in {
            "Pathogenic",
            "Likely pathogenic",
            "Uncertain significance",
            "Likely benign",
            "Benign",
        }
        assert isinstance(result["acmg_evidence_codes"], list)
        assert isinstance(result["acmg_rationale"], str)

    seeded = next((v for v in variants if v["rsid"] == "rs80357906"), None)
    if seeded:
        assert seeded["hgvsc"] == "ENST00000357654.9:c.5266dup"
