from pydantic import BaseModel
from typing import Optional, List


class OmimDisease(BaseModel):
    mim_number: str
    title: str
    phenotype_type: Optional[str] = None
    chromosome: Optional[str] = None
    gene_symbols: List[str] = []
    description: str = ""
    inheritance: Optional[str] = None
    last_updated: Optional[str] = None
    orphanet_url: Optional[str] = None


class OmimDiseaseResult(BaseModel):
    gene_symbol: str
    diseases: List[OmimDisease]
    total: int
    omim_search_url: str
    orpha_search_url: str