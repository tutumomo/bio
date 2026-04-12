# Requirements: Helix Bio — Variant Annotation System

## V1 Scope

### Category: SETUP (Foundation & Infrastructure)
- **SETUP-01**: Monorepo scaffolding with FastAPI (Backend) and React 19 + Vite (Frontend).
- **SETUP-02**: PostgreSQL database schema for `gene_cache`, `variant_cache`, `users`, and `search_history`.
- **SETUP-03**: SQLAlchemy 2.0 (Async) ORM models and Alembic migration system.
- **SETUP-04**: API Rate limiting strategy (per-IP 60 req/min, per-user 100 queries/day).

### Category: BACKEND (Core Services)
- **BACK-01**: NCBI E-utilities service for gene discovery and metadata retrieval.
- **BACK-02**: Ensembl REST service for SNP discovery (overlap API).
- **BACK-03**: Ensembl VEP (Variant Effect Predictor) batch annotation service (CADD, GERP++, impact).
- **BACK-04**: RegulomeDB service for regulatory functional scoring (GRCh38).
- **BACK-05**: Gene Pipeline Orchestrator to chain NCBI/Ensembl/VEP/RegulomeDB calls with 7-day caching.

### Category: API (Endpoints)
- **API-01**: Gene search endpoint (`/api/genes/search`) returning paper-quality "Table 2" format.
- **API-02**: Variant annotation endpoint (`/api/genes/{id}/variants`) with multi-column filtering.
- **API-03**: Autocomplete endpoint (`/api/genes/autocomplete`) with debounced prefix matching.
- **API-04**: Single/Batch variant annotation endpoint (`/api/variants/{rsid}/annotation`).

### Category: AUTH (Identity & History)
- **AUTH-01**: OAuth 2.0 integration with Google and GitHub providers.
- **AUTH-02**: JWT-based session management using httpOnly secure cookies.
- **AUTH-03**: User search history tracking with reload-from-cache functionality.

### Category: UI (Frontend Pages)
- **UI-01**: Search/Landing page with hero section and debounced autocomplete.
- **UI-02**: Dual-tab results page:
    - **Tab A**: Gene & Protein Overview (NCBI/Ensembl links).
    - **Tab B**: Genetic Variation & Annotations (dbSNP/VEP links).
- **UI-03**: Collapsible Filter Panel for variant scoring (CADD, GERP++, Impact, Consequence, RegulomeDB).
- **UI-04**: Virtualized rendering (TanStack Virtual) for high-density variant tables (1000+ rows).
- **UI-05**: Gene Detail page with single gene metadata and tissue expression charts (recharts).
- **UI-06**: User history page for logged-in users.
- **UI-07**: CSV/TSV export matching publication-standard column headers.

### Category: DEPLOY (Production)
- **DEPLOY-01**: Railway deployment for Backend (FastAPI) and PostgreSQL.
- **DEPLOY-02**: Vercel deployment for Frontend (React/Vite).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Complete |
| SETUP-02 | Phase 1 | Complete |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| BACK-01 | Phase 1 | Pending |
| BACK-02 | Phase 2 | Pending |
| BACK-03 | Phase 2 | Pending |
| BACK-04 | Phase 2 | Pending |
| BACK-05 | Phase 2 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 4 | Pending |
| API-04 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1/2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 4 | Pending |
| DEPLOY-01 | Phase 5 | Pending |
| DEPLOY-02 | Phase 5 | Pending |
