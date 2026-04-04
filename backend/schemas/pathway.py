from typing import Optional, List
from pydantic import BaseModel


class PathwayResult(BaseModel):
    pathway_id: str
    name: str
    species: str
    reactome_url: str


class PathwaySearchResult(BaseModel):
    pathways: List[PathwayResult]
    query: str
    total: int


class PathwayProtein(BaseModel):
    symbol: str
    display_name: Optional[str] = None
    uniprot_id: Optional[str] = None
    uniprot_url: Optional[str] = None


class PathwayProteinsResult(BaseModel):
    pathway_id: str
    proteins: List[PathwayProtein]
    total: int
