# Helix Bio — Variant Annotation System

A bioinformatics web platform that searches human genes/proteins and produces paper-quality variant annotation tables by integrating NCBI E-utilities, Ensembl VEP, and RegulomeDB APIs.

## Features

- **Gene Discovery**: Search by gene symbol or protein name via NCBI E-utilities
- **SNP Annotation**: CADD, GERP++, and RegulomeDB functional scores via Ensembl VEP
- **Paper-Quality Tables**: Gene overview (Table 2) and variant annotations (Supplementary Table 1)
- **Source Links**: Direct links to NCBI Gene, Ensembl, dbSNP, UniProt, ClinVar, RegulomeDB
- **Filter Panel**: Filter variants by CADD, GERP++, consequence, impact, RegulomeDB rank
- **CSV/TSV Export**: Download tables in paper-ready format
- **OAuth Authentication**: Google and GitHub sign-in
- **PostgreSQL Cache**: 7-day TTL cache for API results

## Architecture

```
bio/
├── frontend/     # React 19 + Vite + Tailwind v4 + TanStack Table/Query
├── backend/      # FastAPI + SQLAlchemy + asyncpg
└── README.md
```

## Local Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 16 (via Homebrew or Docker)

### Setup PostgreSQL

```bash
# Option A: Homebrew
bash brew-setup.sh

# Option B: Docker
docker-compose up -d db
```

### Backend

```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://helix:helix@localhost:5432/helix_bio"
export JWT_SECRET="dev-secret-key"
export FRONTEND_URL="http://localhost:3000"
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Environment Variables

**Backend:**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) |
| `JWT_SECRET` | JWT signing key |
| `NCBI_API_KEY` | NCBI E-utilities API key (optional, raises rate limit) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `FRONTEND_URL` | Frontend URL for CORS and OAuth callbacks |

**Frontend:**
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## Deployment

**Frontend -> Vercel**
- Connect GitHub repo, set root directory to `frontend/`
- Add `VITE_API_URL` env var pointing to Railway backend

**Backend -> Railway**
- Connect GitHub repo, set root directory to `backend/`
- Add PostgreSQL plugin for database
- Set all backend environment variables

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind v4, TanStack Table/Query/Virtual, React Router v6 |
| Backend | FastAPI, SQLAlchemy 2.0, asyncpg, httpx |
| Database | PostgreSQL 16 |
| Auth | OAuth 2.0 (Google, GitHub) + JWT |
| External APIs | NCBI E-utilities, Ensembl VEP, RegulomeDB |
