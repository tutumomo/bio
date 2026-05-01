"""
OMIM disease association tests — uses real NCBI E-utilities (matches existing codebase pattern).
"""
import pytest
from backend.services.omim import OmimClient


@pytest.mark.asyncio
async def test_get_diseases_for_known_gene():
    """BRCA1 should have OMIM phenotype entries."""
    client = OmimClient()
    results = await client.get_diseases_for_gene("BRCA1")
    assert len(results) > 0, "BRCA1 must have at least one OMIM phenotype entry"

    first = results[0]
    assert "mim_number" in first
    assert "title" in first
    assert "phenotype_type" in first
    assert isinstance(first["title"], str)
    assert len(first["title"]) > 0


@pytest.mark.asyncio
async def test_get_diseases_for_unknown_gene():
    """An obviously fake gene should return empty list."""
    client = OmimClient()
    results = await client.get_diseases_for_gene("ZZXNOTEXISTZZ")
    assert results == []


@pytest.mark.asyncio
async def test_get_diseases_handles_empty_input():
    client = OmimClient()
    results = await client.get_diseases_for_gene("")
    assert results == []


@pytest.mark.asyncio
async def test_get_diseases_inheritance_tp53():
    """TP53 has autosomal dominant inheritance (Li-Fraumeni)."""
    client = OmimClient()
    results = await client.get_diseases_for_gene("TP53", limit=30)
    assert len(results) > 0
    # At least one entry should have some disease title mentioning cancer or syndrome
    titles_lower = [r["title"].lower() for r in results]
    disease_terms = any(
        "cancer" in t or "tumor" in t or "carcinoma" in t or "syndrome" in t
        for t in titles_lower
    )
    assert disease_terms, "TP53 OMIM should include cancer/syndrome diseases"