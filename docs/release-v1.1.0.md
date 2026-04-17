# v1.1.0 — 系統一致性與安全補強 (Security & Consistency Patch)

Helix Bio v1.1.0 是一個重要的功能落地與一致性更新版本，主要針對 v1.0.0 中尚未完全同步的查詢限制與歷史追蹤功能進行了全面補全。

## 亮點功能與補正

- 全面一致的每日查詢限制 (Consistent Daily Limits)
  - 將「每日 100 次查詢」限制從單一基因搜尋擴展至 **變體 (Variants)** 與 **路徑 (Pathways)** 查詢端點。
  - 確保所有高資源消耗的搜尋操作都受到統一的配額控管，提升系統安全性。

- 完整搜尋歷史追蹤 (Comprehensive Search History)
  - 搜尋歷史現在能正確記錄變體搜尋的過濾條件（如 CADD, GERP++ 分數）與結果量。
  - 路徑與蛋白質檢索亦已納入歷史紀錄，方便使用者回顧完整的分析路徑。

- 優化的錯誤處理介面 (Enhanced Error Feedback)
  - 前端 `ErrorState` 組件新增對 `429 Too Many Requests` 的專屬處理。
  - 當使用者達到每日 100 次查詢上限時，系統會顯示友善的提示訊息，指引使用者次日再試。

- 後端架構重構 (Backend Refactoring)
  - 將限制與追蹤邏輯抽離為 FastAPI 依賴項 (`check_query_limit`)，降低程式碼耦合度並提升維護性。

## 本版本包含

- 跨模組的查詢限制與歷史紀錄同步。
- 前端 429 錯誤處理 UI。
- 移除開發殘留腳本 (`test_regulome.py`)。
- 提升代碼重用性與系統行為一致性。

## 開發者與部署說明

- 若您是開發者，請注意 `backend/auth/dependencies.py` 中新增的 `check_query_limit` 與 `record_search_history` 邏輯。
- 此版本不涉及資料庫 Schema 變更。

## 適合誰使用

此版本推薦給所有 v1.0.0 的使用者，特別是需要更穩定搜尋配額控管與更完整歷史回顧功能的專業研究人員。
