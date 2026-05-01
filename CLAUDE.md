# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helix Bio** is a bioinformatics web platform for gene/variant annotation. It integrates NCBI E-utilities, Ensembl VEP, RegulomeDB, ClinVar, and gnomAD to produce paper-quality variant annotation tables with automated ACMG/AMP 5-tier classification (CADD, GERP++, HGVS nomenclature, population frequencies, clinical significance).

> **FOR RESEARCH USE ONLY** — not a medical device. All variant classifications must be reviewed by a certified clinical geneticist.

## Commands

### Backend

```bash
cd backend
pip install -r requirements.txt

# Run dev server (port 8001)
export DATABASE_URL="postgresql+asyncpg://$(whoami)@localhost:5432/helix_bio"
export JWT_SECRET="dev-secret-key"
export FRONTEND_URL="http://localhost:5555"
uvicorn backend.main:app --reload --port 8001 --host 0.0.0.0

# Run all tests (uses SQLite in-memory, no PostgreSQL required)
pytest

# Run a single test file
pytest backend/tests/test_ncbi.py -v

# Run a single test
pytest backend/tests/test_auth.py::test_login -v

# Run tests with coverage
pytest --cov=backend --cov-report=term-missing
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on port 5555 (proxies /api to localhost:8001)
npm run dev -- --port 5555 --host 0.0.0.0
npm run build      # Production build
npm run lint       # TypeScript type-check (tsc --noEmit)
```

The Vite proxy (`/api` → `http://localhost:8001`) is configured in `frontend/vite.config.ts`, so the frontend dev server handles API forwarding automatically.

### Database

```bash
# Start PostgreSQL via Docker
docker-compose up -d db

# Or via Homebrew
bash brew-setup.sh

# Alembic migrations
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

## Architecture

### Backend (`backend/`)

FastAPI app with async SQLAlchemy (asyncpg). Entry point: `main.py`. Python 3.11.

**Routers** (`api/`): `genes`, `variants`, `auth`, `users`, `pathways` — each maps to one domain area. Routers use `backend.core.database.get_db` for async DB session injection.

**Services** (`services/`) — where the bioinformatics logic lives:
- `ncbi.py` — gene search via NCBI E-utilities (esearch/efetch)
- `ensembl.py` — gene/transcript lookups via Ensembl REST, GTEx tissue expression
- `vep.py` — variant effect prediction (CADD, GERP++, consequence, HGVS)
- `regulomedb.py` — functional regulatory scores
- `clinvar.py` — ClinVar clinical significance with star rating
- `gnomad.py` — gnomAD v4 population frequency (gnomAD_AF_popmax)
- `acmg_classifier.py` — automated ACMG/AMP 5-tier classifier (9 evidence codes: PVS1, PS3, PM2, PP3, BA1, BS1, BS2, BP4, BP7)
- `reactome.py` — pathway search via Reactome
- `string_db.py` — protein interaction partners via STRING DB
- `gene_pipeline.py` — orchestrates the full annotation pipeline across all services above

**Models** (`models/`): SQLAlchemy ORM — `gene.py`, `variant.py`, `user.py`. PostgreSQL-specific types (JSONB, UUID) are used; tests use SQLite compatibility via `conftest.py` fixtures.

**Schemas** (`schemas/`): Pydantic models for request/response serialization. `variant.py` defines the full variant output schema including HGVS, ClinVar, gnomAD, and ACMG fields.

**Config**: `core/config.py` uses `pydantic-settings` — reads env vars or `.env` file. Rate limiting via `slowapi`. HTTP retry with exponential backoff via `core/resilience.py` (`@retry_http` decorator, retries on connect errors, timeouts, and 429/503/504 statuses).

### Frontend (`frontend/src/`)

React 19 + Vite + Tailwind v4. No Redux — server state managed via TanStack Query.

**Import alias**: `@/` maps to `frontend/src/` (configured in `vite.config.ts`).

**Pages**: `SearchPage` → `ResultsPage` → `GeneDetailPage`. `HistoryPage` shows past searches.

**Key hooks**:
- `useGeneSearch` — TanStack Query wrapper for the gene search API
- `useVariants` — fetches and filters variant annotation data
- `useAuth` — JWT auth state
- `useAutocomplete` — gene symbol autocomplete

**Components**: `VariantTable` and `GeneTable` use TanStack Table + Virtual for large datasets. `FilterPanel` controls CADD/GERP++/consequence filters applied client-side. `AcmgEvidencePopover` shows per-variant evidence codes. `ClinicalDisclaimer` renders the research-use banner.

**lib**: `api.ts` (centralized fetch client), `export.ts` (CSV/TSV export with disclaimer), `source-links.ts` (external link builders).

### Auth Flow

OAuth (Google/GitHub) → backend issues JWT → frontend stores token → `useAuth` reads it. Backend JWT secret is `JWT_SECRET` env var.

### Caching

PostgreSQL `gene_cache` and `variant_cache` tables store API responses with a 7-day TTL. External API calls are skipped when a fresh cache entry exists. Always use `GenePipeline` for data fetching to ensure cache is utilized.

## Key Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | asyncpg PostgreSQL URL |
| `JWT_SECRET` | Backend | JWT signing |
| `FRONTEND_URL` | Backend | CORS origin + OAuth callback base |
| `NCBI_API_KEY` | Backend | Optional — raises NCBI rate limit |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | Backend | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | Backend | GitHub OAuth client secret |
| `VITE_API_URL` | Frontend | Backend API base URL (production only; dev uses Vite proxy) |

## Coding Conventions

- **Python**: 4-space indent, type hints, async/await for all DB and external API calls. New service integrations go in `backend/services/`, new tests in `backend/tests/test_<feature>.py`. Use `@retry_http` from `backend.core.resilience` for HTTP clients.
- **TypeScript/React**: 2-space indent, strict typing. Use `@/` import alias. PascalCase for components/pages, camelCase for hooks/utilities.
- **Tests**: `pytest` + `pytest-asyncio` with SQLite fixtures defined in `conftest.py`. Prefer service-level tests over full E2E. Frontend has no test runner; run `npm run lint` and verify flows manually.
- **Commits**: Conventional Commit style — `feat:`, `fix:`, `docs:`, `chore:`. Keep scoped and imperative.

## Deployment

- **Frontend → Vercel**: root directory `frontend/`, set `VITE_API_URL`
- **Backend → Railway**: root directory `backend/`, add PostgreSQL plugin, set all backend env vars
- Procfile and Dockerfile are present for Railway

## Current Branch Context

Branch `codex/v2-clinical-grade` adds clinical-grade features beyond v1.x:
- ACMG/AMP automated 5-tier classifier with 9 evidence codes
- ClinVar clinical significance with star ratings
- gnomAD v4 population frequency (gnomAD_AF_popmax)
- HGVS coding (hgvsc) and protein (hgvsp) nomenclature
- Research-use disclaimer in UI and exports