# Helix Bio — Variant Annotation System · v2.0.0

> **FOR RESEARCH USE ONLY — Not a medical device.**
> All variant classifications must be reviewed by a certified clinical geneticist
> before any clinical decision. Do not enter patient identifiers (PHI) into this system.
>
> **本工具僅供研究與教育用途，不構成醫療建議或診斷依據。**
> 所有變異分類結果應由臨床遺傳師覆核。請勿輸入可識別之病患個資（PHI）。

一個面向生物資訊研究的 Web 平台，可搜尋人類基因／蛋白並產出論文等級的變異註解表格，整合 NCBI E-utilities、Ensembl VEP、RegulomeDB、ClinVar、gnomAD 與 OMIM。

A bioinformatics web platform that searches human genes and proteins and produces paper-quality variant annotation tables, integrating NCBI E-utilities, Ensembl VEP, RegulomeDB, ClinVar, gnomAD, and OMIM.

## Features / 功能特色

### 基因與蛋白查詢 / Gene & Protein Discovery

- **Gene Search** — 透過 NCBI E-utilities 以 gene symbol 或 protein name 搜尋基因。Search genes by symbol or protein name via NCBI E-utilities.
- **Disease Associations / 疾病關聯** — OMIM 疾病條目（遺傳模式、發病年齡）與 Orphanet 罕病代碼。OMIM disease entries with inheritance pattern and Orphanet cross-references.
- **Pathway Analysis** — Reactome pathway search + STRING protein interaction partners.
- **Tissue Expression** — GTEx RNA expression across 54 tissues.

### 變異註解 / Variant Annotation

- **SNP Annotation** — CADD, GERP++, regulatory scores (RegulomeDB), consequence, and impact from Ensembl VEP.
- **ClinVar Clinical Significance / 臨床意義** — Pathogenic / Likely Pathogenic / VUS / Likely Benign / Benign，含 review star rating（0–4 星）。With review star rating (0–4 stars).
- **gnomAD Population Frequency / 族群頻率** — gnomAD v4 `AF_popmax` 及各族群（EAS、NFE、AFR、SAS 等）頻率。gnomAD v4 AF_popmax and per-population allele frequencies.
- **HGVS Nomenclature / 命名** — Coding (`hgvsc`) 與 protein (`hgvsp`) 標準命名。Coding and protein standard nomenclature.
- **ACMG/AMP 5-Tier Classification / 5-tier 自動分類** — 依 ACMG/AMP 2015 Standards 自動推導 9 個證據碼（PVS1 / PS3 / PM2 / PP3 / BA1 / BS1 / BS2 / BP4 / BP7），輸出 Pathogenic / Likely Pathogenic / VUS / Likely Benign / Benign。9 evidence codes derived automatically; UI shows collapsible evidence panel per variant.

### 輸出與合規 / Export & Compliance

- **Reproducibility Manifest** — 每次匯出附帶 `manifest.json`，記錄 API 版本與查詢時間戳，滿足論文可重現性要求。Each export includes a `manifest.json` with API versions and `accessed_at` timestamps.
- **CSV/TSV Export** — 含臨床免責聲明 metadata 行，可直接用於論文附件。Includes disclaimer metadata row; suitable for supplementary tables.
- **Research Disclaimer** — UI 頂部 banner、CSV 匯出、API response metadata 三處同步。Synced across UI banner, CSV export, and API metadata.

### 其他 / Other

- **Filter Panel** — CADD、GERP++、consequence、impact、RegulomeDB rank 篩選。
- **OAuth Authentication** — Google 與 GitHub 登入。
- **PostgreSQL Cache** — 7 天 TTL 快取，減少外部 API 呼叫。

---

## Architecture / 架構

```text
bio/
├── frontend/     # React 19 + Vite + Tailwind v4 + TanStack Table/Query/Virtual
├── backend/      # FastAPI 0.115 + SQLAlchemy 2.0 async + asyncpg + httpx
└── README.md
```

**Backend services** (`backend/services/`):
`ncbi` · `ensembl` · `vep` · `regulomedb` · `clinvar` · `gnomad` · `acmg_classifier` · `omim` · `orphanet` · `reactome` · `string_db` → orchestrated by `gene_pipeline`

---

## Local Development / 本機開發

### Prerequisites / 需求

- Python 3.11
- Node.js 18+
- PostgreSQL 16（透過 Homebrew 或 Docker / via Homebrew or Docker）

### Setup PostgreSQL / 設定 PostgreSQL

```bash
# Option A: Homebrew
bash brew-setup.sh

# Option B: Docker
docker-compose up -d db
```

### Backend / 後端

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="postgresql+asyncpg://$(whoami)@localhost:5432/helix_bio"
export JWT_SECRET="dev-secret-key"
export FRONTEND_URL="http://localhost:5555"

# Run DB migrations (required for v2.0 schema — adds HGVS, ClinVar, gnomAD, ACMG columns)
alembic upgrade head

uvicorn backend.main:app --reload --port 8001 --host 0.0.0.0
```

### Frontend / 前端

```bash
cd frontend
npm install
npm run dev -- --port 5555 --host 0.0.0.0
```

Open `http://localhost:5555` / 開啟 `http://localhost:5555`

### Run Tests / 執行測試

```bash
cd backend
PYTHONPATH=/path/to/bio pytest -q          # all 68 tests
pytest backend/tests/test_clinvar.py -v    # single file
pytest --cov=backend --cov-report=term-missing
```

---

## Environment Variables / 環境變數

### Backend / 後端

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | asyncpg PostgreSQL URL (e.g. `postgresql+asyncpg://user@host/helix_bio`) |
| `JWT_SECRET` | ✅ | JWT signing secret（生產環境請用隨機長字串） |
| `FRONTEND_URL` | ✅ | 前端網址，用於 CORS 與 OAuth callback（e.g. `https://helix-bio.vercel.app`） |
| `NCBI_API_KEY` | optional | NCBI E-utilities key，提升 rate limit 從 3 → 10 req/s |
| `OMIM_API_KEY` | optional | OMIM API key（https://omim.org/api）；未設定時 OMIM 功能 graceful skip |
| `GOOGLE_CLIENT_ID` | optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | optional | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | optional | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | optional | GitHub OAuth client secret |

### Frontend / 前端

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | production only | 後端 API base URL（dev 環境由 Vite proxy 自動轉發） |

---

## Deployment / 部署

### Frontend → Vercel

1. 連接 GitHub repo，**Root Directory** 設為 `frontend/`
2. Framework Preset: **Vite**
3. 設定環境變數 `VITE_API_URL` → Railway 後端網址（例如 `https://helix-bio-api.up.railway.app`）
4. `frontend/vercel.json` 已設定 SPA rewrite 與 `/api/*` proxy，無需額外設定

```json
// frontend/vercel.json（已存在）
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://helix-bio-api.up.railway.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> **更換後端網址時**：更新 `frontend/vercel.json` 中的 `destination` 與 Vercel 環境變數 `VITE_API_URL`。

### Backend → Railway

1. 連接 GitHub repo，**Root Directory** 設為 `backend/`
2. 加入 **PostgreSQL plugin**（Railway 會自動注入 `DATABASE_URL`）
3. 設定所有必要環境變數（見上表）
4. 首次部署後執行 DB migration：

```bash
# 在 Railway console 或 deploy command 中執行
alembic upgrade head
```

> **v2.0 新增 3 個 migration**，若從 v1.x 升級必須執行：
> - `7552cb4e3125` — 新增 `hgvsc`, `hgvsp` 欄位
> - `453a3747ceb7` — 新增 `clinvar_significance`, `clinvar_review_stars`, `gnomad_af_popmax`, `acmg_tier` 欄位

**Railway start command**（`backend/Procfile` 已設定）：

```
web: uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

---

## Tech Stack / 技術棧

| Layer | Technology |
|-------|-----------|
| Frontend / 前端 | React 19, Vite, Tailwind v4, TanStack Table/Query/Virtual, React Router v6 |
| Backend / 後端 | FastAPI 0.115, SQLAlchemy 2.0, asyncpg, httpx, slowapi |
| Database / 資料庫 | PostgreSQL 16 (7-day cache TTL) |
| Auth / 驗證 | OAuth 2.0 (Google, GitHub) + JWT |
| External APIs | NCBI E-utilities, Ensembl VEP, RegulomeDB, ClinVar (NCBI), gnomAD v4 GraphQL, OMIM, Orphanet |

---

## Version History / 版本歷史

| Version | Date | Highlights |
|---------|------|-----------|
| v1.0.0 | 2026-03 | Initial release: gene search, VEP annotation, pathway analysis |
| v1.2.0 | 2026-04 | PostgreSQL cache, rate limiting, OAuth, search history |
| **v2.0.0** | **2026-05** | **ClinVar · gnomAD v4 · ACMG/AMP 5-tier · HGVS · OMIM · Orphanet · Reproducibility manifest** |
