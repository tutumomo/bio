import pytest

from backend.services.clinvar import ClinVarClient


@pytest.mark.asyncio
async def test_get_classification_for_known_pathogenic():
    client = ClinVarClient()
    result = await client.get_classification("rs80357906")
    assert result is not None
    assert "classification" in result
    assert result["classification"] in {
        "Pathogenic",
        "Likely pathogenic",
        "Pathogenic/Likely pathogenic",
        "Uncertain significance",
        "Likely benign",
        "Benign",
        "Conflicting interpretations of pathogenicity",
        "Conflicting classifications of pathogenicity",
        "not provided",
        "drug response",
        "other",
        "risk factor",
    }
    assert "review_status" in result
    assert "conditions" in result
    assert isinstance(result["conditions"], list)


@pytest.mark.asyncio
async def test_get_classification_returns_none_for_unknown_rsid():
    client = ClinVarClient()
    result = await client.get_classification("rs999999999999")
    assert result is None


@pytest.mark.asyncio
async def test_get_classification_handles_empty():
    client = ClinVarClient()
    result = await client.get_classification("")
    assert result is None


@pytest.mark.asyncio
async def test_review_status_star_count():
    from backend.services.clinvar import review_status_to_stars

    assert review_status_to_stars("practice guideline") == 4
    assert review_status_to_stars("reviewed by expert panel") == 3
    assert review_status_to_stars("criteria provided, multiple submitters, no conflicts") == 2
    assert review_status_to_stars("criteria provided, single submitter") == 1
    assert review_status_to_stars("criteria provided, conflicting classifications") == 1
    assert review_status_to_stars("no assertion criteria provided") == 0
    assert review_status_to_stars("no assertion provided") == 0
    assert review_status_to_stars("") == 0
