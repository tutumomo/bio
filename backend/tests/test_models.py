import pytest
from sqlalchemy import select

from backend.models.gene import GeneCache
from backend.models.variant import VariantCache


@pytest.mark.asyncio
async def test_gene_cache_create(db_session):
    gene = GeneCache(
        gene_id="BRCA1_672",
        symbol="BRCA1",
        full_name="BRCA1 DNA Repair Associated",
        chromosome="17q21.31",
        length=81189,
        ncbi_id="672",
        ensembl_id="ENSG00000012048",
    )
    db_session.add(gene)
    await db_session.commit()

    result = await db_session.execute(select(GeneCache).where(GeneCache.symbol == "BRCA1"))
    fetched = result.scalar_one()
    assert fetched.gene_id == "BRCA1_672"
    assert fetched.chromosome == "17q21.31"


@pytest.mark.asyncio
async def test_variant_cache_create(db_session):
    gene = GeneCache(gene_id="BRCA1_672", symbol="BRCA1", ncbi_id="672")
    db_session.add(gene)
    await db_session.commit()

    variant = VariantCache(
        rsid="rs80357906",
        gene_id="BRCA1_672",
        consequence="missense_variant",
        impact="MODERATE",
        cadd_score=25.3,
        gerp_score=4.5,
        regulome_rank="2b",
    )
    db_session.add(variant)
    await db_session.commit()

    result = await db_session.execute(select(VariantCache).where(VariantCache.rsid == "rs80357906"))
    fetched = result.scalar_one()
    assert fetched.cadd_score == 25.3
    assert fetched.gene_id == "BRCA1_672"
