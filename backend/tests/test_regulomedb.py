import pytest
from backend.services.regulomedb import RegulomeDBClient


@pytest.mark.asyncio
async def test_get_regulome_score():
    client = RegulomeDBClient()
    results = await client.get_regulome_scores(["rs7903146"])  # well-studied TCF7L2 SNP
    assert len(results) == 1
    assert "rs7903146" in results
    rank = results["rs7903146"]
    assert rank is None or isinstance(rank, str)


@pytest.mark.asyncio
async def test_get_regulome_scores_empty():
    client = RegulomeDBClient()
    results = await client.get_regulome_scores([])
    assert results == {}
