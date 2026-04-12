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


@pytest.mark.asyncio
async def test_get_tissue_expression():
    client = EnsemblClient()
    # BRCA2 Ensembl ID: ENSG00000139618
    expression = await client.get_tissue_expression("ENSG00000139618")
    assert isinstance(expression, list)
    assert len(expression) > 0
    assert "tissue" in expression[0]
    assert "tpm" in expression[0]
    assert isinstance(expression[0]["tpm"], (int, float))
