from datetime import datetime
from typing import List, Optional

from sqlalchemy import Index, String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class GeneCache(Base):
    __tablename__ = "gene_cache"

    gene_id: Mapped[str] = mapped_column(String, primary_key=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    chromosome: Mapped[Optional[str]] = mapped_column(String)
    length: Mapped[Optional[int]] = mapped_column(Integer)
    ncbi_id: Mapped[Optional[str]] = mapped_column(String)
    ensembl_id: Mapped[Optional[str]] = mapped_column(String)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    variants: Mapped[List["VariantCache"]] = relationship(back_populates="gene")

    __table_args__ = (Index("idx_gene_symbol", "symbol"),)
