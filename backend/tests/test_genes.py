import pytest
from httpx import AsyncClient
from backend.main import app
from backend.models.gene import GeneCache
from datetime import datetime

@pytest.mark.asyncio
async def test_autocomplete(client: AsyncClient, db_session):
    # Setup: Add mock genes to cache
    gene1 = GeneCache(
        gene_id="BRCA1_672",
        symbol="BRCA1",
        full_name="BRCA1 DNA repair associated",
        ncbi_id="672",
        ensembl_id="ENSG00000012048",
        fetched_at=datetime.utcnow()
    )
    gene2 = GeneCache(
        gene_id="BRCA2_675",
        symbol="BRCA2",
        full_name="BRCA2 DNA repair associated",
        ncbi_id="675",
        ensembl_id="ENSG00000139618",
        fetched_at=datetime.utcnow()
    )
    db_session.add(gene1)
    db_session.add(gene2)
    await db_session.commit()

    # Case 1: Search by partial symbol
    response = await client.get("/api/genes/autocomplete?q=BRC")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    symbols = [g["symbol"] for g in data]
    assert "BRCA1" in symbols
    assert "BRCA2" in symbols

    # Case 2: Search by partial name
    response = await client.get("/api/genes/autocomplete?q=repair")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    symbols = [g["symbol"] for g in data]
    assert "BRCA1" in symbols
    assert "BRCA2" in symbols

    # Case 3: Short query
    response = await client.get("/api/genes/autocomplete?q=B")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

@pytest.mark.asyncio
async def test_autocomplete_limit(client: AsyncClient, db_session):
    # Setup: Add 15 genes to cache
    for i in range(15):
        gene = GeneCache(
            gene_id=f"GENE{i}_100{i}",
            symbol=f"GENE{i}",
            full_name=f"Gene number {i}",
            ncbi_id=f"100{i}",
            ensembl_id=f"ENSG000{i}",
            fetched_at=datetime.utcnow()
        )
        db_session.add(gene)
    await db_session.commit()

    response = await client.get("/api/genes/autocomplete?q=GENE")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10


@pytest.mark.asyncio
async def test_gene_expression_endpoint(client: AsyncClient):
    # Test with BRCA2 (ENSG00000139618)
    response = await client.get("/api/genes/BRCA2/expression")
    assert response.status_code == 200
    data = response.json()
    assert data["gene_symbol"] == "BRCA2"
    assert data["ensembl_id"] == "ENSG00000139618"
    assert isinstance(data["expression"], list)
    assert len(data["expression"]) > 0
    assert "tissue" in data["expression"][0]
    assert "tpm" in data["expression"][0]
