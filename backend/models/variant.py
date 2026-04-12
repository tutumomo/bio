from datetime import datetime
from typing import Optional

from sqlalchemy import Float, ForeignKey, Index, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class VariantCache(Base):
    __tablename__ = "variant_cache"

    rsid: Mapped[str] = mapped_column(String, primary_key=True)
    gene_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("gene_cache.gene_id"))
    consequence: Mapped[Optional[str]] = mapped_column(String)
    impact: Mapped[Optional[str]] = mapped_column(String)
    cadd_score: Mapped[Optional[float]] = mapped_column(Float)
    gerp_score: Mapped[Optional[float]] = mapped_column(Float)
    regulome_rank: Mapped[Optional[str]] = mapped_column(String)
    protein_position: Mapped[Optional[str]] = mapped_column(String)
    amino_acid_change: Mapped[Optional[str]] = mapped_column(String)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    gene: Mapped[Optional["GeneCache"]] = relationship(back_populates="variants")

    __table_args__ = (
        Index("idx_variant_gene", "gene_id"),
        Index("idx_variant_cadd", "cadd_score"),
        Index("idx_variant_impact", "impact"),
        Index("idx_variant_consequence", "consequence"),
    )
