import pytest

from backend.services.gnomad import GnomadClient


@pytest.mark.asyncio
async def test_fetch_variant_by_rsid_returns_population_frequencies():
    client = GnomadClient()
    result = await client.get_variant_frequencies("rs80357906")
    assert result is not None
    assert "af" in result
    assert "af_popmax" in result
    assert "populations" in result
    pops = {p["id"]: p for p in result["populations"]}
    assert any(k in pops for k in ("nfe", "afr", "eas", "amr"))


@pytest.mark.asyncio
async def test_fetch_variant_returns_none_for_unknown_rsid():
    client = GnomadClient()
    result = await client.get_variant_frequencies("rs999999999999")
    assert result is None


@pytest.mark.asyncio
async def test_fetch_variant_handles_empty_input():
    client = GnomadClient()
    result = await client.get_variant_frequencies("")
    assert result is None


@pytest.mark.asyncio
async def test_batch_fetch_multiple_rsids():
    client = GnomadClient()
    results = await client.get_variants_batch(["rs80357906", "rs999999999999"])
    assert isinstance(results, dict)
    assert "rs80357906" in results
    assert results["rs80357906"] is not None
    assert results["rs999999999999"] is None
