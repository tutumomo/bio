# Helix Bio — Variant Annotation System

一個面向生物資訊研究的 Web 平台，可搜尋人類基因／蛋白並產出論文等級的變異註解表格，整合 NCBI E-utilities、Ensembl VEP 與 RegulomeDB。

A bioinformatics web platform that searches human genes and proteins and produces paper-quality variant annotation tables by integrating NCBI E-utilities, Ensembl VEP, and RegulomeDB.

## Features / 功能特色

- **Gene Discovery / 基因搜尋**
  - 透過 NCBI E-utilities 以 gene symbol 或 protein name 搜尋基因。
  - Search genes by symbol or protein name through NCBI E-utilities.

- **SNP Annotation / SNP 註解**
  - 提供來自 Ensembl VEP 與 RegulomeDB 的 CADD、GERP++ 與調控分數。
  - Retrieve CADD, GERP++, and regulatory scores from Ensembl VEP and RegulomeDB.

- **Paper-Quality Tables / 論文級表格輸出**
  - 產出 Gene overview（Table 2）與 variant annotations（Supplementary Table 1）格式資料。
  - Generate gene overview (Table 2) and variant annotation (Supplementary Table 1) outputs.

- **Source Links / 原始資料連結**
  - 直接連到 NCBI Gene、Ensembl、dbSNP、UniProt、ClinVar、RegulomeDB。
  - Provide direct links to NCBI Gene, Ensembl, dbSNP, UniProt, ClinVar, and RegulomeDB.

- **Filter Panel / 篩選面板**
  - 依 CADD、GERP++、consequence、impact、RegulomeDB rank 進行變異篩選。
  - Filter variants by CADD, GERP++, consequence, impact, and RegulomeDB rank.

- **CSV/TSV Export / CSV 與 TSV 匯出**
  - 下載可直接用於分析或整理的表格資料。
  - Export results in CSV and TSV formats for downstream analysis.

- **OAuth Authentication / OAuth 登入**
  - 支援 Google 與 GitHub 登入。
  - Support Google and GitHub sign-in flows.

- **PostgreSQL Cache / PostgreSQL 快取**
  - 以 7 天 TTL 快取外部 API 結果以提升效能。
  - Use a 7-day TTL PostgreSQL cache to improve performance and reduce upstream API calls.

## Architecture / 架構

```text
bio/
├── frontend/     # React 19 + Vite + Tailwind v4 + TanStack Table/Query
├── backend/      # FastAPI + SQLAlchemy + asyncpg
└── README.md
```

## Local Development / 本機開發

### Prerequisites / 需求

- Python 3.9+
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
pip install -r requirements.txt
export DATABASE_URL="postgresql+asyncpg://$(whoami)@localhost:5432/helix_bio"
export JWT_SECRET="dev-secret-key"
export FRONTEND_URL="http://localhost:5555"
uvicorn backend.main:app --reload --port 8001 --host 0.0.0.0
```

### Frontend / 前端

```bash
cd frontend
npm install
npm run dev -- --port 5555 --host 0.0.0.0
```

Open `http://localhost:5555`

開啟 `http://localhost:5555`

### Environment Variables / 環境變數

**Backend / 後端**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL 連線字串 / PostgreSQL connection string (asyncpg) |
| `JWT_SECRET` | JWT 簽章金鑰 / JWT signing key |
| `NCBI_API_KEY` | NCBI E-utilities API key（可選，提升 rate limit / optional, increases rate limit） |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `FRONTEND_URL` | 前端網址，用於 CORS 與 OAuth callback / Frontend URL for CORS and OAuth callbacks |

**Frontend / 前端**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | 後端 API base URL / Backend API base URL |

## Deployment / 部署

**Frontend -> Vercel**

- Connect the GitHub repository and set the root directory to `frontend/`.
- Add `VITE_API_URL` to point at the Railway backend.
- 連接 GitHub repo，並將 root directory 設為 `frontend/`。
- 設定 `VITE_API_URL` 指向 Railway 上的後端。

**Backend -> Railway**

- Connect the GitHub repository and set the root directory to `backend/`.
- Add a PostgreSQL plugin for the database.
- Set all required backend environment variables.
- 連接 GitHub repo，並將 root directory 設為 `backend/`。
- 加入 PostgreSQL plugin 作為資料庫。
- 設定所有必要的後端環境變數。

## Tech Stack / 技術棧

| Layer | Technology |
|-------|-----------|
| Frontend / 前端 | React 19, Vite, Tailwind v4, TanStack Table/Query/Virtual, React Router v6 |
| Backend / 後端 | FastAPI, SQLAlchemy 2.0, asyncpg, httpx |
| Database / 資料庫 | PostgreSQL 16 |
| Auth / 驗證 | OAuth 2.0 (Google, GitHub) + JWT |
| External APIs / 外部 API | NCBI E-utilities, Ensembl VEP, RegulomeDB |
