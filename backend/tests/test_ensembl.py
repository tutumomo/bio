import pytest
from backend.services.ensembl import EnsemblClient


@pytest.mark.asyncio
async def test_get_ensembl_id():
    client = EnsemblClient()
    ensembl_id = await client.get_ensembl_id("BRCA1")
    assert ensembl_id == "ENSG00000012048"


@pytest.mark.asyncio
async def test_get_ensembl_id_unknown():
    client = EnsemblClient()
    ensembl_id = await client.get_ensembl_id("XYZFAKEGENE999")
    assert ensembl_id is None


@pytest.mark.asyncio
async def test_get_variants_for_gene():
    client = EnsemblClient()
    variants = await client.get_variants_for_gene("ENSG00000141510", limit=10)  # TP53
    assert len(variants) > 0
    assert all(isinstance(v, str) for v in variants)
