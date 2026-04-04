# Human Molecular Pathway & Variant Site Annotation System

## Overview

A public bioinformatics web platform that searches genes/proteins and produces paper-quality tables (Table 2: Gene Info, Supplementary Table 1: SNP Functional Annotations) by integrating NCBI E-utilities, Ensembl VEP, and RegulomeDB APIs.

Rebuilt from an existing Google AI Studio prototype (React + Vite + Tailwind) that contained only mock data and decorative UI. The new system replaces all mock data with real API integrations and streamlines the UI to focus on the core search-to-annotation workflow.

## Architecture

**Monorepo full-stack** deployed as two services:

```
bio/
├── frontend/          # React 19 + Vite + Tailwind v4 → Vercel
│   └── src/
│       ├── pages/     # Search, Results, GeneDetail, History
│       ├── components/# Tables, FilterPanel, SourceLinks, Skeleton
│       └── hooks/     # useGeneSearch, useSNPFilter, useAuth
├── backend/           # FastAPI + SQLAlchemy + asyncpg → Railway
│   ├── api/           # REST endpoints
│   ├── services/      # ncbi.py, ensembl_vep.py, regulomedb.py
│   ├── models/        # SQLAlchemy ORM models
│   ├── auth/          # OAuth (Google/GitHub) + JWT
│   └── core/          # config, rate_limiter, db session
├── docker-compose.yml # Local dev (PostgreSQL)
└── README.md
```

## Data Flow

Three-layer API chaining, each layer cached in PostgreSQL (TTL: 7 days):

### Layer 1: Gene Discovery (NCBI E-utilities)

- `esearch.fcgi?db=gene&term={query}[gene]+AND+human[orgn]` to get Gene IDs
- `esummary.fcgi?db=gene&id={ids}` to get gene metadata
- Output: Gene Symbol, Full Name (Product Protein), Chromosome, Genomic Length, NCBI Gene ID
- Ensembl REST `/xrefs/symbol/homo_sapiens/{symbol}` to get Ensembl ID for cross-linking

### Layer 2: SNP Discovery (Ensembl Overlap)

- `GET /overlap/id/{ensembl_id}?feature=variation` to get all known variants in the gene region
- Returns thousands of rsIDs; stored raw, filtered at query time

### Layer 3: Functional Annotation (Ensembl VEP + RegulomeDB)

- `POST /vep/human/id` with batch of up to 200 rsIDs per request
  - Request params: `?CADD=1&Conservation=1` to get CADD and GERP++ scores
  - Returns: consequence_terms, impact, CADD PHRED score, GERP++ score
- RegulomeDB API: `GET /regulome/search/?regions={rsid}` for regulatory rank
- All scores persisted to `variant_cache` table

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/genes/search?q={query}` | Search genes/proteins, returns Table 2 format |
| `GET` | `/api/genes/{gene_id}/variants?cadd_min=&cadd_max=&gerp_min=&consequence=&regulome_max=&impact=&page=&limit=` | SNP list with user-defined filters |
| `GET` | `/api/variants/{rsid}/annotation` | Single SNP full annotation |
| `POST` | `/api/variants/batch` | Batch query up to 200 SNPs |
| `GET` | `/api/auth/login/{provider}` | OAuth initiation (google/github) |
| `GET` | `/api/auth/callback/{provider}` | OAuth callback, issues JWT |
| `GET` | `/api/user/me` | Current user profile |
| `GET` | `/api/user/history` | Search history |
| `GET` | `/api/genes/autocomplete?q={prefix}` | Autocomplete suggestions from gene_cache (symbol prefix match) |

## Database Schema

```sql
-- Gene info cache
CREATE TABLE gene_cache (
    gene_id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    full_name TEXT,
    chromosome TEXT,
    length INTEGER,
    ncbi_id TEXT,
    ensembl_id TEXT,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gene_symbol ON gene_cache(symbol);

-- SNP annotation cache
CREATE TABLE variant_cache (
    rsid TEXT PRIMARY KEY,
    gene_id TEXT REFERENCES gene_cache(gene_id),
    consequence TEXT,
    impact TEXT,
    cadd_score FLOAT,
    gerp_score FLOAT,
    regulome_rank TEXT,
    protein_position TEXT,
    amino_acid_change TEXT,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_variant_gene ON variant_cache(gene_id);
CREATE INDEX idx_variant_cadd ON variant_cache(cadd_score);

-- Users (OAuth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    daily_query_count INTEGER DEFAULT 0,
    last_query_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_id)
);

-- Search history
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    gene_count INTEGER,
    variant_count INTEGER,
    filters JSONB,
    searched_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_history_user ON search_history(user_id);
```

## Rate Limiting Strategy

| External API | Limit | Implementation |
|---|---|---|
| NCBI E-utilities | 3 req/s (10 with API key) | `asyncio.Semaphore(10)` + NCBI API key |
| Ensembl REST | 15 req/s | VEP POST batch (200 variants/request) reduces calls |
| RegulomeDB | ~5 req/s recommended | `asyncio.Semaphore(5)` |

Internal API rate limiting:
- Per-IP: 60 requests/minute (via `slowapi`)
- Per-user: 100 search queries/day (tracked in `users.daily_query_count`)

## Authentication

OAuth 2.0 flow with Google and GitHub:

1. Frontend redirects to `/api/auth/login/google`
2. Backend redirects to Google OAuth consent screen
3. Google callbacks to `/api/auth/callback/google`
4. Backend validates token, creates/updates user in DB, issues JWT (7-day expiry, httpOnly cookie)
5. Frontend reads auth state from `/api/user/me`

Unauthenticated users can view the landing page but must sign in to search.

## Frontend Pages

### Page 1: Search (Landing)

- Hero section with search bar (preserved design language from prototype)
- Supports single gene (`BRCA1`) or batch (`BRCA1, TP53, EGFR`)
- Debounced autocomplete (300ms) suggesting gene symbols
- Fuzzy match suggestions on no results ("Did you mean BRCA1?")
- Database status badges (NCBI, Ensembl, RegulomeDB connectivity)

### Page 2: Results (Dual Tab)

**Tab A: Gene & Protein Overview (Table 2 format)**

Columns: Gene Symbol | Product Protein | Chromosome | Length (bp) | Source Links

- Source Links column: buttons linking to NCBI Gene and Ensembl Gene pages
- Sortable by all columns, instant text filter
- Click gene row to navigate to Gene Detail page

**Tab B: Genetic Variation & Annotations (Supplementary Table 1 format)**

Columns: Gene | SNP (rsID) | Consequence | Impact | CADD | GERP++ | RegulomeDB | Source Links

- Source Links column: buttons linking to dbSNP and Ensembl Variation pages
- Collapsible Filter Panel with:
  - CADD score range slider (0-50)
  - GERP++ range slider (-12 to 6)
  - Consequence multi-select checkboxes
  - Impact multi-select (HIGH, MODERATE, LOW, MODIFIER)
  - RegulomeDB rank dropdown
- Virtual scrolling via TanStack Virtual for 1000+ rows
- Inline row expand showing full VEP details (protein position, amino acid change)
- Multi-column sorting
- CSV/TSV export matching paper table format

### Page 3: Gene Detail

- Gene info card with all metadata
- Filtered SNP annotation table (single gene)
- External link buttons: NCBI Gene, Ensembl, UniProt, ClinVar, RegulomeDB
- Tissue expression chart (data from API, using existing recharts BarChart)

### Page 4: History

- User's past searches with timestamp, query, result counts
- Click to reload cached results
- Login required

## Source Link URL Templates

```
NCBI Gene:     https://www.ncbi.nlm.nih.gov/gene/{ncbi_gene_id}
Ensembl Gene:  https://ensembl.org/Homo_sapiens/Gene/Summary?g={ensembl_id}
dbSNP:         https://www.ncbi.nlm.nih.gov/snp/{rsid}
Ensembl VEP:   https://ensembl.org/Homo_sapiens/Variation/Explore?v={rsid}
UniProt:       https://www.uniprot.org/uniprotkb?query={gene_symbol}+AND+organism_id:9606
ClinVar:       https://www.ncbi.nlm.nih.gov/clinvar/?term={gene_symbol}[gene]
RegulomeDB:    https://regulomedb.org/regulome-search/?regions={rsid}
```

## Frontend Tech Stack

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Vite | Build tool |
| Tailwind CSS v4 | Styling |
| React Router v6 | Page routing with shareable URLs |
| TanStack Table v8 | Table rendering, sorting, filtering, column resizing |
| TanStack Virtual | Virtual scrolling for large datasets |
| TanStack Query | API state management, caching, loading/error states |
| motion/react | Page transitions and animations (kept from prototype) |
| recharts | Charts on Gene Detail page (kept from prototype) |
| lucide-react | Icons (kept from prototype) |

## Backend Tech Stack

| Library | Purpose |
|---------|---------|
| FastAPI | Async web framework |
| SQLAlchemy 2.0 + asyncpg | Async ORM + PostgreSQL driver |
| Alembic | Database migrations |
| httpx | Async HTTP client for external APIs |
| slowapi | Rate limiting |
| python-jose | JWT encoding/decoding |
| authlib | OAuth client |
| pydantic v2 | Request/response validation |

## UI Optimizations

### Search UX
- Debounced autocomplete (300ms)
- Batch search (comma-separated genes)
- Fuzzy match suggestions on no results

### Table Interactions
- Column resizing (drag to adjust width)
- Sticky header (fixed on scroll)
- Row highlight: hover highlights row; CADD >= 25 rows get red tint
- Inline expand: click row to show full VEP details
- Multi-column sort

### Visual Design
- Impact color system: HIGH=red, MODERATE=orange, LOW=yellow, MODIFIER=gray
- CADD score mini bar indicator beside the number
- Dark mode toggle (preserve #002045 primary color)
- Source link icons: NCBI=building, Ensembl=dna, dbSNP=microscope

### Export & Share
- CSV/TSV download with paper-format column headers
- Shareable URLs with query params (`/results?q=BRCA1&cadd_min=15`)
- Copy table selection to clipboard (paste into Word/LaTeX)

### Performance & UX
- Skeleton loading (table bone screen during API calls)
- Progressive loading: Tab A (gene info) loads first, Tab B (SNP annotations) streams in with progress bar
- Error boundary: single API failure shows N/A for that column, doesn't break page
- Responsive: tablet/mobile shows card layout instead of table

## Deployment

| Component | Platform | URL Pattern |
|-----------|----------|-------------|
| Frontend | Vercel | `https://helix-bio.vercel.app` |
| Backend | Railway | `https://helix-bio-api.up.railway.app` |
| Database | Railway PostgreSQL | Internal connection string |

### Environment Variables

Backend:
- `DATABASE_URL` - PostgreSQL connection (asyncpg)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `JWT_SECRET` - JWT signing key
- `NCBI_API_KEY` - NCBI E-utilities API key (free, raises limit to 10 req/s)
- `FRONTEND_URL` - Vercel frontend URL (for CORS and OAuth callback)

Frontend:
- `VITE_API_URL` - Backend API base URL

### Local Development

```bash
docker-compose up -d db          # Start PostgreSQL
cd backend && uvicorn main:app --reload  # Start API
cd frontend && npm run dev       # Start frontend
```

## Error Handling & Fallbacks

| Scenario | Behavior |
|----------|----------|
| NCBI API down | Return error with retry suggestion |
| Ensembl VEP timeout | Return gene info (Tab A) successfully, show "VEP unavailable" on Tab B |
| RegulomeDB unreachable | Show "N/A" in RegulomeDB column, all other columns populated |
| CADD score missing for a variant | Show "N/A" |
| No variants found for gene | Show empty state message on Tab B |
| User exceeds daily limit | Show limit reached message with reset time |
| Invalid gene symbol | Fuzzy match suggestion or "No results found" |

## Security

| Concern | Mitigation |
|---------|-----------|
| Rate limiting | slowapi per-IP + per-user daily cap |
| CORS | Whitelist Vercel frontend domain only |
| Input validation | Pydantic models on all endpoints |
| SQL injection | SQLAlchemy ORM exclusively (no raw SQL) |
| XSS | React auto-escapes, no dangerouslySetInnerHTML |
| HTTPS | Vercel + Railway enforce TLS |
| Secrets | Environment variables, never in code |
| JWT | httpOnly cookie, 7-day expiry |
