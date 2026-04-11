# Helix Bio — Variant Annotation System: Project Context & Knowledge Graph

This document provides foundational mandates, architectural mapping, and development guidelines for the Helix Bio project.

## Project Overview
Helix Bio is a bioinformatics platform designed to search for human genes/proteins and produce high-quality variant annotation tables. It integrates multiple biological data sources and implements a robust caching mechanism to optimize performance.

### Core Technologies
- **Backend:** FastAPI (Python 3.9+), SQLAlchemy 2.0 (Async), asyncpg, httpx, slowapi.
- **Frontend:** React 19, Vite, Tailwind CSS v4, TanStack Table/Query/Virtual, React Router v6.
- **Database:** PostgreSQL 16 (for user history and API result caching).
- **External APIs:** NCBI E-utilities, Ensembl VEP, RegulomeDB, Reactome, STRING-db.

### Architecture Mapping
- **`backend/api/`**: RESTful API endpoints for genes, variants, pathways, auth, and users.
- **`backend/services/`**: The core logic layer. `GenePipeline` is the primary orchestrator coordinating external clients and cache.
- **`backend/models/`**: SQLAlchemy data models. Includes `GeneCache` and `VariantCache` with a 7-day TTL.
- **`frontend/src/pages/`**: User interface views (Search, Results, Detail, History).
- **`frontend/src/lib/api.ts`**: Centralized API client using standard `fetch`.

## Building and Running

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 16

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env (see README.md for details)
uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev # Starts on http://localhost:3000
```

### Key Commands
- **Test Backend:** `pytest` (from the `backend/` directory).
- **Build Frontend:** `npm run build`.
- **Lint Frontend:** `npm run lint` (checks types).

## Troubleshooting & Startup (Critical Lessons)
- **Import Errors:** Always set `export PYTHONPATH=$(pwd)` when running the backend to resolve `backend.*` modules.
- **Port Conflicts:** Port 3000 is reserved/occupied; the frontend is configured to run on **3001**.
- **Vite Config:** Ensure `frontend/vite.config.ts` has `server.port: 3001` and `proxy.target: "http://127.0.0.1:8000"`.
- **CSS Errors:** `@import` statements in CSS must be at the very top of the file to prevent PostCSS parsing failures.
- **Connection Refused:** If `127.0.0.1` fails, check if the server bound correctly using `lsof -i :3001`.

## Development Conventions

### General Mandates
- **Asynchronous First:** All database and external API calls in the backend MUST use `async/await`.
- **Caching Logic:** Use the `GenePipeline` service for data fetching to ensure the 7-day TTL cache in PostgreSQL is utilized.
- **Styling:** Follow the existing Tailwind CSS v4 patterns in the frontend. Avoid hardcoded styles.
- **Type Safety:** Maintain strict TypeScript typing in the frontend and Pydantic schemas in the backend.

### Backend Patterns
- Use `backend.core.database.get_db` for dependency injection of database sessions.
- All external API clients should implement a semaphore (see `VEPClient` in `backend/services/vep.py`) to manage rate limiting.

### Frontend Patterns
- Use TanStack Query for data fetching and state management.
- Use `VariantTable.tsx` and `GeneTable.tsx` for data presentation, ensuring virtualized rendering for large datasets.

## Knowledge Graph Summary
- **LogicOrchestrator:** `GenePipeline` (Coordinates NCBI, Ensembl, VEP, RegulomeDB).
- **DataSource:** `NCBIClient`, `VEPClient`, `EnsemblClient`, `RegulomeDBClient`.
- **Storage:** `PostgreSQL` (Managed via SQLAlchemy `Base` and `GeneCache`/`VariantCache`).
- **Consumer:** `React Frontend` (Communicates via `VITE_API_URL`).
