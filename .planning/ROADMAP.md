# Roadmap: Helix Bio — Variant Annotation System

## Phases

- [x] **Phase 1: Foundation & Gene Search** - Setup monorepo infrastructure and implement core gene discovery via NCBI.
- [x] **Phase 2: Variant Annotation & Filtering** - Implement high-density variant discovery and functional annotation via Ensembl VEP and RegulomeDB.
- [x] **Phase 3: Authentication & History** - Secure the platform with OAuth and implement user search history.
- [x] **Phase 4: Advanced Features & Export** - Deep-dive gene detail views, charts, and publication-ready data export.
- [x] **Phase 5: Production Deployment & Polish** - Deploy to Railway/Vercel and finalize UI/UX polish.

## Phase Details

### Phase 1: Foundation & Gene Search
**Goal**: Establish the full-stack foundation and enable gene discovery via NCBI E-utilities.
**Depends on**: Nothing
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04, BACK-01, API-01, UI-01, UI-02 (Tab A)
**Success Criteria** (what must be TRUE):
  1. User can search for a gene (e.g., "BRCA1") and see correct NCBI metadata in the UI table.
  2. Search results are cached in PostgreSQL for 7 days.
  3. API rate limiting is enforced to prevent external API bans.
**Plans**:
- [x] 01-01-PLAN.md — Foundation Verification (TBD)
**UI hint**: yes

### Phase 2: Variant Annotation & Filtering
**Goal**: Deliver the primary value proposition: high-quality functional annotation of gene variants.
**Depends on**: Phase 1
**Requirements**: BACK-02, BACK-03, BACK-04, BACK-05, API-02, API-04, UI-02 (Tab B), UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Selecting a gene row displays thousands of variants with CADD and GERP++ scores.
  2. Filtering by CADD score instantly updates the virtualized table with zero lag.
  3. Impact levels (HIGH, MODERATE, etc.) are color-coded in the UI.
**Plans**:
- [x] 02-01-PLAN.md — Optimized Batch Annotation & Discovery
- [x] 02-02-PLAN.md — DB-Level Filtering & High-Density UI
**UI hint**: yes

### Phase 3: Authentication & History
**Goal**: Add user identity and persist search history across sessions.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, UI-06
**Success Criteria** (what must be TRUE):
  1. User can sign in using Google or GitHub.
  2. User's previous searches are listed in the History tab.
  3. Clicking a history entry re-renders the cached results without redundant API calls.
**Plans**: 3 plans
- [x] 03-01-PLAN.md — Persistent Auth & User Identity
- [x] 03-02-PLAN.md — Comprehensive Search History API
- [x] 03-03-PLAN.md — History UI with Click-to-Replay
**UI hint**: yes

### Phase 4: Advanced Features & Export
**Goal**: Complete the "publication-ready" toolset with detail views and data export.
**Depends on**: Phase 2
**Requirements**: API-03, UI-05, UI-07
**Success Criteria** (what must be TRUE):
  1. Gene Detail page displays a responsive tissue expression chart.
  2. Search bar provides autocomplete suggestions from the cache.
  3. User can download a CSV of variant results matching "Supplementary Table 1" format.
**Plans**: 3 plans
- [x] 04-01-PLAN.md — Autocomplete & CSV Export
- [x] **Phase 5: Production Deployment & Polish** - Deploy to Railway/Vercel and finalize UI/UX polish.
- [x] **Phase 6: Security, Consistency & Stability** - Unified query limits, history tracking, and environment stability.

## Phase Details
...
### Phase 6: Security, Consistency & Stability
**Goal**: Ensure unified behavior and environment stability.
**Depends on**: Phase 5
**Success Criteria** (what must be TRUE):
  1. Variants and Pathways endpoints enforce the 100/day daily limit.
  2. Search history records all types of searches (genes, variants, pathways).
  3. UI provides explicit feedback for 429 status codes.
  4. Backend-to-DB connection is stable using local roles.
**Plans**: 1 quick plan
- [x] 260417-stability-patch — Unified Tracking & Stability Fixes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Gene Search | 1/1 | Completed | 2026-04-12 |
| 2. Variant Annotation & Filtering | 2/2 | Completed | 2026-04-12 |
| 3. Authentication & History | 3/3 | Completed | 2026-04-12 |
| 4. Advanced Features & Export | 3/3 | Completed | 2026-04-12 |
| 5. Production Deployment & Polish | 3/3 | Completed | 2026-04-12 |
| 6. Security, Consistency & Stability | 1/1 | Completed | 2026-04-17 |

