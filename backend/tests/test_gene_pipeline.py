import pytest
from backend.services.gene_pipeline import GenePipeline


@pytest.mark.asyncio
async def test_pipeline_search_gene():
    pipeline = GenePipeline()
    result = await pipeline.search_genes("TP53")
    assert len(result) > 0
    gene = result[0]
    assert gene["symbol"] == "TP53"
    assert gene["ncbi_id"] is not None
    assert gene["ensembl_id"] is not None


@pytest.mark.asyncio
async def test_pipeline_search_multi_gene():
    pipeline = GenePipeline()
    result = await pipeline.search_genes("BRCA1, TP53")
    assert len(result) >= 2
    symbols = [g["symbol"] for g in result]
    assert "BRCA1" in symbols
    assert "TP53" in symbols
