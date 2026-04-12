# Phase 2: Variant Annotation & Filtering - Research

**Researched:** 2026-04-12
**Domain:** Bioinformatics Variant Annotation, External API Integration, High-Density UI Rendering
**Confidence:** HIGH

## Summary

Phase 2 focuses on delivering functional annotation for genetic variants. The current implementation (~40%) already includes clients for Ensembl REST, VEP, and RegulomeDB. However, to meet the "thousands of variants" and "zero-lag filtering" success criteria, significant optimizations are needed in the data pipeline (batching, DB-level filtering) and the frontend (large-batch fetching, local filtering).

**Primary recommendation:** Optimize the backend to perform filtering in the database using SQLAlchemy, and increase the batch size for VEP/RegulomeDB to support thousands of variants efficiently.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Ensembl REST API | v1 | SNP Discovery | The global standard for Ensembl data. |
| Ensembl VEP | v1 | Functional Annotation | Industry standard for CADD, GERP++, and Impact scores. [VERIFIED: official docs] |
| RegulomeDB API | v2.2 | Regulatory Scoring | Key source for GRCh38 regulatory functional ranks. [VERIFIED: web search] |
| TanStack Table | 8.20.6 | Table State | Best-in-class headless table logic for React. [VERIFIED: package.json] |
| TanStack Virtual | 3.11.2 | Virtualization | Essential for rendering 1000+ rows without DOM lag. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SQLAlchemy | 2.0.36 | Async ORM | Used for caching and filtering variant data in PostgreSQL. [VERIFIED: requirements.txt] |
| HTTpx | 0.28.1 | Async HTTP | Standard for making concurrent external API calls in Python. [VERIFIED: requirements.txt] |

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── services/
│   ├── ensembl.py       # SNP Discovery
│   ├── vep.py           # VEP Annotation (Batching)
│   ├── regulomedb.py    # Regulatory Scoring (Batching needed)
│   └── gene_pipeline.py # Orchestrator
├── api/
│   └── variants.py      # Filtering & Pagination logic
└── models/
    └── variant.py       # Cache Schema with Indices
```

### Pattern 1: Multi-Stage Batch Annotation
**What:** Discover SNP IDs (rsids) from Ensembl Overlap, then batch annotate via VEP and RegulomeDB.
**When to use:** When fetching variants for a whole gene (which can have hundreds/thousands of SNPs).
**Optimization:** Increase VEP batch size to 500-1000 and implement batching for RegulomeDB via space-separated regions. [CITED: Ensembl/RegulomeDB Docs]

### Anti-Patterns to Avoid
- **Individual API Calls:** Fetching RegulomeDB scores one-by-one for 1000 variants will lead to timeouts and rate-limiting.
- **In-Memory Python Filtering:** Filtering 10,000 variants in Python is slower than SQL. Use SQLAlchemy `.where()` clauses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Virtual Scrolling | Custom list | TanStack Virtual | Handles row measurements, overscan, and dynamic sizing correctly. |
| CADD/GERP Scores | Custom parser | Ensembl VEP | Scores are complex to calculate; VEP provides them as pre-computed metadata. |

## Common Pitfalls

### Pitfall 1: Ensembl Burst Limit (429)
**What goes wrong:** Parallel requests exceed 15 req/sec.
**Why it happens:** Multiple concurrent `GenePipeline` calls or large batch loops.
**How to avoid:** Respect the `X-RateLimit-Reset` header and keep the semaphore to 15 or less. [CITED: Ensembl REST docs]

### Pitfall 2: Stale Cache for Large Genes
**What goes wrong:** A gene search returns 5,000 variants, but subsequent filters only see the first 500 cached.
**Why it happens:** Partial fetching during the first discovery phase.
**How to avoid:** Ensure the discovery phase fetches a complete set (or a large enough subset, e.g. 2000) and marks the cache as complete for that gene.

## Code Examples

### Batch RegulomeDB Search (Proposed Refinement)
```python
# Based on RegulomeDB API Research
async def get_regulome_scores_batch(self, rsids: List[str]) -> Dict[str, str]:
    # space-separated list for batching
    regions = " ".join(rsids)
    url = f"https://regulomedb.org/regulome-search/?regions={regions}&genome=GRCh38&format=json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        # Parse 'variants' list from response
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| hg19 (GRCh37) | GRCh38 | 2013+ | Helix Bio must use GRCh38 for all coordinates and RegulomeDB searches. |
| Single SNP VEP | Batch POST VEP | Recent | Allows up to 1000 variants per request. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | VEP provides CADD/GERP++ | Success Criteria | High - primary requirement. |
| A2 | RegulomeDB supports batching | Pitfalls | Medium - individual requests will be slow. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Caching | ✓ | 16 | — |
| httpx | External APIs | ✓ | 0.28.1 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest |
| Config file | `backend/tests/conftest.py` |
| Quick run command | `pytest backend/tests/test_vep.py` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BACK-03 | VEP Annotation | Integration | `pytest backend/tests/test_vep.py` | ✅ |
| BACK-04 | RegulomeDB | Integration | `pytest backend/tests/test_regulomedb.py` | ✅ |
| UI-04 | Virtualization | E2E | Manual/Playwright | ❌ |

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Pydantic schemas for filter parameters. |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection | Tampering | SQLAlchemy Parameterized Queries. |
| API Denial of Service | Availability | Slowapi Rate Limiter. |

## Sources

### Primary (HIGH confidence)
- [Ensembl REST API Documentation] - Rate limits and VEP batch size.
- [RegulomeDB API Documentation] - Batch search regions.
- [Project Codebase] - Verified existing implementation.

### Secondary (MEDIUM confidence)
- [Web Search] - RegulomeDB GRCh38 support and batching.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: MEDIUM (Ensembl rate limits are dynamic)

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
