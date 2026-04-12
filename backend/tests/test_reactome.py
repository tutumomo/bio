import pytest
from backend.services.reactome import ReactomeClient


@pytest.mark.asyncio
async def test_search_pathways():
    client = ReactomeClient()
    results = await client.search_pathways("apoptosis")
    assert len(results) > 0
    entry = results[0]
    assert "pathway_id" in entry
    assert "name" in entry
    assert entry["species"] == "Homo sapiens"
    assert entry["reactome_url"].startswith("https://reactome.org/")


@pytest.mark.asyncio
async def test_search_pathways_empty():
    client = ReactomeClient()
    results = await client.search_pathways("zzznonexistentpathway999")
    assert results == []


@pytest.mark.asyncio
async def test_get_pathway_proteins():
    client = ReactomeClient()
    # First search for a real pathway, then get its proteins
    pathways = await client.search_pathways("apoptosis")
    assert len(pathways) > 0
    proteins = await client.get_pathway_proteins(pathways[0]["pathway_id"])
    # Pathway may or may not have proteins depending on type
    assert isinstance(proteins, list)
    if proteins:
        p = proteins[0]
        assert "symbol" in p
        assert "display_name" in p
