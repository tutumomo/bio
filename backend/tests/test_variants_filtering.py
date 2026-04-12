import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.gene import GeneCache
from backend.models.variant import VariantCache
from backend.services.gene_pipeline import GenePipeline

@pytest.mark.asyncio
async def test_get_variants_cached_filtering(db_session: AsyncSession):
    # Setup cache
    gene = GeneCache(
        gene_id="TP53_123",
        symbol="TP53",
        fetched_at=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db_session.add(gene)
    
    variants = [
        VariantCache(rsid="rs1", gene_id="TP53_123", cadd_score=10.0, impact="LOW", regulome_rank="1a", consequence="synonymous_variant"),
        VariantCache(rsid="rs2", gene_id="TP53_123", cadd_score=20.0, impact="HIGH", regulome_rank="2b", consequence="missense_variant"),
        VariantCache(rsid="rs3", gene_id="TP53_123", cadd_score=30.0, impact="MODERATE", regulome_rank="3c", consequence="stop_gained"),
    ]
    for v in variants:
        db_session.add(v)
    await db_session.commit()
    
    pipeline = GenePipeline()
    
    # Test no filters
    res = await pipeline.get_variants_cached("TP53", "123", {}, 1, 10, db_session)
    assert res["total"] == 3
    assert len(res["variants"]) == 3
    
    # Test CADD filter
    res = await pipeline.get_variants_cached("TP53", "123", {"cadd_min": 15.0}, 1, 10, db_session)
    assert res["total"] == 2
    assert all(v["cadd_score"] >= 15.0 for v in res["variants"])
    
    # Test Impact filter
    res = await pipeline.get_variants_cached("TP53", "123", {"impact": "HIGH,MODERATE"}, 1, 10, db_session)
    assert res["total"] == 2
    assert all(v["impact"] in ["HIGH", "MODERATE"] for v in res["variants"])
    
    # Test Regulome filter
    res = await pipeline.get_variants_cached("TP53", "123", {"regulome_max": 2}, 1, 10, db_session)
    assert res["total"] == 2
    assert all(v["rsid"] in ["rs1", "rs2"] for v in res["variants"])

    # Test Pagination
    res = await pipeline.get_variants_cached("TP53", "123", {}, 1, 2, db_session)
    assert res["total"] == 3
    assert len(res["variants"]) == 2
    
    res = await pipeline.get_variants_cached("TP53", "123", {}, 2, 2, db_session)
    assert res["total"] == 3
    assert len(res["variants"]) == 1
