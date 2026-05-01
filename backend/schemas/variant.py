from pydantic import BaseModel
from typing import Optional, List


class VariantResponse(BaseModel):
    rsid: str
    gene_id: Optional[str] = None
    gene_symbol: Optional[str] = None
    consequence: Optional[str] = None
    impact: Optional[str] = None
    cadd_score: Optional[float] = None
    gerp_score: Optional[float] = None
    regulome_rank: Optional[str] = None
    protein_position: Optional[str] = None
    amino_acid_change: Optional[str] = None
    hgvsc: Optional[str] = None
    hgvsp: Optional[str] = None
    clinvar_significance: Optional[str] = None
    clinvar_review_stars: Optional[int] = None
    gnomad_af_popmax: Optional[float] = None
    acmg_tier: Optional[str] = None
    acmg_evidence_codes: Optional[List[str]] = None
    acmg_rationale: Optional[str] = None
    dbsnp_url: Optional[str] = None
    ensembl_vep_url: Optional[str] = None


class VariantFilterParams(BaseModel):
    cadd_min: Optional[float] = None
    cadd_max: Optional[float] = None
    gerp_min: Optional[float] = None
    consequence: Optional[List[str]] = None
    impact: Optional[List[str]] = None
    regulome_max: Optional[int] = None
    page: int = 1
    limit: int = 50


class VariantListResult(BaseModel):
    variants: List[VariantResponse]
    total: int
    page: int
    limit: int
