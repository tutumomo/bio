# Graph Report - .  (2026-04-12)

## Corpus Check
- Corpus is ~26,117 words - fits in a single context window. You may not need a graph.

## Summary
- 232 nodes · 286 edges · 31 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `GenePipeline` - 14 edges
2. `Base` - 8 edges
3. `Fetch predicted functional partners from STRING DB for a given gene.` - 8 edges
4. `Search Reactome for human pathways matching the query.` - 6 edges
5. `Return all proteins that participate in a Reactome pathway.` - 6 edges
6. `ReactomeClient` - 6 edges
7. `GeneCache` - 6 edges
8. `VariantCache` - 6 edges
9. `RegulomeDBClient` - 5 edges
10. `VEPClient` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Client-Side Filter Panel (CADD/GERP++/Consequence)` --semantically_similar_to--> `Delegated Filter Pushdown (Client-Side Filtering vs Server-Side)`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/superpowers/specs/2026-04-04-variant-annotation-system-design.md
- `Pydantic Settings Configuration` --semantically_similar_to--> `Async-First Architecture Mandate`  [INFERRED] [semantically similar]
  CLAUDE.md → GEMINI.md
- `Gene Symbol Autocomplete (prefix match on gene_cache)` --shares_data_with--> `GeneCache`  [INFERRED]
  README.md → docs/superpowers/plans/2026-04-04-variant-annotation-system.md
- `SQLite Compatibility Shim for Tests` --conceptually_related_to--> `GeneCache`  [INFERRED]
  CLAUDE.md → docs/superpowers/plans/2026-04-04-variant-annotation-system.md
- `CSV/TSV Paper-Format Export` --conceptually_related_to--> `VariantCache`  [INFERRED]
  README.md → docs/superpowers/plans/2026-04-04-variant-annotation-system.md

## Hyperedges (group relationships)
- **Three-Layer API Pipeline Orchestration** — gene_pipeline, ncbi_client, ensembl_client, vep_client, regulomedb_client, layer1_gene_discovery, layer2_snp_discovery, layer3_functional_annotation [EXTRACTED 1.00]
- **Auth & Rate Limiting System** — oauth_jwt_auth, user_model, rate_limiting_strategy, slowapi_rate_limiter, daily_query_cap, http_only_jwt_cookie [INFERRED 0.85]
- **Variant Annotation End-to-End Data Flow** — ncbi_client, ensembl_client, vep_client, regulomedb_client, gene_cache_model, variant_cache_model, cadd_gerp_regulome_scores [INFERRED 0.80]

## Communities

### Community 0 - "Frontend UI Components"
Cohesion: 0.09
Nodes (0): 

### Community 1 - "Pathway & Protein Domain"
Cohesion: 0.11
Nodes (20): BaseModel, PathwayProtein, PathwayProteinsResult, PathwayResult, PathwaySearchResult, get_pathway_proteins(), Search Reactome for human pathways matching the query., Return all proteins that participate in a Reactome pathway. (+12 more)

### Community 2 - "Gene Pipeline & External APIs"
Cohesion: 0.12
Nodes (23): Asyncio Semaphore Pattern for Rate Limiting, Gene Symbol Autocomplete (prefix match on gene_cache), CADD / GERP++ / RegulomeDB Scores, CSV/TSV Paper-Format Export, EnsemblClient, GeneCache, Layer 1: Gene Discovery (NCBI E-utilities), Layer 2: SNP Discovery (Ensembl Overlap) (+15 more)

### Community 3 - "Test Infrastructure"
Cohesion: 0.14
Nodes (11): Base, _create_sqlite_tables(), _drop_sqlite_tables(), Create only SQLite-compatible tables., Drop only SQLite-compatible tables., Base, DeclarativeBase, GeneCache (+3 more)

### Community 4 - "Ensembl Integration"
Cohesion: 0.14
Nodes (4): EnsemblClient, GenePipeline, _is_stale(), NCBIClient

### Community 5 - "Gene Search & STRING DB"
Cohesion: 0.14
Nodes (8): GeneResponse, GeneSearchResult, get_string_partners(), Fetch predicted functional partners from STRING DB for a given gene., Fetch predicted functional partners from STRING DB.         Returns partners sor, StringDBClient, StringPartner, StringPartnersResult

### Community 6 - "Auth & Rate Limiting"
Cohesion: 0.22
Nodes (9): Per-User Daily Query Cap (100/day), httpOnly JWT Cookie Strategy, OAuth 2.0 + JWT Authentication Flow, Rate Limiting Strategy, SearchHistory Model, Search History Tracking (user_id, query, counts, filters), SearchPage to ResultsPage to GeneDetailPage Flow, slowapi Per-IP Rate Limiter (+1 more)

### Community 7 - "VEP Tests"
Cohesion: 0.4
Nodes (0): 

### Community 8 - "RegulomeDB Client"
Cohesion: 0.5
Nodes (1): RegulomeDBClient

### Community 9 - "VEP Client"
Cohesion: 0.5
Nodes (1): VEPClient

### Community 10 - "App Configuration"
Cohesion: 0.4
Nodes (4): Async-First Architecture Mandate, BaseSettings, Settings, Pydantic Settings Configuration

### Community 11 - "Auth Dependencies"
Cohesion: 0.5
Nodes (2): get_optional_user(), Returns the current user payload, or None if not authenticated.

### Community 12 - "NCBI Tests"
Cohesion: 0.5
Nodes (0): 

### Community 13 - "Ensembl Tests"
Cohesion: 0.5
Nodes (0): 

### Community 14 - "User History Endpoints"
Cohesion: 0.5
Nodes (0): 

### Community 15 - "Alembic Migrations"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Frontend Patterns"
Cohesion: 0.5
Nodes (4): Graceful Error Fallback Design, Frontend Port 3001 (Avoiding Conflict), Progressive Loading Pattern, TanStack Query as State Manager

### Community 17 - "App Entry Point"
Cohesion: 0.67
Nodes (0): 

### Community 18 - "Data Export"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "JWT Utilities"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Pipeline Tests"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Auth Tests"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Model Tests"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "RegulomeDB Tests"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "OAuth Endpoints"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Variant Endpoints"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Filter & Visual Design"
Cohesion: 0.67
Nodes (3): Delegated Filter Pushdown (Client-Side Filtering vs Server-Side), Client-Side Filter Panel (CADD/GERP++/Consequence), Impact Color System (HIGH=red, MODERATE=orange, LOW=yellow, MODIFIER=gray)

### Community 27 - "Platform Deployment"
Cohesion: 1.0
Nodes (2): Helix Bio Platform, Vercel + Railway Two-Service Deployment

### Community 28 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Package Init"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Rate Limiter"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `Progressive Loading Pattern` → `Frontend Port 3001 (Avoiding Conflict)`  [AMBIGUOUS]
  GEMINI.md · relation: rationale_for

## Knowledge Gaps
- **24 isolated node(s):** `Returns the current user payload, or None if not authenticated.`, `Fetch predicted functional partners from STRING DB.         Returns partners sor`, `Remove HTML highlight tags returned by Reactome search.`, `Search human pathways by keyword via Reactome full-text search.`, `Get all proteins that participate in a given Reactome pathway.` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Platform Deployment`** (2 nodes): `Helix Bio Platform`, `Vercel + Railway Two-Service Deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Package Init`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rate Limiter`** (1 nodes): `rate_limiter.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Progressive Loading Pattern` and `Frontend Port 3001 (Avoiding Conflict)`?**
  _Edge tagged AMBIGUOUS (relation: rationale_for) - confidence is low._
- **Why does `GenePipeline` connect `Ensembl Integration` to `Gene Pipeline & External APIs`, `Test Infrastructure`, `Gene Search & STRING DB`, `RegulomeDB Client`, `VEP Client`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `Fetch predicted functional partners from STRING DB for a given gene.` connect `Gene Search & STRING DB` to `Test Infrastructure`, `Ensembl Integration`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `GenePipeline` (e.g. with `Fetch predicted functional partners from STRING DB for a given gene.` and `EnsemblClient`) actually correct?**
  _`GenePipeline` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `Base` (e.g. with `Create only SQLite-compatible tables.` and `Drop only SQLite-compatible tables.`) actually correct?**
  _`Base` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `Fetch predicted functional partners from STRING DB for a given gene.` (e.g. with `GeneResponse` and `GeneSearchResult`) actually correct?**
  _`Fetch predicted functional partners from STRING DB for a given gene.` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `Search Reactome for human pathways matching the query.` (e.g. with `PathwaySearchResult` and `PathwayResult`) actually correct?**
  _`Search Reactome for human pathways matching the query.` has 5 INFERRED edges - model-reasoned connections that need verification._