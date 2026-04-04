import pytest
from backend.services.vep import VEPClient


@pytest.mark.asyncio
async def test_annotate_single_variant():
    client = VEPClient()
    results = await client.annotate_variants(["rs80357906"])  # BRCA1 pathogenic variant
    assert len(results) == 1
    ann = results[0]
    assert ann["rsid"] == "rs80357906"
    assert "consequence" in ann
    assert "impact" in ann


@pytest.mark.asyncio
async def test_annotate_batch():
    client = VEPClient()
    rsids = ["rs80357906", "rs28897696"]
    results = await client.annotate_variants(rsids)
    assert len(results) == 2
    assert all("consequence" in r for r in results)


@pytest.mark.asyncio
async def test_annotate_includes_cadd():
    client = VEPClient()
    results = await client.annotate_variants(["rs80357906"])
    ann = results[0]
    assert "cadd_score" in ann


@pytest.mark.asyncio
async def test_annotate_empty_list():
    client = VEPClient()
    results = await client.annotate_variants([])
    assert results == []
