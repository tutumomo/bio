from typing import Optional, List
from pydantic import BaseModel


class StringPartner(BaseModel):
    symbol: str
    string_id: Optional[str] = None
    combined_score: float
    neighborhood_score: float
    fusion_score: float
    cooccurrence_score: float
    experimental_score: float
    database_score: float
    textmining_score: float
    string_url: Optional[str] = None


class StringPartnersResult(BaseModel):
    gene_symbol: str
    partners: List[StringPartner]
    total: int
    string_search_url: str
