from fastapi import APIRouter, Query
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
async def search_pathways(q: str = Query(..., min_length=1)):
    """Search Reactome for human pathways matching the query."""
    results = await reactome.search_pathways(q)
    pathways = [PathwayResult(**p) for p in results]
    return PathwaySearchResult(pathways=pathways, query=q, total=len(pathways))


@router.get("/{pathway_id}/proteins", response_model=PathwayProteinsResult)
async def get_pathway_proteins(pathway_id: str):
    """Return all proteins that participate in a Reactome pathway."""
    proteins_raw = await reactome.get_pathway_proteins(pathway_id)
    proteins = [PathwayProtein(**p) for p in proteins_raw]
    return PathwayProteinsResult(
        pathway_id=pathway_id,
        proteins=proteins,
        total=len(proteins),
    )
