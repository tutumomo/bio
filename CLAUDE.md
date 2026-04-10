# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Helix Bio** is a bioinformatics web platform for gene/variant annotation. It integrates NCBI E-utilities, Ensembl VEP, and RegulomeDB to produce paper-quality variant annotation tables (CADD, GERP++, RegulomeDB scores).

## Commands

### Backend

```bash
cd backend
pip install -r requirements.txt

# Run dev server
export DATABASE_URL="postgresql+asyncpg://helix:helix@localhost:5432/helix_bio"
export JWT_SECRET="dev-secret-key"
export FRONTEND_URL="http://localhost:3000"
uvicorn backend.main:app --reload --port 8000

# Run all tests (uses SQLite, no PostgreSQL required)
pytest

# Run a single test file
pytest backend/tests/test_ncbi.py -v

# Run a single test
pytest backend/tests/test_auth.py::test_login -v
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server on port 3000
npm run build    # Production build
npm run lint     # TypeScript type-check (tsc --noEmit)
```

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

FastAPI app with async SQLAlchemy (asyncpg). Entry point: `main.py`.

**Routers** (`api/`): `genes`, `variants`, `auth`, `users`, `pathways` — each maps to one domain area.

**Services** (`services/`) — where the bioinformatics logic lives:
- `ncbi.py` — gene search via NCBI E-utilities (esearch/efetch)
- `ensembl.py` — gene/transcript lookups via Ensembl REST
- `vep.py` — variant effect prediction (CADD, GERP++, consequence)
- `regulomedb.py` — functional regulatory scores
- `reactome.py` — pathway search via Reactome
- `string_db.py` — protein interaction partners via STRING DB
- `gene_pipeline.py` — orchestrates the full annotation pipeline across services

**Models** (`models/`): SQLAlchemy ORM — `gene.py`, `variant.py`, `user.py`. PostgreSQL-specific types (JSONB, UUID) are used; tests use SQLite compatibility shims (only `gene_cache` and `variant_cache` tables).

**Config**: `core/config.py` uses `pydantic-settings` — reads env vars or `.env` file. Rate limiting via `slowapi`.

### Frontend (`frontend/src/`)

React 19 + Vite + Tailwind v4. No Redux — state managed via TanStack Query for server state.

**Pages**: `SearchPage` → `ResultsPage` → `GeneDetailPage`. `HistoryPage` shows past searches.

**Key hooks**:
- `useGeneSearch` — TanStack Query wrapper for the gene search API
- `useVariants` — fetches and filters variant annotation data
- `useAuth` — JWT auth state
- `useAutocomplete` — gene symbol autocomplete

**Components**: `VariantTable` and `GeneTable` use TanStack Table + Virtual for large datasets. `FilterPanel` controls CADD/GERP++/consequence filters applied client-side.

### Auth Flow

OAuth (Google/GitHub) → backend issues JWT → frontend stores token → `useAuth` reads it. Backend JWT secret is `JWT_SECRET` env var.

### Caching

PostgreSQL `gene_cache` and `variant_cache` tables store API responses with a 7-day TTL. External API calls are skipped when a fresh cache entry exists.

## Key Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | asyncpg PostgreSQL URL |
| `JWT_SECRET` | Backend | JWT signing |
| `FRONTEND_URL` | Backend | CORS origin + OAuth callback base |
| `NCBI_API_KEY` | Backend | Optional — raises NCBI rate limit |
| `VITE_API_URL` | Frontend | Backend base URL |

## Deployment

- **Frontend → Vercel**: root directory `frontend/`, set `VITE_API_URL`
- **Backend → Railway**: root directory `backend/`, add PostgreSQL plugin, set all backend env vars
- Procfile and Dockerfile are present for Railway
