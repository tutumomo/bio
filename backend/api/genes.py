import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from starlette.requests import Request
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.core.rate_limiter import limiter
from backend.schemas.gene import GeneResponse, GeneSearchResult, TissueExpressionResult, TissueExpressionEntry
from backend.schemas.string_partner import StringPartner, StringPartnersResult
from backend.services.gene_pipeline import GenePipeline
from backend.services.string_db import StringDBClient
from backend.auth.dependencies import get_optional_user, check_query_limit, record_search_history
from backend.models.user import User

router = APIRouter(prefix="/api/genes", tags=["genes"])
pipeline = GenePipeline()
string_db = StringDBClient()

@router.get("/search", response_model=GeneSearchResult)
@limiter.limit("60/minute")
async def search_genes(
    request: Request,
    q: str = Query(..., min_length=1, description="Gene symbol or protein name"),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(check_query_limit),
):
    results = await pipeline.search_genes_cached(q, db)
    genes = [
        GeneResponse(
            gene_id="{}_{}".format(g["symbol"], g.get("ncbi_id", "")),
            symbol=g["symbol"],
            full_name=g.get("name") or g.get("full_name"),
            chromosome=g.get("chromosome"),
            length=g.get("length"),
            ncbi_id=g.get("ncbi_id"),
            ensembl_id=g.get("ensembl_id"),
            ncbi_url=g.get("ncbi_url") or (
                "https://www.ncbi.nlm.nih.gov/gene/{}".format(g["ncbi_id"]) if g.get("ncbi_id") else None
            ),
            ensembl_url=g.get("ensembl_url") or (
                "https://ensembl.org/Homo_sapiens/Gene/Summary?g={}".format(g["ensembl_id"]) if g.get("ensembl_id") else None
            ),
        )
        for g in results
    ]

    if user:
        await record_search_history(
            db=db,
            user=user,
            query=q,
            gene_count=len(genes)
        )

    return GeneSearchResult(genes=genes, query=q, total=len(genes))


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    results = await pipeline.autocomplete_genes(q, db)
    return results


@router.get("/{gene_symbol}/string-partners", response_model=StringPartnersResult)
async def get_string_partners(
    gene_symbol: str,
    limit: int = Query(20, ge=1, le=50),
):
    """Fetch predicted functional partners from STRING DB for a given gene."""
    partners_raw = await string_db.get_interaction_partners(gene_symbol, limit=limit)
    partners = [StringPartner(**p) for p in partners_raw]
    return StringPartnersResult(
        gene_symbol=gene_symbol,
        partners=partners,
        total=len(partners),
        string_search_url="https://string-db.org/cgi/network?identifiers={}&species=9606".format(gene_symbol),
    )


@router.get("/{gene_symbol}/expression", response_model=TissueExpressionResult)
async def get_tissue_expression(
    gene_symbol: str,
    ensembl_id: Optional[str] = Query(None, description="Optional Ensembl ID for efficiency"),
):
    """Fetch tissue-specific median gene expression data (TPM) from GTEx/Ensembl."""
    if not ensembl_id:
        ensembl_id = await pipeline.ensembl.get_ensembl_id(gene_symbol)
        
    if not ensembl_id:
        raise HTTPException(status_code=404, detail=f"Ensembl ID not found for {gene_symbol}")

    expression_raw = await pipeline.get_tissue_expression(gene_symbol, ensembl_id)
        
    return TissueExpressionResult(
        gene_symbol=gene_symbol,
        ensembl_id=ensembl_id,
        expression=[TissueExpressionEntry(**e) for e in expression_raw],
    )
