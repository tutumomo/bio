# v1.3.0 — 臨床級變異分類 (Clinical-Grade Variant Classification)

Helix Bio v1.3.0 將專案從基因與變異瀏覽器升級為臨床遺傳研究工具，新增 ClinVar 臨床意義解讀、gnomAD 族群頻率、HGVS 命名法、自動化 ACMG/AMP 證據摘要。

## Highlights

### ClinVar 致病性 (ClinVar Pathogenicity)

- 來自 ClinVar 的 germline 分類，包含 Pathogenic、Likely pathogenic、VUS、Likely benign、Benign 及衝突解讀等類別。
- Review status 轉換為 0-4 星評級。
- 附帶 OMIM、Orphanet、MedGen、MONDO 等 cross-reference 條件詮釋資料。

### gnomAD 族群頻率 (gnomAD Population Frequency)

- gnomAD r4 rsID 查詢。
- 整體 allele frequency、族群頻率細節與 AF popmax。
- 對不存在於 gnomAD 的變異進行優雅降級處理。

### ACMG/AMP 證據摘要

- 自動化 preliminary 5-tier 分類：Pathogenic、Likely pathogenic、Uncertain significance、Likely benign、Benign。
- 支援九項證據代碼：PVS1、PS3、PM2、PP3、BA1、BS1、BS2、BP4、BP7。
- 變異表格中的 evidence code 彈出視窗與 rationale 說明。

### HGVS 命名法 (HGVS Nomenclature)

- 從 Ensembl VEP 提取 coding HGVS (`hgvsc`) 與 protein HGVS (`hgvsp`)。
- 變異表格與匯出功能現已包含臨床級命名欄位。

## 臨床免責聲明 (Clinical Disclaimer)

> **FOR RESEARCH USE ONLY - Not for clinical diagnosis.**
> 所有變異分類結果應由認證臨床遺傳師審查後方可用於臨床決策。請勿將病患識別資訊（PHI）輸入本系統。

免責聲明顯示於 UI、README 與 CSV/TSV 匯出詮釋資料中。

## 技術變更 (Technical Changes)

- 後端執行環境標準化為 Python 3.11。
- 新增 ClinVar、gnomAD、ACMG 服務模組。
- 在 `variant_cache` 中新增臨床欄位。
- Ensembl VEP 批次大小縮減至 200 以符合目前上游 API 限制。
- 新增 NCBI rate-limit 處理與 gnomAD 批次查詢節流。
- 前端新增 HGVS、ClinVar、gnomAD AF popmax、ACMG tier 欄位。
- 更新 CLAUDE.md 以反映最新架構與 port 配置。

## 遷移 (Migration)

```bash
cd backend
alembic upgrade head
```

此遷移在 `variant_cache` 中新增六個可為空的欄位：`hgvsc`、`hgvsp`、`clinvar_significance`、`clinvar_review_stars`、`gnomad_af_popmax`、`acmg_tier`。

## 驗證 (Verification)

- 後端測試套件：64 passed，1 warning
- 前端型別檢查：`npm run lint` 通過
- ACMG 分類器：12 項離線規則與 tier 對應測試

## 下一階段 (Next)

- v1.4.0：OMIM 疾病關聯、methods 產生、再現性清單。
- v2.0.0：藥物基因組學、批次查詢、PubMed 連結、protein lollipop plots。