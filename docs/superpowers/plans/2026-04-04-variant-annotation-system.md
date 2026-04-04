# Variant Annotation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack bioinformatics platform that searches genes/proteins via NCBI/Ensembl APIs and produces paper-quality SNP annotation tables, deployed publicly on Vercel + Railway.

**Architecture:** Monorepo with `frontend/` (React 19 + Vite + TanStack Table) and `backend/` (FastAPI + SQLAlchemy + asyncpg). Three-layer API chaining: NCBI gene discovery → Ensembl SNP discovery → VEP + RegulomeDB functional annotation. PostgreSQL caches all results with 7-day TTL.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, asyncpg, httpx, Alembic | React 19, Vite, Tailwind v4, TanStack Table/Query/Virtual, React Router v6, recharts, motion/react

**Environment:** macOS Darwin, Node v25.9.0 (at `/opt/homebrew/bin/node`), Python 3.9.6 (system), brew available, Docker NOT installed. PostgreSQL will run via `brew services` for local dev instead of Docker.

---

## File Map

### Backend (`backend/`)

| File | Responsibility |
|------|----------------|
| `backend/main.py` | FastAPI app factory, CORS, lifespan, router mounting |
| `backend/core/config.py` | Pydantic Settings: DATABASE_URL, JWT_SECRET, API keys, FRONTEND_URL |
| `backend/core/database.py` | Async SQLAlchemy engine + session factory |
| `backend/core/rate_limiter.py` | slowapi setup, per-IP and per-user limiters |
| `backend/models/gene.py` | SQLAlchemy model: `GeneCache` |
| `backend/models/variant.py` | SQLAlchemy model: `VariantCache` |
| `backend/models/user.py` | SQLAlchemy model: `User`, `SearchHistory` |
| `backend/models/__init__.py` | Re-export all models (needed for Alembic autogenerate) |
| `backend/schemas/gene.py` | Pydantic response schemas: `GeneResponse`, `GeneSearchResult` |
| `backend/schemas/variant.py` | Pydantic schemas: `VariantResponse`, `VariantFilterParams` |
| `backend/schemas/user.py` | Pydantic schemas: `UserResponse`, `HistoryResponse` |
| `backend/services/ncbi.py` | NCBI E-utilities client: `search_genes()`, `get_gene_summaries()` |
| `backend/services/ensembl.py` | Ensembl REST: `get_ensembl_id()`, `get_variants_for_gene()` |
| `backend/services/vep.py` | Ensembl VEP: `annotate_variants_batch()` |
| `backend/services/regulomedb.py` | RegulomeDB: `get_regulome_scores()` |
| `backend/services/gene_pipeline.py` | Orchestrator: chains Layer 1→2→3, manages cache reads/writes |
| `backend/api/genes.py` | Router: `/api/genes/search`, `/api/genes/{id}/variants`, `/api/genes/autocomplete` |
| `backend/api/variants.py` | Router: `/api/variants/{rsid}/annotation`, `/api/variants/batch` |
| `backend/api/auth.py` | Router: `/api/auth/login/{provider}`, `/api/auth/callback/{provider}` |
| `backend/api/users.py` | Router: `/api/user/me`, `/api/user/history` |
| `backend/auth/jwt.py` | JWT creation/verification helpers |
| `backend/auth/oauth.py` | OAuth client setup (Google + GitHub) |
| `backend/auth/dependencies.py` | FastAPI dependency: `get_current_user()` |
| `backend/requirements.txt` | Python dependencies |
| `backend/alembic.ini` | Alembic config |
| `backend/alembic/env.py` | Alembic migration environment |
| `backend/tests/conftest.py` | pytest fixtures: async client, test DB |
| `backend/tests/test_ncbi.py` | NCBI service unit tests |
| `backend/tests/test_ensembl.py` | Ensembl service unit tests |
| `backend/tests/test_vep.py` | VEP service unit tests |
| `backend/tests/test_regulomedb.py` | RegulomeDB service unit tests |
| `backend/tests/test_gene_pipeline.py` | Pipeline integration tests |
| `backend/tests/test_api_genes.py` | Gene endpoint tests |
| `backend/tests/test_api_variants.py` | Variant endpoint tests |
| `backend/tests/test_auth.py` | Auth flow tests |

### Frontend (`frontend/`)

| File | Responsibility |
|------|----------------|
| `frontend/index.html` | HTML entry point |
| `frontend/vite.config.ts` | Vite config: React plugin, Tailwind, proxy for dev |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/package.json` | Dependencies and scripts |
| `frontend/src/main.tsx` | React root with QueryClientProvider + RouterProvider |
| `frontend/src/index.css` | Tailwind imports + font imports + theme config |
| `frontend/src/types.ts` | Shared TypeScript interfaces: Gene, Variant, User, FilterParams |
| `frontend/src/lib/api.ts` | API client: fetch wrapper with auth cookie handling |
| `frontend/src/lib/source-links.ts` | URL template helpers: `ncbiGeneUrl()`, `dbsnpUrl()`, etc. |
| `frontend/src/lib/export.ts` | CSV/TSV export utility |
| `frontend/src/hooks/useGeneSearch.ts` | TanStack Query hook for gene search |
| `frontend/src/hooks/useVariants.ts` | TanStack Query hook for variant data with filter params |
| `frontend/src/hooks/useAuth.ts` | Auth state hook: login/logout/currentUser |
| `frontend/src/hooks/useAutocomplete.ts` | Debounced autocomplete hook |
| `frontend/src/components/Layout.tsx` | Sidebar + TopNav + main content area |
| `frontend/src/components/SearchBar.tsx` | Search input with autocomplete dropdown |
| `frontend/src/components/GeneTable.tsx` | TanStack Table for Tab A (gene overview) |
| `frontend/src/components/VariantTable.tsx` | TanStack Table for Tab B (SNP annotations) with virtual scroll |
| `frontend/src/components/FilterPanel.tsx` | Collapsible filter sidebar: sliders, checkboxes, dropdowns |
| `frontend/src/components/SourceLinkButtons.tsx` | Reusable external link button group |
| `frontend/src/components/ImpactBadge.tsx` | Color-coded impact badge (HIGH=red, MODERATE=orange, etc.) |
| `frontend/src/components/CaddScoreBar.tsx` | CADD score number + mini bar indicator |
| `frontend/src/components/SkeletonTable.tsx` | Table skeleton loading state |
| `frontend/src/components/ErrorBoundary.tsx` | Graceful error display per section |
| `frontend/src/pages/SearchPage.tsx` | Landing page with hero + search |
| `frontend/src/pages/ResultsPage.tsx` | Dual-tab results: Tab A (GeneTable) + Tab B (VariantTable + FilterPanel) |
| `frontend/src/pages/GeneDetailPage.tsx` | Single gene deep-dive with chart + variant sub-table |
| `frontend/src/pages/HistoryPage.tsx` | User search history list |

### Root

| File | Responsibility |
|------|----------------|
| `docker-compose.yml` | PostgreSQL for local dev (when Docker available) |
| `brew-setup.sh` | Alternative local PostgreSQL setup via brew (for this machine) |
| `.gitignore` | Updated for monorepo (backend venv, frontend node_modules, .env) |
| `README.md` | Project overview, setup instructions |

---

## Task 1: Project Scaffolding & Monorepo Setup

**Files:**
- Create: `backend/main.py`, `backend/requirements.txt`, `backend/core/__init__.py`, `backend/core/config.py`
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/App.tsx`
- Modify: `.gitignore`
- Create: `docker-compose.yml`, `brew-setup.sh`

- [ ] **Step 1: Restructure into monorepo**

Move existing frontend code into `frontend/` subdirectory. Remove AI Studio artifacts.

```bash
mkdir -p frontend backend
# Move existing frontend files
mv src frontend/
mv index.html frontend/
mv vite.config.ts frontend/
mv tsconfig.json frontend/
mv package.json frontend/
mv package-lock.json frontend/
# Remove AI Studio artifacts
rm -f metadata.json .env.example helix-os-_-editorial-bioinformatics.zip
```

- [ ] **Step 2: Create backend requirements.txt**

```txt
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.30.0
alembic==1.14.1
httpx==0.28.1
slowapi==0.1.9
python-jose[cryptography]==3.4.0
authlib==1.4.1
pydantic==2.10.4
pydantic-settings==2.7.1
python-multipart==0.0.20
pytest==8.3.4
pytest-asyncio==0.25.0
httpx==0.28.1
```

- [ ] **Step 3: Create backend config**

Create `backend/core/__init__.py` (empty).

Create `backend/core/config.py`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/helix_bio"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_expiry_days: int = 7
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    ncbi_api_key: str = ""
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 4: Create minimal FastAPI app**

Create `backend/__init__.py` (empty).

Create `backend/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing yet, DB engine created on import
    yield
    # Shutdown: dispose engine


app = FastAPI(title="Helix Bio API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Update frontend package.json**

Replace `frontend/package.json` — remove `@google/genai`, `express`, `d3`, `dotenv`; add `react-router-dom`, `@tanstack/react-query`, `@tanstack/react-table`, `@tanstack/react-virtual`:

```json
{
  "name": "helix-bio-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-table": "^8.20.6",
    "@tanstack/react-virtual": "^3.11.2",
    "@vitejs/plugin-react": "^5.0.4",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.28.0",
    "recharts": "^3.8.1",
    "tailwind-merge": "^3.5.0",
    "vite": "^6.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2"
  }
}
```

- [ ] **Step 6: Update frontend vite.config.ts**

Remove Gemini API key injection, add API proxy for dev:

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 7: Update frontend tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 8: Create .gitignore for monorepo**

```gitignore
# Python
backend/__pycache__/
backend/**/__pycache__/
backend/.venv/
*.pyc
.env

# Node
frontend/node_modules/
frontend/dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store

# DB
*.db
```

- [ ] **Step 9: Create docker-compose.yml and brew-setup.sh**

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: helix_bio
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

`brew-setup.sh` (for machines without Docker):

```bash
#!/bin/bash
set -e
echo "Installing PostgreSQL via Homebrew..."
brew install postgresql@16
brew services start postgresql@16
createdb helix_bio 2>/dev/null || echo "Database already exists"
echo "PostgreSQL running. Connection: postgresql://$(whoami)@localhost:5432/helix_bio"
```

- [ ] **Step 10: Verify scaffolding**

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -c "from backend.core.config import settings; print(settings.database_url)"
# Frontend
cd ../frontend && npm install
npm run lint
```

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: restructure into monorepo with backend/frontend scaffolding"
```

---

## Task 2: Database Models & Migrations

**Files:**
- Create: `backend/core/database.py`
- Create: `backend/models/__init__.py`, `backend/models/gene.py`, `backend/models/variant.py`, `backend/models/user.py`
- Create: `backend/alembic.ini`, `backend/alembic/env.py`

- [ ] **Step 1: Write test for database models**

Create `backend/tests/__init__.py` (empty).

Create `backend/tests/conftest.py`:

```python
import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.core.database import Base
from backend.main import app

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

Create `backend/tests/test_models.py`:

```python
import pytest
from sqlalchemy import select

from backend.models.gene import GeneCache
from backend.models.variant import VariantCache


@pytest.mark.asyncio
async def test_gene_cache_create(db_session):
    gene = GeneCache(
        gene_id="BRCA1_672",
        symbol="BRCA1",
        full_name="BRCA1 DNA Repair Associated",
        chromosome="17q21.31",
        length=81189,
        ncbi_id="672",
        ensembl_id="ENSG00000012048",
    )
    db_session.add(gene)
    await db_session.commit()

    result = await db_session.execute(select(GeneCache).where(GeneCache.symbol == "BRCA1"))
    fetched = result.scalar_one()
    assert fetched.gene_id == "BRCA1_672"
    assert fetched.chromosome == "17q21.31"


@pytest.mark.asyncio
async def test_variant_cache_create(db_session):
    gene = GeneCache(gene_id="BRCA1_672", symbol="BRCA1", ncbi_id="672")
    db_session.add(gene)
    await db_session.commit()

    variant = VariantCache(
        rsid="rs80357906",
        gene_id="BRCA1_672",
        consequence="missense_variant",
        impact="MODERATE",
        cadd_score=25.3,
        gerp_score=4.5,
        regulome_rank="2b",
    )
    db_session.add(variant)
    await db_session.commit()

    result = await db_session.execute(select(VariantCache).where(VariantCache.rsid == "rs80357906"))
    fetched = result.scalar_one()
    assert fetched.cadd_score == 25.3
    assert fetched.gene_id == "BRCA1_672"
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && source .venv/bin/activate
pip install aiosqlite  # for test DB
pytest tests/test_models.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'backend.core.database'`

- [ ] **Step 3: Create database module**

`backend/core/database.py`:

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.core.config import settings

engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session
```

- [ ] **Step 4: Create ORM models**

`backend/models/__init__.py`:

```python
from backend.models.gene import GeneCache
from backend.models.variant import VariantCache
from backend.models.user import User, SearchHistory

__all__ = ["GeneCache", "VariantCache", "User", "SearchHistory"]
```

`backend/models/gene.py`:

```python
from datetime import datetime

from sqlalchemy import Index, String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class GeneCache(Base):
    __tablename__ = "gene_cache"

    gene_id: Mapped[str] = mapped_column(String, primary_key=True)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String)
    chromosome: Mapped[str | None] = mapped_column(String)
    length: Mapped[int | None] = mapped_column(Integer)
    ncbi_id: Mapped[str | None] = mapped_column(String)
    ensembl_id: Mapped[str | None] = mapped_column(String)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    variants: Mapped[list["VariantCache"]] = relationship(back_populates="gene")

    __table_args__ = (Index("idx_gene_symbol", "symbol"),)
```

`backend/models/variant.py`:

```python
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Index, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class VariantCache(Base):
    __tablename__ = "variant_cache"

    rsid: Mapped[str] = mapped_column(String, primary_key=True)
    gene_id: Mapped[str | None] = mapped_column(String, ForeignKey("gene_cache.gene_id"))
    consequence: Mapped[str | None] = mapped_column(String)
    impact: Mapped[str | None] = mapped_column(String)
    cadd_score: Mapped[float | None] = mapped_column(Float)
    gerp_score: Mapped[float | None] = mapped_column(Float)
    regulome_rank: Mapped[str | None] = mapped_column(String)
    protein_position: Mapped[str | None] = mapped_column(String)
    amino_acid_change: Mapped[str | None] = mapped_column(String)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    gene: Mapped["GeneCache | None"] = relationship(back_populates="variants")

    __table_args__ = (
        Index("idx_variant_gene", "gene_id"),
        Index("idx_variant_cadd", "cadd_score"),
    )
```

`backend/models/user.py`:

```python
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    provider_id: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String)
    avatar_url: Mapped[str | None] = mapped_column(String)
    daily_query_count: Mapped[int] = mapped_column(Integer, default=0)
    last_query_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    search_history: Mapped[list["SearchHistory"]] = relationship(back_populates="user")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    query: Mapped[str] = mapped_column(String, nullable=False)
    gene_count: Mapped[int | None] = mapped_column(Integer)
    variant_count: Mapped[int | None] = mapped_column(Integer)
    filters: Mapped[dict | None] = mapped_column(JSONB)
    searched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="search_history")
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_models.py -v
```

Expected: 2 passed

- [ ] **Step 6: Set up Alembic**

```bash
cd backend && alembic init alembic
```

Edit `backend/alembic.ini` — set `sqlalchemy.url`:

```ini
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5432/helix_bio
```

Replace `backend/alembic/env.py`:

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from backend.core.config import settings
from backend.core.database import Base
from backend.models import GeneCache, VariantCache, User, SearchHistory  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(url=settings.database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    connectable = create_async_engine(settings.database_url)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

- [ ] **Step 7: Generate initial migration**

```bash
alembic revision --autogenerate -m "create initial tables"
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add database models and Alembic migrations"
```

---

## Task 3: NCBI E-utilities Service

**Files:**
- Create: `backend/services/__init__.py`, `backend/services/ncbi.py`
- Create: `backend/tests/test_ncbi.py`

- [ ] **Step 1: Write failing test for NCBI service**

`backend/services/__init__.py` (empty).

`backend/tests/test_ncbi.py`:

```python
import pytest

from backend.services.ncbi import NCBIClient


@pytest.mark.asyncio
async def test_search_genes_returns_ids():
    client = NCBIClient()
    ids = await client.search_genes("BRCA1")
    assert len(ids) > 0
    assert all(isinstance(i, str) for i in ids)


@pytest.mark.asyncio
async def test_get_gene_summary():
    client = NCBIClient()
    summaries = await client.get_gene_summaries(["672"])  # BRCA1 NCBI Gene ID
    assert len(summaries) == 1
    gene = summaries[0]
    assert gene["symbol"] == "BRCA1"
    assert "chromosome" in gene
    assert "name" in gene


@pytest.mark.asyncio
async def test_search_genes_empty_query():
    client = NCBIClient()
    ids = await client.search_genes("xyznonexistentgene12345")
    assert ids == []
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_ncbi.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'backend.services.ncbi'`

- [ ] **Step 3: Implement NCBI client**

`backend/services/ncbi.py`:

```python
import asyncio
import xml.etree.ElementTree as ET

import httpx

from backend.core.config import settings

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class NCBIClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(10 if settings.ncbi_api_key else 3)
        self._api_key_param = f"&api_key={settings.ncbi_api_key}" if settings.ncbi_api_key else ""

    async def _get(self, url: str) -> str:
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.text

    async def search_genes(self, query: str, max_results: int = 20) -> list[str]:
        url = (
            f"{NCBI_BASE}/esearch.fcgi?db=gene"
            f"&term={query}[gene]+AND+human[orgn]"
            f"&retmax={max_results}&retmode=json"
            f"{self._api_key_param}"
        )
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
        return data.get("esearchresult", {}).get("idlist", [])

    async def get_gene_summaries(self, gene_ids: list[str]) -> list[dict]:
        if not gene_ids:
            return []
        ids_str = ",".join(gene_ids)
        url = (
            f"{NCBI_BASE}/esummary.fcgi?db=gene"
            f"&id={ids_str}&retmode=json"
            f"{self._api_key_param}"
        )
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()

        results = []
        doc_sums = data.get("result", {})
        for gid in gene_ids:
            info = doc_sums.get(gid, {})
            if not info or "error" in info:
                continue
            genomic_info = info.get("genomicinfo", [{}])
            chrom_loc = info.get("maplocation", "")
            length = genomic_info[0].get("chraccver", "") if genomic_info else ""
            # Compute length from chrstart/chrstop if available
            gene_length = None
            if genomic_info and "chrstart" in genomic_info[0] and "chrstop" in genomic_info[0]:
                start = genomic_info[0]["chrstart"]
                stop = genomic_info[0]["chrstop"]
                gene_length = abs(stop - start) + 1

            results.append({
                "ncbi_id": gid,
                "symbol": info.get("name", ""),
                "name": info.get("description", ""),
                "chromosome": chrom_loc,
                "length": gene_length,
                "organism": info.get("organism", {}).get("commonname", ""),
            })
        return results
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_ncbi.py -v
```

Expected: 3 passed (these hit the real NCBI API — they are integration tests)

- [ ] **Step 5: Commit**

```bash
git add backend/services/ backend/tests/test_ncbi.py
git commit -m "feat: add NCBI E-utilities service with gene search"
```

---

## Task 4: Ensembl Services (Gene Lookup + SNP Discovery)

**Files:**
- Create: `backend/services/ensembl.py`
- Create: `backend/tests/test_ensembl.py`

- [ ] **Step 1: Write failing tests**

`backend/tests/test_ensembl.py`:

```python
import pytest

from backend.services.ensembl import EnsemblClient


@pytest.mark.asyncio
async def test_get_ensembl_id():
    client = EnsemblClient()
    ensembl_id = await client.get_ensembl_id("BRCA1")
    assert ensembl_id == "ENSG00000012048"


@pytest.mark.asyncio
async def test_get_ensembl_id_unknown():
    client = EnsemblClient()
    ensembl_id = await client.get_ensembl_id("XYZFAKEGENE999")
    assert ensembl_id is None


@pytest.mark.asyncio
async def test_get_variants_for_gene():
    client = EnsemblClient()
    # Use a small gene to keep the response manageable
    variants = await client.get_variants_for_gene("ENSG00000141510", limit=10)  # TP53
    assert len(variants) > 0
    assert all(v.startswith("rs") or v.startswith("COSM") or ":" in v for v in variants)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_ensembl.py -v
```

Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement Ensembl client**

`backend/services/ensembl.py`:

```python
import asyncio

import httpx

ENSEMBL_REST = "https://rest.ensembl.org"


class EnsemblClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(15)

    async def get_ensembl_id(self, gene_symbol: str) -> str | None:
        url = f"{ENSEMBL_REST}/xrefs/symbol/homo_sapiens/{gene_symbol}"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, headers={"Content-Type": "application/json"})
                if resp.status_code == 400:
                    return None
                resp.raise_for_status()
                data = resp.json()

        for entry in data:
            if entry.get("type") == "gene":
                return entry["id"]
        return data[0]["id"] if data else None

    async def get_variants_for_gene(self, ensembl_id: str, limit: int | None = None) -> list[str]:
        url = f"{ENSEMBL_REST}/overlap/id/{ensembl_id}?feature=variation"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.get(url, headers={"Content-Type": "application/json"})
                resp.raise_for_status()
                data = resp.json()

        rsids = [v["id"] for v in data if "id" in v]
        if limit:
            rsids = rsids[:limit]
        return rsids
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_ensembl.py -v
```

Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add backend/services/ensembl.py backend/tests/test_ensembl.py
git commit -m "feat: add Ensembl gene lookup and SNP discovery service"
```

---

## Task 5: Ensembl VEP Annotation Service

**Files:**
- Create: `backend/services/vep.py`
- Create: `backend/tests/test_vep.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_vep.py`:

```python
import pytest

from backend.services.vep import VEPClient


@pytest.mark.asyncio
async def test_annotate_single_variant():
    client = VEPClient()
    results = await client.annotate_variants(["rs80357906"])  # BRCA1 pathogenic variant
    assert len(results) == 1
    ann = results[0]
    assert ann["rsid"] == "rs80357906"
    assert "consequence" in ann
    assert "impact" in ann


@pytest.mark.asyncio
async def test_annotate_batch():
    client = VEPClient()
    rsids = ["rs80357906", "rs28897696"]
    results = await client.annotate_variants(rsids)
    assert len(results) == 2
    assert all("consequence" in r for r in results)


@pytest.mark.asyncio
async def test_annotate_includes_cadd():
    client = VEPClient()
    results = await client.annotate_variants(["rs80357906"])
    ann = results[0]
    # CADD may or may not be available for this variant; check the key exists
    assert "cadd_score" in ann


@pytest.mark.asyncio
async def test_annotate_empty_list():
    client = VEPClient()
    results = await client.annotate_variants([])
    assert results == []
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_vep.py -v
```

Expected: FAIL

- [ ] **Step 3: Implement VEP client**

`backend/services/vep.py`:

```python
import asyncio

import httpx

ENSEMBL_REST = "https://rest.ensembl.org"
VEP_BATCH_SIZE = 200


class VEPClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(15)

    async def annotate_variants(self, rsids: list[str]) -> list[dict]:
        if not rsids:
            return []

        all_results = []
        # Process in batches of 200
        for i in range(0, len(rsids), VEP_BATCH_SIZE):
            batch = rsids[i : i + VEP_BATCH_SIZE]
            batch_results = await self._annotate_batch(batch)
            all_results.extend(batch_results)
        return all_results

    async def _annotate_batch(self, rsids: list[str]) -> list[dict]:
        url = f"{ENSEMBL_REST}/vep/human/id"
        payload = {"ids": rsids}
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        params = {"CADD": 1, "Conservation": 1}

        async with self._semaphore:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, json=payload, headers=headers, params=params)
                resp.raise_for_status()
                data = resp.json()

        results = []
        for entry in data:
            rsid = entry.get("id", "")
            # Get the most severe consequence
            most_severe = entry.get("most_severe_consequence", "")
            # Parse transcript consequences for detailed info
            transcript_cons = entry.get("transcript_consequences", [])
            impact = ""
            cadd_score = None
            gerp_score = None
            protein_position = None
            amino_acid_change = None

            if transcript_cons:
                # Pick the canonical or first transcript
                canonical = next(
                    (tc for tc in transcript_cons if tc.get("canonical", 0) == 1),
                    transcript_cons[0],
                )
                impact = canonical.get("impact", "")
                protein_position = str(canonical.get("protein_start", "")) if canonical.get("protein_start") else None
                amino_acids = canonical.get("amino_acids", "")
                amino_acid_change = amino_acids if amino_acids else None

                # CADD scores
                cadd_phred = canonical.get("cadd_phred")
                if cadd_phred is not None:
                    cadd_score = float(cadd_phred)

                # Conservation (GERP++)
                conservation = canonical.get("conservation")
                if conservation is not None:
                    gerp_score = float(conservation)

            results.append({
                "rsid": rsid,
                "consequence": most_severe,
                "impact": impact,
                "cadd_score": cadd_score,
                "gerp_score": gerp_score,
                "protein_position": protein_position,
                "amino_acid_change": amino_acid_change,
            })
        return results
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_vep.py -v
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add backend/services/vep.py backend/tests/test_vep.py
git commit -m "feat: add Ensembl VEP batch annotation service"
```

---

## Task 6: RegulomeDB Service

**Files:**
- Create: `backend/services/regulomedb.py`
- Create: `backend/tests/test_regulomedb.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_regulomedb.py`:

```python
import pytest

from backend.services.regulomedb import RegulomeDBClient


@pytest.mark.asyncio
async def test_get_regulome_score():
    client = RegulomeDBClient()
    results = await client.get_regulome_scores(["rs7903146"])  # well-studied TCF7L2 SNP
    assert len(results) == 1
    assert "rs7903146" in results
    # Rank should be a string like "1a", "2b", etc. or None
    rank = results["rs7903146"]
    assert rank is None or isinstance(rank, str)


@pytest.mark.asyncio
async def test_get_regulome_scores_empty():
    client = RegulomeDBClient()
    results = await client.get_regulome_scores([])
    assert results == {}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_regulomedb.py -v
```

- [ ] **Step 3: Implement RegulomeDB client**

`backend/services/regulomedb.py`:

```python
import asyncio

import httpx

REGULOMEDB_API = "https://regulomedb.org/regulome/search"


class RegulomeDBClient:
    def __init__(self):
        self._semaphore = asyncio.Semaphore(5)

    async def get_regulome_scores(self, rsids: list[str]) -> dict[str, str | None]:
        if not rsids:
            return {}

        tasks = [self._fetch_single(rsid) for rsid in rsids]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        scores = {}
        for rsid, result in zip(rsids, results):
            if isinstance(result, Exception):
                scores[rsid] = None
            else:
                scores[rsid] = result
        return scores

    async def _fetch_single(self, rsid: str) -> str | None:
        url = f"{REGULOMEDB_API}?regions={rsid}&genome=GRCh38&format=json"
        async with self._semaphore:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return None
                data = resp.json()

        # RegulomeDB returns results keyed by variant
        variants = data.get("variants", [])
        if not variants:
            return None

        # Get the ranking from the first matching variant
        for variant in variants:
            ranking = variant.get("regulome_score", {})
            rank = ranking.get("ranking")
            if rank:
                return str(rank)
        return None
```

- [ ] **Step 4: Run tests**

```bash
pytest tests/test_regulomedb.py -v
```

Expected: 2 passed (Note: RegulomeDB API can be flaky; if it fails, the service returns None gracefully)

- [ ] **Step 5: Commit**

```bash
git add backend/services/regulomedb.py backend/tests/test_regulomedb.py
git commit -m "feat: add RegulomeDB regulatory score service"
```

---

## Task 7: Gene Pipeline Orchestrator

**Files:**
- Create: `backend/services/gene_pipeline.py`
- Create: `backend/schemas/gene.py`, `backend/schemas/variant.py`, `backend/schemas/__init__.py`
- Create: `backend/tests/test_gene_pipeline.py`

- [ ] **Step 1: Create Pydantic response schemas**

`backend/schemas/__init__.py` (empty).

`backend/schemas/gene.py`:

```python
from pydantic import BaseModel


class GeneResponse(BaseModel):
    gene_id: str
    symbol: str
    full_name: str | None = None
    chromosome: str | None = None
    length: int | None = None
    ncbi_id: str | None = None
    ensembl_id: str | None = None
    ncbi_url: str | None = None
    ensembl_url: str | None = None


class GeneSearchResult(BaseModel):
    genes: list[GeneResponse]
    query: str
    total: int
```

`backend/schemas/variant.py`:

```python
from pydantic import BaseModel


class VariantResponse(BaseModel):
    rsid: str
    gene_id: str | None = None
    gene_symbol: str | None = None
    consequence: str | None = None
    impact: str | None = None
    cadd_score: float | None = None
    gerp_score: float | None = None
    regulome_rank: str | None = None
    protein_position: str | None = None
    amino_acid_change: str | None = None
    dbsnp_url: str | None = None
    ensembl_vep_url: str | None = None


class VariantFilterParams(BaseModel):
    cadd_min: float | None = None
    cadd_max: float | None = None
    gerp_min: float | None = None
    consequence: list[str] | None = None
    impact: list[str] | None = None
    regulome_max: int | None = None
    page: int = 1
    limit: int = 50


class VariantListResult(BaseModel):
    variants: list[VariantResponse]
    total: int
    page: int
    limit: int
```

- [ ] **Step 2: Write failing test for pipeline**

`backend/tests/test_gene_pipeline.py`:

```python
import pytest

from backend.services.gene_pipeline import GenePipeline


@pytest.mark.asyncio
async def test_pipeline_search_gene():
    pipeline = GenePipeline()
    result = await pipeline.search_genes("TP53")
    assert len(result) > 0
    gene = result[0]
    assert gene["symbol"] == "TP53"
    assert gene["ncbi_id"] is not None
    assert gene["ensembl_id"] is not None


@pytest.mark.asyncio
async def test_pipeline_search_multi_gene():
    pipeline = GenePipeline()
    result = await pipeline.search_genes("BRCA1, TP53")
    assert len(result) >= 2
    symbols = [g["symbol"] for g in result]
    assert "BRCA1" in symbols
    assert "TP53" in symbols
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pytest tests/test_gene_pipeline.py -v
```

- [ ] **Step 4: Implement pipeline orchestrator**

`backend/services/gene_pipeline.py`:

```python
import asyncio

from backend.services.ensembl import EnsemblClient
from backend.services.ncbi import NCBIClient
from backend.services.regulomedb import RegulomeDBClient
from backend.services.vep import VEPClient


class GenePipeline:
    def __init__(self):
        self.ncbi = NCBIClient()
        self.ensembl = EnsemblClient()
        self.vep = VEPClient()
        self.regulomedb = RegulomeDBClient()

    async def search_genes(self, query: str) -> list[dict]:
        # Support comma-separated multi-gene queries
        terms = [t.strip() for t in query.split(",") if t.strip()]

        # Run searches in parallel for each term
        all_results = await asyncio.gather(
            *[self._search_single_gene(term) for term in terms]
        )

        # Flatten and deduplicate by ncbi_id
        seen = set()
        genes = []
        for result_list in all_results:
            for gene in result_list:
                key = gene.get("ncbi_id", gene.get("symbol"))
                if key not in seen:
                    seen.add(key)
                    genes.append(gene)
        return genes

    async def _search_single_gene(self, term: str) -> list[dict]:
        # Layer 1: NCBI search
        ncbi_ids = await self.ncbi.search_genes(term)
        if not ncbi_ids:
            return []
        summaries = await self.ncbi.get_gene_summaries(ncbi_ids)

        # Enrich with Ensembl IDs in parallel
        async def enrich(gene: dict) -> dict:
            ensembl_id = await self.ensembl.get_ensembl_id(gene["symbol"])
            gene["ensembl_id"] = ensembl_id
            return gene

        enriched = await asyncio.gather(*[enrich(g) for g in summaries])
        return list(enriched)

    async def get_variants_annotated(
        self, gene_symbol: str, ensembl_id: str, limit: int = 500
    ) -> list[dict]:
        # Layer 2: SNP discovery
        rsids = await self.ensembl.get_variants_for_gene(ensembl_id, limit=limit)
        if not rsids:
            return []

        # Filter to only rs-prefixed IDs (skip COSM, structural variants, etc.)
        rsids = [r for r in rsids if r.startswith("rs")]
        if not rsids:
            return []

        # Layer 3: VEP annotation + RegulomeDB in parallel
        vep_results, regulome_results = await asyncio.gather(
            self.vep.annotate_variants(rsids),
            self.regulomedb.get_regulome_scores(rsids),
        )

        # Merge VEP + RegulomeDB results
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
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_gene_pipeline.py -v
```

Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add backend/services/gene_pipeline.py backend/schemas/ backend/tests/test_gene_pipeline.py
git commit -m "feat: add gene pipeline orchestrator with multi-gene parallel search"
```

---

## Task 8: Backend API Endpoints (Genes + Variants)

**Files:**
- Create: `backend/api/__init__.py`, `backend/api/genes.py`, `backend/api/variants.py`
- Modify: `backend/main.py` (mount routers)
- Create: `backend/tests/test_api_genes.py`

- [ ] **Step 1: Write failing test for gene search endpoint**

`backend/tests/test_api_genes.py`:

```python
import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_gene_search(client):
    resp = await client.get("/api/genes/search?q=BRCA1")
    assert resp.status_code == 200
    data = resp.json()
    assert "genes" in data
    assert "total" in data
    assert len(data["genes"]) > 0
    gene = data["genes"][0]
    assert "symbol" in gene
    assert "ncbi_url" in gene
    assert "ensembl_url" in gene


@pytest.mark.asyncio
async def test_gene_search_empty(client):
    resp = await client.get("/api/genes/search?q=")
    assert resp.status_code == 422  # validation error
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_api_genes.py -v
```

- [ ] **Step 3: Implement gene API router**

`backend/api/__init__.py` (empty).

`backend/api/genes.py`:

```python
from fastapi import APIRouter, Query

from backend.schemas.gene import GeneResponse, GeneSearchResult
from backend.services.gene_pipeline import GenePipeline

router = APIRouter(prefix="/api/genes", tags=["genes"])
pipeline = GenePipeline()


@router.get("/search", response_model=GeneSearchResult)
async def search_genes(q: str = Query(..., min_length=1, description="Gene symbol or protein name")):
    results = await pipeline.search_genes(q)
    genes = [
        GeneResponse(
            gene_id=f"{g['symbol']}_{g['ncbi_id']}",
            symbol=g["symbol"],
            full_name=g.get("name"),
            chromosome=g.get("chromosome"),
            length=g.get("length"),
            ncbi_id=g.get("ncbi_id"),
            ensembl_id=g.get("ensembl_id"),
            ncbi_url=f"https://www.ncbi.nlm.nih.gov/gene/{g['ncbi_id']}" if g.get("ncbi_id") else None,
            ensembl_url=(
                f"https://ensembl.org/Homo_sapiens/Gene/Summary?g={g['ensembl_id']}"
                if g.get("ensembl_id")
                else None
            ),
        )
        for g in results
    ]
    return GeneSearchResult(genes=genes, query=q, total=len(genes))


@router.get("/autocomplete")
async def autocomplete(q: str = Query(..., min_length=1)):
    # For now, search NCBI with the prefix. Later: query gene_cache DB.
    results = await pipeline.search_genes(q)
    return [{"symbol": g["symbol"], "name": g.get("name", "")} for g in results[:10]]
```

- [ ] **Step 4: Implement variant API router**

`backend/api/variants.py`:

```python
from fastapi import APIRouter, Query

from backend.schemas.variant import VariantFilterParams, VariantListResult, VariantResponse
from backend.services.gene_pipeline import GenePipeline

router = APIRouter(prefix="/api", tags=["variants"])
pipeline = GenePipeline()


@router.get("/genes/{gene_symbol}/variants", response_model=VariantListResult)
async def get_gene_variants(
    gene_symbol: str,
    ensembl_id: str = Query(..., description="Ensembl gene ID"),
    cadd_min: float | None = None,
    cadd_max: float | None = None,
    gerp_min: float | None = None,
    consequence: str | None = Query(None, description="Comma-separated consequence types"),
    impact: str | None = Query(None, description="Comma-separated impact levels"),
    regulome_max: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    raw = await pipeline.get_variants_annotated(gene_symbol, ensembl_id, limit=500)

    # Apply filters
    filtered = raw
    if cadd_min is not None:
        filtered = [v for v in filtered if v.get("cadd_score") is not None and v["cadd_score"] >= cadd_min]
    if cadd_max is not None:
        filtered = [v for v in filtered if v.get("cadd_score") is not None and v["cadd_score"] <= cadd_max]
    if gerp_min is not None:
        filtered = [v for v in filtered if v.get("gerp_score") is not None and v["gerp_score"] >= gerp_min]
    if consequence:
        cons_list = [c.strip() for c in consequence.split(",")]
        filtered = [v for v in filtered if v.get("consequence") in cons_list]
    if impact:
        impact_list = [i.strip() for i in impact.split(",")]
        filtered = [v for v in filtered if v.get("impact") in impact_list]
    if regulome_max is not None:
        def rank_value(rank: str | None) -> int:
            if rank is None:
                return 99
            try:
                return int(rank[0])
            except (ValueError, IndexError):
                return 99
        filtered = [v for v in filtered if rank_value(v.get("regulome_rank")) <= regulome_max]

    total = len(filtered)
    start = (page - 1) * limit
    page_data = filtered[start : start + limit]

    variants = [
        VariantResponse(
            rsid=v["rsid"],
            gene_symbol=v.get("gene_symbol"),
            consequence=v.get("consequence"),
            impact=v.get("impact"),
            cadd_score=v.get("cadd_score"),
            gerp_score=v.get("gerp_score"),
            regulome_rank=v.get("regulome_rank"),
            protein_position=v.get("protein_position"),
            amino_acid_change=v.get("amino_acid_change"),
            dbsnp_url=f"https://www.ncbi.nlm.nih.gov/snp/{v['rsid']}",
            ensembl_vep_url=f"https://ensembl.org/Homo_sapiens/Variation/Explore?v={v['rsid']}",
        )
        for v in page_data
    ]
    return VariantListResult(variants=variants, total=total, page=page, limit=limit)


@router.get("/variants/{rsid}/annotation", response_model=VariantResponse)
async def get_variant_annotation(rsid: str):
    from backend.services.vep import VEPClient
    from backend.services.regulomedb import RegulomeDBClient

    vep = VEPClient()
    regulomedb = RegulomeDBClient()

    import asyncio

    vep_results, regulome_results = await asyncio.gather(
        vep.annotate_variants([rsid]),
        regulomedb.get_regulome_scores([rsid]),
    )

    vep_data = vep_results[0] if vep_results else {}
    return VariantResponse(
        rsid=rsid,
        consequence=vep_data.get("consequence"),
        impact=vep_data.get("impact"),
        cadd_score=vep_data.get("cadd_score"),
        gerp_score=vep_data.get("gerp_score"),
        regulome_rank=regulome_results.get(rsid),
        protein_position=vep_data.get("protein_position"),
        amino_acid_change=vep_data.get("amino_acid_change"),
        dbsnp_url=f"https://www.ncbi.nlm.nih.gov/snp/{rsid}",
        ensembl_vep_url=f"https://ensembl.org/Homo_sapiens/Variation/Explore?v={rsid}",
    )
```

- [ ] **Step 5: Mount routers in main.py**

Update `backend/main.py` to add after the health endpoint:

```python
from backend.api.genes import router as genes_router
from backend.api.variants import router as variants_router

app.include_router(genes_router)
app.include_router(variants_router)
```

- [ ] **Step 6: Run tests**

```bash
pytest tests/test_api_genes.py -v
```

Expected: 3 passed

- [ ] **Step 7: Commit**

```bash
git add backend/api/ backend/main.py
git commit -m "feat: add gene search and variant annotation API endpoints"
```

---

## Task 9: Auth System (OAuth + JWT)

**Files:**
- Create: `backend/auth/__init__.py`, `backend/auth/jwt.py`, `backend/auth/oauth.py`, `backend/auth/dependencies.py`
- Create: `backend/api/auth.py`, `backend/api/users.py`
- Create: `backend/schemas/user.py`
- Modify: `backend/main.py` (mount auth routers)
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing test for JWT helpers**

`backend/tests/test_auth.py`:

```python
import pytest

from backend.auth.jwt import create_access_token, verify_access_token


def test_jwt_roundtrip():
    token = create_access_token({"sub": "test-user-id", "email": "test@example.com"})
    payload = verify_access_token(token)
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"


def test_jwt_invalid_token():
    payload = verify_access_token("invalid.token.here")
    assert payload is None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_auth.py -v
```

- [ ] **Step 3: Implement JWT helpers**

`backend/auth/__init__.py` (empty).

`backend/auth/jwt.py`:

```python
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from backend.core.config import settings

ALGORITHM = "HS256"


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expiry_days)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=ALGORITHM)


def verify_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_auth.py -v
```

Expected: 2 passed

- [ ] **Step 5: Create auth dependency**

`backend/auth/dependencies.py`:

```python
from fastapi import Cookie, HTTPException

from backend.auth.jwt import verify_access_token


async def get_current_user(access_token: str | None = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_access_token(access_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
```

- [ ] **Step 6: Create user schemas**

`backend/schemas/user.py`:

```python
from datetime import datetime

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    email: str | None
    name: str | None
    avatar_url: str | None
    provider: str


class HistoryEntry(BaseModel):
    id: str
    query: str
    gene_count: int | None
    variant_count: int | None
    searched_at: datetime


class HistoryResponse(BaseModel):
    history: list[HistoryEntry]
    total: int
```

- [ ] **Step 7: Create OAuth routes**

`backend/api/auth.py`:

```python
from fastapi import APIRouter, Response
from fastapi.responses import RedirectResponse

from backend.auth.jwt import create_access_token
from backend.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/login/{provider}")
async def login(provider: str):
    if provider == "google":
        # Redirect to Google OAuth consent screen
        redirect_uri = f"{settings.frontend_url}/api/auth/callback/google"
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.google_client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope=openid email profile"
        )
        return RedirectResponse(url)
    elif provider == "github":
        redirect_uri = f"{settings.frontend_url}/api/auth/callback/github"
        url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.github_client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope=read:user user:email"
        )
        return RedirectResponse(url)
    return {"error": "Unsupported provider"}


@router.get("/callback/{provider}")
async def callback(provider: str, code: str, response: Response):
    import httpx

    if provider == "google":
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": f"{settings.frontend_url}/api/auth/callback/google",
                    "grant_type": "authorization_code",
                },
            )
            tokens = token_resp.json()
            # Get user info
            user_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            user_info = user_resp.json()

        jwt_token = create_access_token({
            "sub": user_info["id"],
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "avatar": user_info.get("picture"),
            "provider": "google",
        })

    elif provider == "github":
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            tokens = token_resp.json()
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {tokens['access_token']}"},
            )
            user_info = user_resp.json()

        jwt_token = create_access_token({
            "sub": str(user_info["id"]),
            "email": user_info.get("email"),
            "name": user_info.get("login"),
            "avatar": user_info.get("avatar_url"),
            "provider": "github",
        })
    else:
        return {"error": "Unsupported provider"}

    # Set httpOnly cookie and redirect to frontend
    response = RedirectResponse(url=settings.frontend_url)
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response
```

- [ ] **Step 8: Create user routes**

`backend/api/users.py`:

```python
from fastapi import APIRouter, Depends, Response

from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["sub"],
        "email": user.get("email"),
        "name": user.get("name"),
        "avatar_url": user.get("avatar"),
        "provider": user.get("provider"),
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "ok"}
```

- [ ] **Step 9: Mount auth routers in main.py**

Add to `backend/main.py`:

```python
from backend.api.auth import router as auth_router
from backend.api.users import router as users_router

app.include_router(auth_router)
app.include_router(users_router)
```

- [ ] **Step 10: Run all tests**

```bash
pytest tests/ -v
```

- [ ] **Step 11: Commit**

```bash
git add backend/auth/ backend/api/auth.py backend/api/users.py backend/schemas/user.py backend/main.py backend/tests/test_auth.py
git commit -m "feat: add OAuth authentication with Google/GitHub and JWT"
```

---

## Task 10: Frontend Core Setup (Router + Query + API Client)

**Files:**
- Create: `frontend/src/types.ts`, `frontend/src/lib/api.ts`, `frontend/src/lib/source-links.ts`
- Rewrite: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- Create: `frontend/src/hooks/useAuth.ts`

- [ ] **Step 1: Create shared TypeScript types**

`frontend/src/types.ts`:

```typescript
export interface Gene {
  gene_id: string;
  symbol: string;
  full_name: string | null;
  chromosome: string | null;
  length: number | null;
  ncbi_id: string | null;
  ensembl_id: string | null;
  ncbi_url: string | null;
  ensembl_url: string | null;
}

export interface GeneSearchResult {
  genes: Gene[];
  query: string;
  total: number;
}

export interface Variant {
  rsid: string;
  gene_id: string | null;
  gene_symbol: string | null;
  consequence: string | null;
  impact: string | null;
  cadd_score: number | null;
  gerp_score: number | null;
  regulome_rank: string | null;
  protein_position: string | null;
  amino_acid_change: string | null;
  dbsnp_url: string | null;
  ensembl_vep_url: string | null;
}

export interface VariantListResult {
  variants: Variant[];
  total: number;
  page: number;
  limit: number;
}

export interface VariantFilters {
  cadd_min?: number;
  cadd_max?: number;
  gerp_min?: number;
  consequence?: string[];
  impact?: string[];
  regulome_max?: number;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  gene_count: number | null;
  variant_count: number | null;
  searched_at: string;
}

export type ImpactLevel = "HIGH" | "MODERATE" | "LOW" | "MODIFIER";
```

- [ ] **Step 2: Create API client**

`frontend/src/lib/api.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

export const api = {
  searchGenes: (query: string) =>
    fetchAPI<import("@/types").GeneSearchResult>(`/api/genes/search?q=${encodeURIComponent(query)}`),

  autocomplete: (prefix: string) =>
    fetchAPI<{ symbol: string; name: string }[]>(`/api/genes/autocomplete?q=${encodeURIComponent(prefix)}`),

  getVariants: (geneSymbol: string, ensemblId: string, params: Record<string, string>) => {
    const search = new URLSearchParams({ ensembl_id: ensemblId, ...params });
    return fetchAPI<import("@/types").VariantListResult>(`/api/genes/${geneSymbol}/variants?${search}`);
  },

  getVariantAnnotation: (rsid: string) =>
    fetchAPI<import("@/types").Variant>(`/api/variants/${rsid}/annotation`),

  getMe: () => fetchAPI<import("@/types").User>("/api/user/me"),

  getHistory: () => fetchAPI<{ history: import("@/types").HistoryEntry[]; total: number }>("/api/user/history"),
};
```

- [ ] **Step 3: Create source link helpers**

`frontend/src/lib/source-links.ts`:

```typescript
export const sourceLinks = {
  ncbiGene: (ncbiId: string) => `https://www.ncbi.nlm.nih.gov/gene/${ncbiId}`,
  ensemblGene: (ensemblId: string) => `https://ensembl.org/Homo_sapiens/Gene/Summary?g=${ensemblId}`,
  dbsnp: (rsid: string) => `https://www.ncbi.nlm.nih.gov/snp/${rsid}`,
  ensemblVariation: (rsid: string) => `https://ensembl.org/Homo_sapiens/Variation/Explore?v=${rsid}`,
  uniprot: (symbol: string) => `https://www.uniprot.org/uniprotkb?query=${symbol}+AND+organism_id:9606`,
  clinvar: (symbol: string) => `https://www.ncbi.nlm.nih.gov/clinvar/?term=${symbol}[gene]`,
  regulomedb: (rsid: string) => `https://regulomedb.org/regulome-search/?regions=${rsid}`,
};
```

- [ ] **Step 4: Create auth hook**

`frontend/src/hooks/useAuth.ts`:

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["user"],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = (provider: "google" | "github") => {
    window.location.href = `/api/auth/login/${provider}`;
  };

  const logout = async () => {
    await fetch("/api/user/logout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(["user"], null);
  };

  return { user: user ?? null, isLoading, isAuthenticated: !!user, login, logout };
}
```

- [ ] **Step 5: Rewrite main.tsx with providers**

`frontend/src/main.tsx`:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 6: Rewrite App.tsx with routes**

`frontend/src/App.tsx`:

```tsx
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SearchPage } from "@/pages/SearchPage";
import { ResultsPage } from "@/pages/ResultsPage";
import { GeneDetailPage } from "@/pages/GeneDetailPage";
import { HistoryPage } from "@/pages/HistoryPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/gene/:geneSymbol" element={<GeneDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 7: Create stub pages and Layout**

Create minimal stubs so the app compiles. These will be fully implemented in subsequent tasks.

`frontend/src/components/Layout.tsx`:

```tsx
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-3 max-w-[1600px] mx-auto">
          <span className="text-xl font-bold tracking-tighter text-[#002045]">
            Helix Bio
          </span>
        </div>
      </header>
      <main className="pt-20 pb-12 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

`frontend/src/pages/SearchPage.tsx`:

```tsx
export function SearchPage() {
  return <div>Search Page — to be implemented</div>;
}
```

`frontend/src/pages/ResultsPage.tsx`:

```tsx
export function ResultsPage() {
  return <div>Results Page — to be implemented</div>;
}
```

`frontend/src/pages/GeneDetailPage.tsx`:

```tsx
export function GeneDetailPage() {
  return <div>Gene Detail Page — to be implemented</div>;
}
```

`frontend/src/pages/HistoryPage.tsx`:

```tsx
export function HistoryPage() {
  return <div>History Page — to be implemented</div>;
}
```

- [ ] **Step 8: Verify frontend compiles**

```bash
cd frontend && npm install && npm run lint
```

Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add frontend/
git commit -m "feat: add frontend core with routing, API client, and auth hook"
```

---

## Task 11: Search Page (Landing)

**Files:**
- Rewrite: `frontend/src/pages/SearchPage.tsx`
- Create: `frontend/src/components/SearchBar.tsx`
- Create: `frontend/src/hooks/useAutocomplete.ts`

- [ ] **Step 1: Create autocomplete hook**

`frontend/src/hooks/useAutocomplete.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export function useAutocomplete() {
  const [input, setInput] = useState("");
  const [debouncedInput, setDebouncedInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInput(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["autocomplete", debouncedInput],
    queryFn: () => api.autocomplete(debouncedInput),
    enabled: debouncedInput.length >= 2,
    staleTime: 5 * 60_000,
  });

  return { input, setInput, suggestions };
}
```

- [ ] **Step 2: Create SearchBar component**

`frontend/src/components/SearchBar.tsx`:

```tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAutocomplete } from "@/hooks/useAutocomplete";

export function SearchBar() {
  const navigate = useNavigate();
  const { input, setInput, suggestions } = useAutocomplete();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (query?: string) => {
    const q = (query || input).trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/results?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-600 rounded-2xl blur opacity-25" />
      <div className="relative bg-white flex items-center p-2 rounded-2xl shadow-xl">
        <Search className="text-slate-400 ml-4 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          className="w-full border-none focus:ring-0 bg-transparent py-4 px-4 text-slate-900 text-lg placeholder:text-slate-400"
          placeholder="Search genes or proteins (e.g., BRCA1, TP53, EGFR)..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        <button
          onClick={() => handleSearch()}
          className="bg-[#002045] text-white px-8 py-4 rounded-xl font-bold tracking-tight hover:opacity-90 transition-all active:scale-95"
        >
          Search
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          {suggestions.map((s: { symbol: string; name: string }) => (
            <button
              key={s.symbol}
              className="w-full px-6 py-3 text-left hover:bg-slate-50 flex items-center gap-3"
              onMouseDown={() => handleSearch(s.symbol)}
            >
              <span className="font-bold text-[#002045]">{s.symbol}</span>
              <span className="text-sm text-slate-500 truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement SearchPage**

`frontend/src/pages/SearchPage.tsx`:

```tsx
import { Dna, Network, Microscope, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { SearchBar } from "@/components/SearchBar";

export function SearchPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <section className="relative rounded-[2rem] overflow-hidden p-12 lg:p-20 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="absolute inset-0 z-0 bg-[#002045]" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tighter text-white mb-6 leading-tight">
            Navigate the <span className="text-blue-200">Human Interactome</span>
          </h1>
          <p className="text-blue-100/80 text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Search genes and proteins to generate paper-quality variant annotation tables with CADD, GERP++, and RegulomeDB scores.
          </p>

          <SearchBar />

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { label: "NCBI", icon: <Microscope className="w-3 h-3" /> },
              { label: "Ensembl VEP", icon: <Dna className="w-3 h-3" /> },
              { label: "RegulomeDB", icon: <Network className="w-3 h-3" /> },
            ].map((db) => (
              <span
                key={db.label}
                className="flex items-center gap-2 bg-white/10 text-white border border-white/10 px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
              >
                {db.icon}
                {db.label}
              </span>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
```

- [ ] **Step 4: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add search landing page with autocomplete"
```

---

## Task 12: Results Page (Tab A — Gene Table)

**Files:**
- Create: `frontend/src/components/GeneTable.tsx`, `frontend/src/components/SourceLinkButtons.tsx`, `frontend/src/components/SkeletonTable.tsx`
- Create: `frontend/src/hooks/useGeneSearch.ts`
- Create: `frontend/src/lib/export.ts`
- Rewrite: `frontend/src/pages/ResultsPage.tsx`

- [ ] **Step 1: Create useGeneSearch hook**

`frontend/src/hooks/useGeneSearch.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export function useGeneSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const result = useQuery({
    queryKey: ["genes", query],
    queryFn: () => api.searchGenes(query),
    enabled: query.length > 0,
  });

  return { query, ...result };
}
```

- [ ] **Step 2: Create SourceLinkButtons component**

`frontend/src/components/SourceLinkButtons.tsx`:

```tsx
import { ExternalLink } from "lucide-react";

interface SourceLink {
  label: string;
  url: string | null;
}

export function SourceLinkButtons({ links }: { links: SourceLink[] }) {
  return (
    <div className="flex gap-1.5">
      {links
        .filter((l) => l.url)
        .map((link) => (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
          >
            <ExternalLink className="w-3 h-3" />
            {link.label}
          </a>
        ))}
    </div>
  );
}
```

- [ ] **Step 3: Create SkeletonTable**

`frontend/src/components/SkeletonTable.tsx`:

```tsx
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-slate-100 h-10 rounded-t-xl mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create CSV export utility**

`frontend/src/lib/export.ts`:

```typescript
export function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTSV(headers: string[], rows: string[][], filename: string) {
  const tsvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
  const blob = new Blob([tsvContent], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 5: Create GeneTable component**

`frontend/src/components/GeneTable.tsx`:

```tsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { Gene } from "@/types";
import { SourceLinkButtons } from "./SourceLinkButtons";

const columnHelper = createColumnHelper<Gene>();

export function GeneTable({ genes }: { genes: Gene[] }) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("symbol", {
        header: "Gene Symbol",
        cell: (info) => (
          <span className="font-bold text-[#002045] cursor-pointer hover:text-blue-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("full_name", {
        header: "Product Protein",
        cell: (info) => <span className="text-sm text-slate-700">{info.getValue() ?? "N/A"}</span>,
      }),
      columnHelper.accessor("chromosome", {
        header: "Chromosome",
        cell: (info) => <span className="font-mono text-sm">{info.getValue() ?? "N/A"}</span>,
      }),
      columnHelper.accessor("length", {
        header: "Length (bp)",
        cell: (info) => {
          const val = info.getValue();
          return <span className="font-mono text-sm">{val ? val.toLocaleString() : "N/A"}</span>;
        },
      }),
      columnHelper.display({
        id: "source",
        header: "Source",
        cell: (info) => (
          <SourceLinkButtons
            links={[
              { label: "NCBI", url: info.row.original.ncbi_url },
              { label: "Ensembl", url: info.row.original.ensembl_url },
            ]}
          />
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: genes,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter table..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700"
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/gene/${row.original.symbol}?ensembl_id=${row.original.ensembl_id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement ResultsPage (Tab A only first)**

`frontend/src/pages/ResultsPage.tsx`:

```tsx
import { useState } from "react";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useGeneSearch } from "@/hooks/useGeneSearch";
import { GeneTable } from "@/components/GeneTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { exportCSV } from "@/lib/export";

export function ResultsPage() {
  const { query, data, isLoading, error } = useGeneSearch();
  const [activeTab, setActiveTab] = useState<"genes" | "variants">("genes");

  const handleExportGenes = () => {
    if (!data?.genes) return;
    const headers = ["Gene Symbol", "Product Protein", "Chromosome", "Length (bp)", "NCBI URL", "Ensembl URL"];
    const rows = data.genes.map((g) => [
      g.symbol,
      g.full_name ?? "",
      g.chromosome ?? "",
      g.length?.toString() ?? "",
      g.ncbi_url ?? "",
      g.ensembl_url ?? "",
    ]);
    exportCSV(headers, rows, `gene_overview_${query}.csv`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">
            Results for &ldquo;{query}&rdquo;
          </h1>
          {data && <p className="text-sm text-slate-500 mt-1">{data.total} genes found</p>}
        </div>
        <button
          onClick={handleExportGenes}
          className="flex items-center gap-2 px-4 py-2 bg-[#002045] text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("genes")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "genes"
              ? "text-blue-700 border-blue-700"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          Gene & Protein Overview
        </button>
        <button
          onClick={() => setActiveTab("variants")}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "variants"
              ? "text-blue-700 border-blue-700"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          Genetic Variation & Annotations
        </button>
      </div>

      {isLoading && <SkeletonTable rows={8} cols={5} />}
      {error && (
        <div className="p-8 text-center bg-red-50 rounded-xl text-red-700">
          Error loading data. Please try again.
        </div>
      )}
      {data && activeTab === "genes" && <GeneTable genes={data.genes} />}
      {data && activeTab === "variants" && (
        <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
          Variant annotations loading — implemented in next task
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 7: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: add results page with gene overview table (Tab A)"
```

---

## Task 13: Results Page (Tab B — Variant Table + Filter Panel)

**Files:**
- Create: `frontend/src/components/VariantTable.tsx`, `frontend/src/components/FilterPanel.tsx`
- Create: `frontend/src/components/ImpactBadge.tsx`, `frontend/src/components/CaddScoreBar.tsx`
- Create: `frontend/src/hooks/useVariants.ts`
- Modify: `frontend/src/pages/ResultsPage.tsx` (wire up Tab B)

- [ ] **Step 1: Create ImpactBadge**

`frontend/src/components/ImpactBadge.tsx`:

```tsx
import type { ImpactLevel } from "@/types";

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  HIGH: "bg-red-100 text-red-700",
  MODERATE: "bg-orange-100 text-orange-700",
  LOW: "bg-yellow-100 text-yellow-700",
  MODIFIER: "bg-slate-100 text-slate-500",
};

export function ImpactBadge({ impact }: { impact: string | null }) {
  if (!impact) return <span className="text-slate-400 text-xs">N/A</span>;
  const colors = IMPACT_COLORS[impact as ImpactLevel] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors}`}>
      {impact}
    </span>
  );
}
```

- [ ] **Step 2: Create CaddScoreBar**

`frontend/src/components/CaddScoreBar.tsx`:

```tsx
export function CaddScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">N/A</span>;
  const pct = Math.min((score / 50) * 100, 100);
  const color = score >= 25 ? "bg-red-500" : score >= 15 ? "bg-orange-400" : "bg-blue-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-sm font-bold ${score >= 25 ? "text-red-600" : "text-slate-900"}`}>
        {score.toFixed(1)}
      </span>
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create useVariants hook**

`frontend/src/hooks/useVariants.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { VariantFilters, Gene } from "@/types";

export function useVariants(genes: Gene[], filters: VariantFilters, page = 1, limit = 50) {
  // Fetch variants for all genes in parallel
  return useQuery({
    queryKey: ["variants", genes.map((g) => g.symbol), filters, page, limit],
    queryFn: async () => {
      const allVariants = await Promise.all(
        genes
          .filter((g) => g.ensembl_id)
          .map((g) => {
            const params: Record<string, string> = { page: String(page), limit: String(limit) };
            if (filters.cadd_min !== undefined) params.cadd_min = String(filters.cadd_min);
            if (filters.cadd_max !== undefined) params.cadd_max = String(filters.cadd_max);
            if (filters.gerp_min !== undefined) params.gerp_min = String(filters.gerp_min);
            if (filters.consequence?.length) params.consequence = filters.consequence.join(",");
            if (filters.impact?.length) params.impact = filters.impact.join(",");
            if (filters.regulome_max !== undefined) params.regulome_max = String(filters.regulome_max);
            return api.getVariants(g.symbol, g.ensembl_id!, params);
          }),
      );
      return {
        variants: allVariants.flatMap((r) => r.variants),
        total: allVariants.reduce((sum, r) => sum + r.total, 0),
      };
    },
    enabled: genes.length > 0 && genes.some((g) => g.ensembl_id),
  });
}
```

- [ ] **Step 4: Create FilterPanel**

`frontend/src/components/FilterPanel.tsx`:

```tsx
import { useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { VariantFilters } from "@/types";

const CONSEQUENCE_OPTIONS = [
  "missense_variant",
  "stop_gained",
  "frameshift_variant",
  "splice_acceptor_variant",
  "splice_donor_variant",
  "synonymous_variant",
  "intron_variant",
  "5_prime_UTR_variant",
  "3_prime_UTR_variant",
];

const IMPACT_OPTIONS = ["HIGH", "MODERATE", "LOW", "MODIFIER"];

interface FilterPanelProps {
  filters: VariantFilters;
  onChange: (filters: VariantFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<VariantFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-[#002045] uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5" /> Filters
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-slate-100 pt-4">
          {/* CADD Score Range */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              CADD Score
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.cadd_min ?? ""}
                onChange={(e) => update({ cadd_min: e.target.value ? Number(e.target.value) : undefined })}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              />
              <span className="text-slate-400">—</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.cadd_max ?? ""}
                onChange={(e) => update({ cadd_max: e.target.value ? Number(e.target.value) : undefined })}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* GERP++ Min */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              GERP++ Min
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 2.0"
              value={filters.gerp_min ?? ""}
              onChange={(e) => update({ gerp_min: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>

          {/* Consequence */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Consequence
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {CONSEQUENCE_OPTIONS.map((c) => (
                <label key={c} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.consequence?.includes(c) ?? false}
                    onChange={(e) => {
                      const current = filters.consequence ?? [];
                      update({
                        consequence: e.target.checked ? [...current, c] : current.filter((x) => x !== c),
                      });
                    }}
                    className="rounded border-slate-300"
                  />
                  {c.replace(/_/g, " ")}
                </label>
              ))}
            </div>
          </div>

          {/* Impact */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Impact
            </label>
            <div className="flex flex-wrap gap-2">
              {IMPACT_OPTIONS.map((imp) => {
                const selected = filters.impact?.includes(imp) ?? false;
                return (
                  <button
                    key={imp}
                    onClick={() => {
                      const current = filters.impact ?? [];
                      update({ impact: selected ? current.filter((x) => x !== imp) : [...current, imp] });
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      selected ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {imp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RegulomeDB Max */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
              RegulomeDB Rank (max)
            </label>
            <select
              value={filters.regulome_max ?? ""}
              onChange={(e) => update({ regulome_max: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  &le; {n}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange({})}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create VariantTable with virtual scrolling**

`frontend/src/components/VariantTable.tsx`:

```tsx
import { useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Variant } from "@/types";
import { ImpactBadge } from "./ImpactBadge";
import { CaddScoreBar } from "./CaddScoreBar";
import { SourceLinkButtons } from "./SourceLinkButtons";

const columnHelper = createColumnHelper<Variant>();

export function VariantTable({ variants }: { variants: Variant[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("gene_symbol", {
        header: "Gene",
        cell: (info) => <span className="font-bold text-[#002045] text-sm">{info.getValue() ?? "N/A"}</span>,
        size: 80,
      }),
      columnHelper.accessor("rsid", {
        header: "SNP",
        cell: (info) => <span className="font-mono text-sm text-blue-700">{info.getValue()}</span>,
        size: 120,
      }),
      columnHelper.accessor("consequence", {
        header: "Consequence",
        cell: (info) => (
          <span className="text-xs text-slate-700">{info.getValue()?.replace(/_/g, " ") ?? "N/A"}</span>
        ),
        size: 150,
      }),
      columnHelper.accessor("impact", {
        header: "Impact",
        cell: (info) => <ImpactBadge impact={info.getValue()} />,
        size: 100,
      }),
      columnHelper.accessor("cadd_score", {
        header: "CADD",
        cell: (info) => <CaddScoreBar score={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("gerp_score", {
        header: "GERP++",
        cell: (info) => {
          const v = info.getValue();
          return <span className="font-mono text-sm">{v !== null ? v.toFixed(2) : "N/A"}</span>;
        },
        size: 80,
      }),
      columnHelper.accessor("regulome_rank", {
        header: "RegulomeDB",
        cell: (info) => <span className="font-mono text-sm">{info.getValue() ?? "N/A"}</span>,
        size: 100,
      }),
      columnHelper.display({
        id: "source",
        header: "Source",
        cell: (info) => (
          <SourceLinkButtons
            links={[
              { label: "dbSNP", url: info.row.original.dbsnp_url },
              { label: "VEP", url: info.row.original.ensembl_vep_url },
            ]}
          />
        ),
        size: 150,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: variants,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 20,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div ref={tableContainerRef} className="overflow-auto max-h-[600px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700 bg-slate-50"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isHighCadd = (row.original.cadd_score ?? 0) >= 25;
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(node) => virtualizer.measureElement(node)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 ${
                    isHighCadd ? "bg-red-50/30" : ""
                  }`}
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                    display: "table-row",
                  }}
                  onClick={() =>
                    setExpandedRow(expandedRow === row.original.rsid ? null : row.original.rsid)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-100">
        Showing {variants.length} variants
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire up Tab B in ResultsPage**

Update the `ResultsPage.tsx` — replace the placeholder Tab B section with the actual components. Add these imports at the top and replace the `activeTab === "variants"` block:

```tsx
// Add imports
import { FilterPanel } from "@/components/FilterPanel";
import { VariantTable } from "@/components/VariantTable";
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters } from "@/types";

// Add state inside component
const [filters, setFilters] = useState<VariantFilters>({});
const { data: variantData, isLoading: variantsLoading } = useVariants(
  data?.genes ?? [],
  filters,
);

// Replace the Tab B section:
{data && activeTab === "variants" && (
  <div className="flex gap-6">
    <div className="w-64 flex-shrink-0">
      <FilterPanel filters={filters} onChange={setFilters} />
    </div>
    <div className="flex-1">
      {variantsLoading ? (
        <SkeletonTable rows={10} cols={8} />
      ) : variantData?.variants.length ? (
        <VariantTable variants={variantData.variants} />
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
          No variants found with current filters
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 7: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/
git commit -m "feat: add variant annotation table (Tab B) with filters and virtual scroll"
```

---

## Task 14: Gene Detail Page

**Files:**
- Rewrite: `frontend/src/pages/GeneDetailPage.tsx`

- [ ] **Step 1: Implement GeneDetailPage**

`frontend/src/pages/GeneDetailPage.tsx`:

```tsx
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { sourceLinks } from "@/lib/source-links";
import { VariantTable } from "@/components/VariantTable";
import { FilterPanel } from "@/components/FilterPanel";
import { SkeletonTable } from "@/components/SkeletonTable";
import { SourceLinkButtons } from "@/components/SourceLinkButtons";
import { useVariants } from "@/hooks/useVariants";
import type { VariantFilters, Gene } from "@/types";

export function GeneDetailPage() {
  const { geneSymbol } = useParams<{ geneSymbol: string }>();
  const [searchParams] = useSearchParams();
  const ensemblId = searchParams.get("ensembl_id") || "";
  const [filters, setFilters] = useState<VariantFilters>({});

  const { data: geneData } = useQuery({
    queryKey: ["gene-detail", geneSymbol],
    queryFn: () => api.searchGenes(geneSymbol!),
    enabled: !!geneSymbol,
  });

  const gene = geneData?.genes.find((g) => g.symbol === geneSymbol) ?? null;

  const geneForVariants: Gene[] = gene
    ? [{ ...gene, ensembl_id: ensemblId || gene.ensembl_id }]
    : [];
  const { data: variantData, isLoading: variantsLoading } = useVariants(geneForVariants, filters);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">
          {geneSymbol}
        </h1>
        {gene && (
          <p className="text-slate-500 mt-1">{gene.full_name} &mdash; Chromosome {gene.chromosome}</p>
        )}
      </header>

      {/* Gene Info Card */}
      {gene && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Symbol</p>
              <p className="text-lg font-bold text-[#002045]">{gene.symbol}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Chromosome</p>
              <p className="text-lg font-mono text-[#002045]">{gene.chromosome ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Length</p>
              <p className="text-lg font-mono text-[#002045]">
                {gene.length ? gene.length.toLocaleString() + " bp" : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Source</p>
              <SourceLinkButtons
                links={[
                  { label: "NCBI", url: gene.ncbi_url },
                  { label: "Ensembl", url: gene.ensembl_url },
                  { label: "UniProt", url: sourceLinks.uniprot(gene.symbol) },
                  { label: "ClinVar", url: sourceLinks.clinvar(gene.symbol) },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Variant Table */}
      <h2 className="text-xl font-bold text-[#002045]">SNP Annotations</h2>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>
        <div className="flex-1">
          {variantsLoading ? (
            <SkeletonTable rows={10} cols={8} />
          ) : variantData?.variants.length ? (
            <VariantTable variants={variantData.variants} />
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
              No variants found
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/GeneDetailPage.tsx
git commit -m "feat: add gene detail page with info card and filtered variant table"
```

---

## Task 15: History Page

**Files:**
- Rewrite: `frontend/src/pages/HistoryPage.tsx`

- [ ] **Step 1: Implement HistoryPage**

`frontend/src/pages/HistoryPage.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: api.getHistory,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Clock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-[#002045]">Sign in to view history</h2>
        <p className="text-slate-500 text-sm">Your search history will appear here after logging in.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#002045]">Search History</h1>

      {isLoading && <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}</div>}

      {data?.history.length === 0 && (
        <div className="p-12 text-center bg-slate-50 rounded-xl">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No search history yet. Start by searching for a gene.</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => navigate(`/results?q=${encodeURIComponent(entry.query)}`)}
            className="w-full flex items-center justify-between p-5 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all text-left"
          >
            <div>
              <p className="font-bold text-[#002045]">{entry.query}</p>
              <p className="text-xs text-slate-500 mt-1">
                {entry.gene_count ?? 0} genes &middot; {entry.variant_count ?? 0} variants
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(entry.searched_at).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/HistoryPage.tsx
git commit -m "feat: add search history page"
```

---

## Task 16: Layout Polish (Sidebar + TopNav + Auth UI)

**Files:**
- Rewrite: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Implement full Layout with sidebar, topnav, auth**

`frontend/src/components/Layout.tsx`:

```tsx
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Search, Dna, Clock, Network, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { path: "/", label: "Search", icon: Search },
  { path: "/history", label: "History", icon: Clock },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 pt-20 pb-8 px-4 z-40">
        <div className="mb-10 px-2">
          <h2 className="font-extrabold text-[#002045] text-xl tracking-tight">Helix Bio</h2>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Variant Annotation v1.0
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2">
            <Dna className="w-5 h-5 text-blue-700" />
            <div className="flex items-center gap-1.5">
              {["NCBI", "Ensembl", "RegDB"].map((db) => (
                <span key={db} className="w-2 h-2 rounded-full bg-emerald-400" title={`${db} connected`} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* TopNav */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="flex justify-between items-center px-6 py-3 ml-64">
          <span className="text-xl font-bold tracking-tighter text-[#002045]">
            Editorial Bioinformatics
          </span>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{user?.name ?? user?.email}</span>
                {user?.avatar_url && (
                  <img
                    src={user.avatar_url}
                    className="w-8 h-8 rounded-full border border-slate-200"
                    alt="avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  onClick={logout}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => login("google")}
                  className="px-4 py-2 text-xs font-bold bg-[#002045] text-white rounded-lg hover:opacity-90"
                >
                  Sign in with Google
                </button>
                <button
                  onClick={() => login("github")}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 text-[#002045] rounded-lg hover:bg-slate-50"
                >
                  GitHub
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-20 pb-12 px-6 lg:px-12 max-w-[1600px]">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify frontend compiles**

```bash
cd frontend && npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: add polished layout with sidebar, topnav, and auth UI"
```

---

## Task 17: Backend PostgreSQL Cache Integration

**Files:**
- Modify: `backend/services/gene_pipeline.py` (add DB cache reads/writes)
- Modify: `backend/api/genes.py` (inject DB session)
- Modify: `backend/main.py` (add DB engine lifecycle)

- [ ] **Step 1: Update gene_pipeline to use DB cache**

Add cache logic to `backend/services/gene_pipeline.py`. Before hitting external APIs, check `gene_cache` / `variant_cache`. After fetching, write results back. Use 7-day TTL.

```python
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.gene import GeneCache
from backend.models.variant import VariantCache

CACHE_TTL = timedelta(days=7)


def _is_stale(fetched_at: datetime) -> bool:
    return datetime.now(timezone.utc) - fetched_at.replace(tzinfo=timezone.utc) > CACHE_TTL
```

Add a `search_genes_cached(self, query: str, db: AsyncSession)` method that:
1. Checks `gene_cache` for each term by symbol
2. If found and not stale, returns cached data
3. If not found or stale, fetches from NCBI + Ensembl, writes to cache, returns

Add a `get_variants_cached(self, gene_id: str, ensembl_id: str, db: AsyncSession)` method that:
1. Checks `variant_cache` for gene_id
2. If found and not stale, returns cached
3. If not found or stale, fetches from VEP + RegulomeDB, writes to cache

The full implementation follows the same pattern as the existing uncached methods, wrapping them with cache checks. The key change is that API endpoints now pass the `db: AsyncSession` dependency through.

- [ ] **Step 2: Update main.py with DB lifecycle**

Add to the lifespan:

```python
from backend.core.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()
```

- [ ] **Step 3: Update gene endpoint to use DB session**

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db

@router.get("/search", response_model=GeneSearchResult)
async def search_genes(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    # Use pipeline.search_genes_cached(q, db) instead
```

- [ ] **Step 4: Run full test suite**

```bash
pytest tests/ -v
```

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: add PostgreSQL cache layer with 7-day TTL"
```

---

## Task 18: Rate Limiting & Security

**Files:**
- Create: `backend/core/rate_limiter.py`
- Modify: `backend/main.py` (add rate limiter middleware)

- [ ] **Step 1: Implement rate limiter**

`backend/core/rate_limiter.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

- [ ] **Step 2: Add to main.py**

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.core.rate_limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

- [ ] **Step 3: Add rate limit decorators to endpoints**

In `backend/api/genes.py`:

```python
from backend.core.rate_limiter import limiter

@router.get("/search")
@limiter.limit("60/minute")
async def search_genes(request: Request, ...):
```

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "feat: add rate limiting with slowapi"
```

---

## Task 19: Deployment Configuration

**Files:**
- Create: `backend/Dockerfile`, `backend/Procfile`
- Create: `frontend/vercel.json`
- Update: `README.md`

- [ ] **Step 1: Create backend Dockerfile**

`backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create Railway Procfile**

`backend/Procfile`:

```
web: uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

- [ ] **Step 3: Create Vercel config**

`frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-api.up.railway.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 4: Update README**

Write a `README.md` covering: project overview, local setup (brew PostgreSQL or Docker), running backend + frontend, environment variables, deployment steps for Vercel and Railway.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add deployment configs for Vercel and Railway"
```

---

## Task 20: End-to-End Smoke Test

- [ ] **Step 1: Start PostgreSQL locally**

```bash
bash brew-setup.sh
```

- [ ] **Step 2: Run Alembic migrations**

```bash
cd backend && source .venv/bin/activate
alembic upgrade head
```

- [ ] **Step 3: Start backend**

```bash
uvicorn backend.main:app --reload --port 8000
```

- [ ] **Step 4: Start frontend**

```bash
cd frontend && npm run dev
```

- [ ] **Step 5: Manual smoke test**

1. Open `http://localhost:3000`
2. Search for `BRCA1`
3. Verify Tab A shows gene info with NCBI and Ensembl source links
4. Switch to Tab B, verify variant annotations load
5. Apply CADD filter (min 15), verify table updates
6. Click a gene row to verify Gene Detail page loads
7. Click source link buttons — verify they open correct NCBI/Ensembl pages in new tab

- [ ] **Step 6: Run full backend test suite**

```bash
cd backend && pytest tests/ -v
```

- [ ] **Step 7: Build frontend for production**

```bash
cd frontend && npm run build
```

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: complete smoke test and production build verification"
```
