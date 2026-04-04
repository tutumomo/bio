import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.ensembl import EnsemblClient
from backend.services.ncbi import NCBIClient
from backend.services.regulomedb import RegulomeDBClient
from backend.services.vep import VEPClient
from backend.models.gene import GeneCache
from backend.models.variant import VariantCache

CACHE_TTL = timedelta(days=7)


def _is_stale(fetched_at: datetime) -> bool:
    return datetime.now(timezone.utc) - fetched_at.replace(tzinfo=timezone.utc) > CACHE_TTL


class GenePipeline:
    def __init__(self):
        self.ncbi = NCBIClient()
        self.ensembl = EnsemblClient()
        self.vep = VEPClient()
        self.regulomedb = RegulomeDBClient()

    async def search_genes(self, query: str) -> List[Dict]:
        terms = [t.strip() for t in query.split(",") if t.strip()]
        all_results = await asyncio.gather(
            *[self._search_single_gene(term) for term in terms]
        )
        seen = set()
        genes = []
        for result_list in all_results:
            for gene in result_list:
                key = gene.get("ncbi_id", gene.get("symbol"))
                if key not in seen:
                    seen.add(key)
                    genes.append(gene)
        return genes

    async def _search_single_gene(self, term: str) -> List[Dict]:
        ncbi_ids = await self.ncbi.search_genes(term)
        if not ncbi_ids:
            return []
        summaries = await self.ncbi.get_gene_summaries(ncbi_ids)

        async def enrich(gene: Dict) -> Dict:
            ensembl_id = await self.ensembl.get_ensembl_id(gene["symbol"])
            gene["ensembl_id"] = ensembl_id
            return gene

        enriched = await asyncio.gather(*[enrich(g) for g in summaries])
        return list(enriched)

    async def search_genes_cached(self, query: str, db: AsyncSession) -> List[Dict]:
        terms = [t.strip() for t in query.split(",") if t.strip()]
        cached_results = []
        missing_terms = []

        for term in terms:
            stmt = select(GeneCache).where(
                GeneCache.symbol.ilike(term)
            )
            result = await db.execute(stmt)
            row = result.scalar_one_or_none()
            if row is not None and not _is_stale(row.fetched_at):
                cached_results.append({
                    "symbol": row.symbol,
                    "name": row.full_name,
                    "chromosome": row.chromosome,
                    "length": row.length,
                    "ncbi_id": row.ncbi_id,
                    "ensembl_id": row.ensembl_id,
                    "ncbi_url": "https://www.ncbi.nlm.nih.gov/gene/{}".format(row.ncbi_id) if row.ncbi_id else None,
                    "ensembl_url": "https://ensembl.org/Homo_sapiens/Gene/Summary?g={}".format(row.ensembl_id) if row.ensembl_id else None,
                })
            else:
                missing_terms.append(term)

        if missing_terms:
            fresh_query = ",".join(missing_terms)
            fresh_genes = await self.search_genes(fresh_query)
            for g in fresh_genes:
                gene_id = "{}_{}".format(g["symbol"], g.get("ncbi_id", ""))
                cache_obj = GeneCache(
                    gene_id=gene_id,
                    symbol=g["symbol"],
                    full_name=g.get("name"),
                    chromosome=g.get("chromosome"),
                    length=g.get("length"),
                    ncbi_id=g.get("ncbi_id"),
                    ensembl_id=g.get("ensembl_id"),
                    fetched_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
                await db.merge(cache_obj)
                cached_results.append({
                    "symbol": g["symbol"],
                    "name": g.get("name"),
                    "chromosome": g.get("chromosome"),
                    "length": g.get("length"),
                    "ncbi_id": g.get("ncbi_id"),
                    "ensembl_id": g.get("ensembl_id"),
                    "ncbi_url": "https://www.ncbi.nlm.nih.gov/gene/{}".format(g["ncbi_id"]) if g.get("ncbi_id") else None,
                    "ensembl_url": "https://ensembl.org/Homo_sapiens/Gene/Summary?g={}".format(g["ensembl_id"]) if g.get("ensembl_id") else None,
                })
            await db.commit()

        return cached_results

    async def get_variants_annotated(
        self, gene_symbol: str, ensembl_id: str, limit: int = 500
    ) -> List[Dict]:
        rsids = await self.ensembl.get_variants_for_gene(ensembl_id, limit=limit)
        if not rsids:
            return []
        rsids = [r for r in rsids if r.startswith("rs")]
        if not rsids:
            return []

        vep_results, regulome_results = await asyncio.gather(
            self.vep.annotate_variants(rsids),
            self.regulomedb.get_regulome_scores(rsids),
        )

        vep_by_rsid = {v["rsid"]: v for v in vep_results}
        merged = []
        for rsid in rsids:
            vep = vep_by_rsid.get(rsid, {})
            merged.append({
                "rsid": rsid,
                "gene_symbol": gene_symbol,
                "consequence": vep.get("consequence"),
                "impact": vep.get("impact"),
                "cadd_score": vep.get("cadd_score"),
                "gerp_score": vep.get("gerp_score"),
                "regulome_rank": regulome_results.get(rsid),
                "protein_position": vep.get("protein_position"),
                "amino_acid_change": vep.get("amino_acid_change"),
            })
        return merged

    async def get_variants_cached(
        self,
        gene_symbol: str,
        ensembl_id: str,
        filters: dict,
        page: int,
        limit: int,
        db: AsyncSession,
    ) -> List[Dict]:
        # Determine gene_id by looking up cache
        stmt = select(GeneCache).where(GeneCache.symbol.ilike(gene_symbol))
        result = await db.execute(stmt)
        gene_row = result.scalar_one_or_none()

        cached_variants: Optional[List[Dict]] = None

        if gene_row is not None and not _is_stale(gene_row.fetched_at):
            stmt2 = select(VariantCache).where(VariantCache.gene_id == gene_row.gene_id)
            result2 = await db.execute(stmt2)
            rows = result2.scalars().all()
            if rows:
                cached_variants = [
                    {
                        "rsid": r.rsid,
                        "gene_symbol": gene_symbol,
                        "consequence": r.consequence,
                        "impact": r.impact,
                        "cadd_score": r.cadd_score,
                        "gerp_score": r.gerp_score,
                        "regulome_rank": r.regulome_rank,
                        "protein_position": r.protein_position,
                        "amino_acid_change": r.amino_acid_change,
                    }
                    for r in rows
                ]

        if cached_variants is None:
            raw = await self.get_variants_annotated(gene_symbol, ensembl_id, limit=500)

            # Determine gene_id for caching
            if gene_row is not None:
                gene_id = gene_row.gene_id
            else:
                gene_id = "{}_unknown".format(gene_symbol)

            for v in raw:
                variant_obj = VariantCache(
                    rsid=v["rsid"],
                    gene_id=gene_id,
                    consequence=v.get("consequence"),
                    impact=v.get("impact"),
                    cadd_score=v.get("cadd_score"),
                    gerp_score=v.get("gerp_score"),
                    regulome_rank=v.get("regulome_rank"),
                    protein_position=v.get("protein_position"),
                    amino_acid_change=v.get("amino_acid_change"),
                    fetched_at=datetime.now(timezone.utc).replace(tzinfo=None),
                )
                await db.merge(variant_obj)
            await db.commit()
            cached_variants = raw

        return cached_variants
