# Wiki Log — 台灣 ETF 投資知識庫

> 所有 wiki 動作的時間序列記錄。僅追加，不刪改。
> 格式：`## [YYYY-MM-DD] action | subject`
> 動作：ingest, update, query, lint, create, archive, delete
> 超過 500 筆時輪替：改名為 log-YYYY.md，重新開始。

## [2026-04-11] create | Wiki initialized
- Domain: 台灣 ETF 投資知識庫
- 基礎結構建立：SCHEMA.md, index.md, log.md
- 目錄：raw/, entities/, concepts/, comparisons/, queries/, raw/articles/, raw/data/, raw/papers/, raw/assets/

## [2026-04-11] ingest | etf_universe_tw.json 初始攝入
- 來源：raw/data/etf_universe_tw.json（325 檔 ETF，213 TWSE + 112 TPEX）
- 新增 15 個實體頁（entities/）：0050, 0051, 0056, 006204, 006208, 00679B, 00687B, 00713, 00772B, 00830, 00878, 00881, 00891, 00919, 00929
- 新增 5 個概念頁（concepts/）：市值型, 高股息, 債券型, 產業型, 發行商生態, 家族投資需求
- 新增 3 個比較頁（comparisons/）：0050-vs-006208, 0056-vs-00878-vs-00929, 00679B-vs-00687B
- 共計 24 個頁面建立

## [2026-04-12] ingest | Graphify & Karpathy LLM Wiki | type: article+spec | quality: secondary+primary

- 來源1：raw/articles/aivi-graphify-overview-2026.md（article / secondary — 第三方產品介紹頁）
- 來源2：raw/specs/karpathy-llm-wiki-gist-2026.md（spec / primary — Karpathy 原始 Gist）
- 新增 2 個實體頁：graphify, andrej-karpathy
- 新增 3 個概念頁：llm-wiki-模式, 雙通道提取引擎, 知識圖譜-vs-RAG（comparison）
- 更新 SCHEMA.md：新增「知識工具標籤」和「人物」分類
- 建立 _meta/classification.md：分類日誌首次建立
- 建立新目錄：raw/specs/, raw/datasets/, raw/news/, raw/transcripts/, _meta/, _archive/
- 更新 index.md：頁面數 27 → 32

## [2026-04-12] lint | mirrored wiki remediation
- 補齊 pages 的 `quality`、`source_type`、`domain` frontmatter
- 修正 5 個 broken wikilinks
- 補上 `decision-chain` 與 `etf-發行商生態` 的 inbound links

