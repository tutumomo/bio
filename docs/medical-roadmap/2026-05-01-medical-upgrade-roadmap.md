# Helix Bio 醫學升級 Roadmap（v2.0 → v3.0）

**日期：** 2026-05-01
**更新：** 2026-05-02（v2.0 落地確認）
**現況：** ✅ **v2.0.0 已完整落地**（68 tests passing，tag 已打）
**目標：** 從「基因資料瀏覽器」升級為「臨床級變異分類研究工具」→ 精準醫學研究平台

> ⚠️ **臨床免責聲明（已實作於 UI banner / CSV 匯出 / API metadata / README）**
>
> 本工具僅供研究與教育用途，**不構成醫療建議、診斷或治療依據**。所有變異分類結果應由臨床遺傳師（Certified Clinical Geneticist / Genetic Counselor）覆核。為保護受測者隱私，使用者**不得**輸入可識別個人身份的健康資訊（PHI）。

---

## ✅ v2.0.0「臨床級變異分類工具」— 已完整落地

**落地日期：** 2026-05-02
**Tag：** `v2.0.0`（commit `07fe312` 起）
**Tests：** 68 passed, 1 warning

### 已實作功能（原 v2.0 + v2.5 計劃全部合併為 v2.0）

| # | 功能 | 原計劃批次 | 狀態 |
|---|------|-----------|------|
| 1 | ClinVar 致病性整合（star rating / germline_classification） | v2.0 | ✅ `backend/services/clinvar.py` |
| 2 | gnomAD v4 族群頻率（GraphQL，af_popmax） | v2.0 | ✅ `backend/services/gnomad.py` |
| 3 | ACMG/AMP 5-tier 分類（9 證據碼：PVS1/PS3/PM2/PP3/BA1/BS1/BS2/BP4/BP7） | v2.0 | ✅ `backend/services/acmg_classifier.py` |
| 4 | HGVS nomenclature（hgvsc/hgvsp，from VEP） | v2.0 | ✅ `backend/services/vep.py` |
| 5 | Pipeline 整合（ClinVar/gnomAD/ACMG 進 variant pipeline + DB migration） | v2.0 | ✅ `backend/services/gene_pipeline.py` |
| 6 | 臨床免責聲明（UI banner / CSV / API metadata / README） | v2.0 | ✅ `frontend/src/components/ClinicalDisclaimer.tsx` |
| 7 | Frontend VariantTable（HGVS/ClinVar/gnomAD/ACMG 欄位 + AcmgEvidencePopover） | v2.0 | ✅ `frontend/src/components/VariantTable.tsx` |
| 8 | OMIM 疾病關聯（GeneDetailPage 相關疾病 section） | 原 v2.5 | ✅ `backend/services/omim.py` |
| 9 | Orphanet 罕病代碼（OMIM panel 內交叉連結） | 原 v2.5 | ✅ `backend/services/orphanet.py` |
| 10 | Reproducibility manifest JSON（匯出附帶 API versions/accessed_at） | 原 v2.5 | ✅ manifest endpoint |
| 11 | Methods 自動產生 | 原 v2.5 | ⚠️ 待確認是否已實作 |

> **說明：** 原計劃分為 v2.0（5-6天）和 v2.5（再 5-6天）兩批，Codex 執行時一次性全部落地並統一打為 `v2.0.0` tag。計劃從此以 v2.0 代表這批完整功能集。

### v2.0 已建立的測試覆蓋

- `test_clinvar.py` — ClinVar pathogenicity + star rating
- `test_gnomad.py` — gnomAD v4 GraphQL client
- `test_acmg.py` — ACMG classifier (9 evidence codes，8+ 案例)
- `test_vep.py` — HGVS 欄位
- `test_v2_integration.py` — pipeline 整合測試
- `test_omim.py` — OMIM disease associations
- 共 68 tests passed

### v2.0 UI 新增內容

- VariantTable：`ClinVar Classification` / `gnomAD AF_popmax` / `ACMG Tier` / `HGVS` 四個欄位
- `AcmgEvidencePopover`：ACMG 證據碼可摺疊展開
- `OmimDiseasePanel`：基因疾病關聯（含 Orphanet 連結）
- `ClinicalDisclaimer`：頂部 research-use banner
- 紅綠色階：Pathogenic 紅、Benign 灰、VUS 黃
- Reproducibility manifest JSON 匯出

---

## 🔜 v3.0「精準醫學研究工具」（待規劃）

> v2.0 穩定運作 1-2 週後，收集 feedback，再決定哪項先做。

| # | 功能 | 醫學價值 | 工程量 |
|---|------|---------|--------|
| A | 批次查詢（gene list TSV 上傳 → 進度條 → 結果表） | ⭐⭐⭐⭐ | 3-4 天 |
| B | PharmGKB / CPIC 藥物基因體（CPIC 用藥指引 + 證據等級） | ⭐⭐⭐⭐ | 3-4 天 |
| C | PubMed 文獻聯動（rsID → 近 5 篇文獻） | ⭐⭐⭐ | 1-2 天 |
| D | Lollipop plot（蛋白序列變異視覺化，Pathogenic 紅燈） | ⭐⭐⭐ | 3 天 |

**建議節奏**：v2.0 觀察 1-2 週 → 選 A 或 B 作為 v3.0 起點。

---

## 工程紀律（沿用至 v3.0）

### 安全/合規
- 🚨 **PHI 防呆**：輸入框提示「請勿輸入病患姓名/病歷號」；log 只記 gene symbol / rsID
- 🚨 **臨床免責聲明**：UI / CSV / API / README 四處同步
- 🚨 **API key 管理**：OMIM key → env vars，絕不進 git

### 工程
- ✅ TDD：每個 service 先寫單元測試（mock httpx response）
- ✅ 7 天快取：PostgreSQL `gene_cache` / `variant_cache`
- ✅ Rate limiting：slowapi
- ✅ HTTP retry：`@retry_http` from `backend.core.resilience`
- ✅ 每筆外部 API 呼叫記 `accessed_at` + `source_version`

### 不做
- ❌ 臨床診斷推論（永遠停在「分類 + 證據呈現」）
- ❌ 去識別化影像/病歷處理
- ❌ 接 23andMe / 消費級基因平台
- ❌ 即時臨床決策支援

---

## 版本歷史

| 版本 | 日期 | 內容 |
|------|------|------|
| v1.0.0 | 2026-03 | 初版：NCBI/Ensembl/RegulomeDB/Reactome/STRING |
| v1.2.0 | 2026-04 | 穩定版：PostgreSQL cache / rate limiting / OAuth |
| v1.3.0 | 2026-05-01 | ETF_universe 修正（Codex 更新） |
| **v2.0.0** | **2026-05-02** | **臨床級：ClinVar / gnomAD / ACMG / HGVS / OMIM / Orphanet / Manifest** |
