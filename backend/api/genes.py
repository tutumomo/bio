from typing import Optional, List
from fastapi import APIRouter, Query
from backend.schemas.gene import GeneResponse, GeneSearchResult
from backend.services.gene_pipeline import GenePipeline

router = APIRouter(prefix="/api/genes", tags=["genes"])
pipeline = GenePipeline()


@router.get("/search", response_model=GeneSearchResult)
async def search_genes(q: str = Query(..., min_length=1, description="Gene symbol or protein name")):
    results = await pipeline.search_genes(q)
    genes = [
        GeneResponse(
            gene_id="{}_{}".format(g['symbol'], g['ncbi_id']),
            symbol=g["symbol"],
            full_name=g.get("name"),
            chromosome=g.get("chromosome"),
            length=g.get("length"),
            ncbi_id=g.get("ncbi_id"),
            ensembl_id=g.get("ensembl_id"),
            ncbi_url="https://www.ncbi.nlm.nih.gov/gene/{}".format(g['ncbi_id']) if g.get("ncbi_id") else None,
            ensembl_url="https://ensembl.org/Homo_sapiens/Gene/Summary?g={}".format(g['ensembl_id']) if g.get("ensembl_id") else None,
        )
        for g in results
    ]
    return GeneSearchResult(genes=genes, query=q, total=len(genes))


@router.get("/autocomplete")
async def autocomplete(q: str = Query(..., min_length=1)):
    results = await pipeline.search_genes(q)
    return [{"symbol": g["symbol"], "name": g.get("name", "")} for g in results[:10]]
