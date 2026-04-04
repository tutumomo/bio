from pydantic import BaseModel
from typing import Optional, List


class GeneResponse(BaseModel):
    gene_id: str
    symbol: str
    full_name: Optional[str] = None
    chromosome: Optional[str] = None
    length: Optional[int] = None
    ncbi_id: Optional[str] = None
    ensembl_id: Optional[str] = None
    ncbi_url: Optional[str] = None
    ensembl_url: Optional[str] = None


class GeneSearchResult(BaseModel):
    genes: List[GeneResponse]
    query: str
    total: int
