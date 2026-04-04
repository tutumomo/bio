from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: str

class HistoryEntry(BaseModel):
    id: str
    query: str
    gene_count: Optional[int] = None
    variant_count: Optional[int] = None
    searched_at: datetime

class HistoryResponse(BaseModel):
    history: List[HistoryEntry]
    total: int
