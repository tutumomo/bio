from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.models.user import User
from backend.auth.dependencies import check_query_limit, record_search_history
from backend.schemas.pathway import (
    PathwaySearchResult,
    PathwayResult,
    PathwayProteinsResult,
    PathwayProtein,
)
from backend.services.reactome import ReactomeClient

router = APIRouter(prefix="/api/pathways", tags=["pathways"])
reactome = ReactomeClient()


@router.get("/search", response_model=PathwaySearchResult)
async def search_pathways(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(check_query_limit),
):
    """Search Reactome for human pathways matching the query."""
    results = await reactome.search_pathways(q)
    pathways = [PathwayResult(**p) for p in results]

    if user:
        await record_search_history(
            db=db,
            user=user,
            query=f"pathway_search:{q}",
            gene_count=len(pathways)
        )

    return PathwaySearchResult(pathways=pathways, query=q, total=len(pathways))


@router.get("/{pathway_id}/proteins", response_model=PathwayProteinsResult)
async def get_pathway_proteins(
    pathway_id: str,
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(check_query_limit),
):
    """Return all proteins that participate in a Reactome pathway."""
    proteins_raw = await reactome.get_pathway_proteins(pathway_id)
    proteins = [PathwayProtein(**p) for p in proteins_raw]

    if user:
        await record_search_history(
            db=db,
            user=user,
            query=f"pathway_proteins:{pathway_id}",
            gene_count=len(proteins)
        )

    return PathwayProteinsResult(
        pathway_id=pathway_id,
        proteins=proteins,
        total=len(proteins),
    )
