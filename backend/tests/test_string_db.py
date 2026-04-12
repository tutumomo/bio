import pytest
from backend.services.string_db import StringDBClient


@pytest.mark.asyncio
async def test_get_interaction_partners():
    client = StringDBClient()
    partners = await client.get_interaction_partners("TP53", limit=5)
    assert len(partners) > 0
    p = partners[0]
    assert "symbol" in p
    assert "combined_score" in p
    assert p["combined_score"] > 0
    # Should not include self
    assert all(partner["symbol"].upper() != "TP53" for partner in partners)


@pytest.mark.asyncio
async def test_get_interaction_partners_empty():
    client = StringDBClient()
    partners = await client.get_interaction_partners("ZZZFAKEGENE999")
    assert partners == []


@pytest.mark.asyncio
async def test_partners_sorted_by_score():
    client = StringDBClient()
    partners = await client.get_interaction_partners("BRCA1", limit=10)
    if len(partners) > 1:
        scores = [p["combined_score"] for p in partners]
        assert scores == sorted(scores, reverse=True)
