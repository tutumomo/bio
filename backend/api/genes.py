import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from starlette.requests import Request
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.core.rate_limiter import limiter
from backend.schemas.gene import GeneResponse, GeneSearchResult
from backend.schemas.string_partner import StringPartner, StringPartnersResult
from backend.services.gene_pipeline import GenePipeline
from backend.services.string_db import StringDBClient
from backend.auth.dependencies import get_optional_user
from backend.models.user import SearchHistory, User

router = APIRouter(prefix="/api/genes", tags=["genes"])
pipeline = GenePipeline()
string_db = StringDBClient()


@router.get("/search", response_model=GeneSearchResult)
@limiter.limit("60/minute")
async def search_genes(
    request: Request,
    q: str = Query(..., min_length=1, description="Gene symbol or protein name"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
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

    if current_user and genes:
        # Enforce per-user daily query limit
        today = date.today()
        if current_user.last_query_date != today:
            current_user.daily_query_count = 0
            current_user.last_query_date = today
        
        if current_user.daily_query_count >= 100:
            raise HTTPException(
                status_code=429, 
                detail="Daily query limit reached (100/day)"
            )
        
        current_user.daily_query_count += 1

        # Check for duplicate query within 5 minutes
        five_minutes_ago = datetime.now() - timedelta(minutes=5)
        stmt = (
            select(SearchHistory)
            .where(
                SearchHistory.user_id == current_user.id,
                SearchHistory.query == q,
                SearchHistory.searched_at >= five_minutes_ago
            )
            .order_by(desc(SearchHistory.searched_at))
            .limit(1)
        )
        
        result = await db.execute(stmt)
        last_history = result.scalar_one_or_none()
        
        if last_history:
            # Just update the timestamp
            last_history.searched_at = func.now()
        else:
            # Create new entry
            history_entry = SearchHistory(
                user_id=current_user.id,
                query=q,
                gene_count=len(genes),
            )
            db.add(history_entry)
            
        await db.commit()

    return GeneSearchResult(genes=genes, query=q, total=len(genes))


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    results = await pipeline.search_genes_cached(q, db)
    return [{"symbol": g["symbol"], "name": g.get("name") or g.get("full_name", "")} for g in results[:10]]


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
