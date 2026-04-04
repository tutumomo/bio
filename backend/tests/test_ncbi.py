import pytest
from backend.services.ncbi import NCBIClient


@pytest.mark.asyncio
async def test_search_genes_returns_ids():
    client = NCBIClient()
    ids = await client.search_genes("BRCA1")
    assert len(ids) > 0
    assert all(isinstance(i, str) for i in ids)


@pytest.mark.asyncio
async def test_get_gene_summary():
    client = NCBIClient()
    summaries = await client.get_gene_summaries(["672"])  # BRCA1 NCBI Gene ID
    assert len(summaries) == 1
    gene = summaries[0]
    assert gene["symbol"] == "BRCA1"
    assert "chromosome" in gene
    assert "name" in gene


@pytest.mark.asyncio
async def test_search_genes_empty_query():
    client = NCBIClient()
    ids = await client.search_genes("xyznonexistentgene12345")
    assert ids == []
