import asyncio
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.schemas.variant import VariantListResult, VariantResponse
from backend.services.gene_pipeline import GenePipeline
from backend.services.vep import VEPClient
from backend.services.regulomedb import RegulomeDBClient

router = APIRouter(prefix="/api", tags=["variants"])
pipeline = GenePipeline()


@router.get("/genes/{gene_symbol}/variants", response_model=VariantListResult)
async def get_gene_variants(
    gene_symbol: str,
    ensembl_id: str = Query(..., description="Ensembl gene ID"),
    cadd_min: Optional[float] = None,
    cadd_max: Optional[float] = None,
    gerp_min: Optional[float] = None,
    consequence: Optional[str] = Query(None, description="Comma-separated consequence types"),
    impact: Optional[str] = Query(None, description="Comma-separated impact levels"),
    regulome_max: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    filters = {
        "cadd_min": cadd_min,
        "cadd_max": cadd_max,
        "gerp_min": gerp_min,
        "consequence": consequence,
        "impact": impact,
        "regulome_max": regulome_max,
    }
    raw = await pipeline.get_variants_cached(gene_symbol, ensembl_id, filters, page, limit, db)

    filtered = raw
    if cadd_min is not None:
        filtered = [v for v in filtered if v.get("cadd_score") is not None and v["cadd_score"] >= cadd_min]
    if cadd_max is not None:
        filtered = [v for v in filtered if v.get("cadd_score") is not None and v["cadd_score"] <= cadd_max]
    if gerp_min is not None:
        filtered = [v for v in filtered if v.get("gerp_score") is not None and v["gerp_score"] >= gerp_min]
    if consequence:
        cons_list = [c.strip() for c in consequence.split(",")]
        filtered = [v for v in filtered if v.get("consequence") in cons_list]
    if impact:
        impact_list = [i.strip() for i in impact.split(",")]
        filtered = [v for v in filtered if v.get("impact") in impact_list]
    if regulome_max is not None:
        def rank_value(rank):
            if rank is None:
                return 99
            try:
                return int(rank[0])
            except (ValueError, IndexError):
                return 99
        filtered = [v for v in filtered if rank_value(v.get("regulome_rank")) <= regulome_max]

    total = len(filtered)
    start = (page - 1) * limit
    page_data = filtered[start: start + limit]

    variants = [
        VariantResponse(
            rsid=v["rsid"],
            gene_id="{}_{}".format(gene_symbol, ensembl_id) if ensembl_id else gene_symbol,
            gene_symbol=v.get("gene_symbol"),
            consequence=v.get("consequence"),
            impact=v.get("impact"),
            cadd_score=v.get("cadd_score"),
            gerp_score=v.get("gerp_score"),
            regulome_rank=v.get("regulome_rank"),
            protein_position=v.get("protein_position"),
            amino_acid_change=v.get("amino_acid_change"),
            dbsnp_url="https://www.ncbi.nlm.nih.gov/snp/{}".format(v["rsid"]),
            ensembl_vep_url="https://ensembl.org/Homo_sapiens/Variation/Explore?v={}".format(v["rsid"]),
        )
        for v in page_data
    ]
    return VariantListResult(variants=variants, total=total, page=page, limit=limit)


@router.get("/variants/{rsid}/annotation", response_model=VariantResponse)
async def get_variant_annotation(rsid: str):
    vep = VEPClient()
    regulomedb = RegulomeDBClient()

    vep_results, regulome_results = await asyncio.gather(
        vep.annotate_variants([rsid]),
        regulomedb.get_regulome_scores([rsid]),
    )

    vep_data = vep_results[0] if vep_results else {}
    return VariantResponse(
        rsid=rsid,
        consequence=vep_data.get("consequence"),
        impact=vep_data.get("impact"),
        cadd_score=vep_data.get("cadd_score"),
        gerp_score=vep_data.get("gerp_score"),
        regulome_rank=regulome_results.get(rsid),
        protein_position=vep_data.get("protein_position"),
        amino_acid_change=vep_data.get("amino_acid_change"),
        dbsnp_url="https://www.ncbi.nlm.nih.gov/snp/{}".format(rsid),
        ensembl_vep_url="https://ensembl.org/Homo_sapiens/Variation/Explore?v={}".format(rsid),
    )
