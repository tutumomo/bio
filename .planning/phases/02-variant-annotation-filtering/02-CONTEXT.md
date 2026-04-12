# Phase 2 Context: Variant Annotation & Filtering

## Phase Goal
Deliver functional variant annotation across the full stack, enabling users to discover and filter variants by functional impact scores (CADD, GERP++, RegulomeDB).

## Requirement Coverage
- **BACK-02**: Ensembl REST service for SNP discovery.
- **BACK-03**: Ensembl VEP batch annotation service (CADD, GERP++, impact).
- **BACK-04**: RegulomeDB service for regulatory functional scoring.
- **BACK-05**: Gene Pipeline Orchestrator to chain calls with caching.
- **API-02**: Variant annotation endpoint (`/api/genes/{id}/variants`).
- **API-04**: Single/Batch variant annotation endpoint (`/api/variants/{rsid}/annotation`).
- **UI-02 (Tab B)**: Genetic Variation & Annotations tab.
- **UI-03**: Collapsible Filter Panel for variant scoring.
- **UI-04**: Virtualized rendering for high-density tables.

## Success Criteria
1. **High-Density Display**: Selecting a gene row displays thousands of variants with CADD and GERP++ scores.
2. **Zero-Lag Filtering**: Filtering by CADD score instantly updates the virtualized table with zero lag.
3. **Visual Feedback**: Impact levels (HIGH, MODERATE, LOW, MODIFIER) are color-coded in the UI.

## Current State Analysis
Phase 2 is ~40% complete. Core clients (`EnsemblClient`, `VEPClient`, `RegulomeDBClient`) are functional but need to handle larger batches. `VariantTable` and `FilterPanel` exist but require tighter integration and performance tuning to achieve the "thousands of variants" and "zero lag" targets.

## the agent's Discretion
- **Filtering Implementation**: Choice between server-side SQL-based filtering vs. client-side in-memory filtering for the "zero lag" requirement.
- **Data Scaling**: Strategy for fetching/caching thousands of variants (e.g., batch size in VEP, concurrent requests for RegulomeDB).
- **UI Polish**: Exact color mapping for impact levels and styling of the score bars.

## Decisions
- **Caching**: All variant data from Ensembl/VEP/RegulomeDB MUST be cached in PostgreSQL for 7 days.
- **Virtualization**: TanStack Virtual MUST be used for the variant table to maintain performance.
- **Data Source**: Ensembl VEP is the primary source for CADD and GERP++ scores.

## Remaining Work
- **Refinement**: `backend/services/gene_pipeline.py` needs `get_variants_cached` to support database-level filtering.
- **API**: `backend/api/variants.py` needs to pass filters to the DB layer instead of filtering in-memory in Python.
- **Frontend**: `VariantTable.tsx` and `useVariants.ts` need to be optimized to handle large result sets without UI blocking.
- **UI**: `FilterPanel.tsx` needs to correctly handle numeric ranges for scores and trigger instant updates.
