---
title: 知識圖譜 vs RAG
created: 2026-04-12
updated: 2026-04-12
type: comparison
tags: [知識管理.圖譜, 知識管理.RAG, 知識管理.方法論, 比較]
sources: [raw/specs/karpathy-llm-wiki-gist-2026.md, raw/articles/aivi-graphify-overview-2026.md]
quality: primary
source_type: specdomain: knowledge.tooling
---


# 知識圖譜 vs RAG：兩種知識管理範式

知識圖譜（如 [[graphify]]）和 RAG（Retrieval-Augmented Generation）是兩種讓 LLM 存取外部知識的主要方法。它們有不同的哲學和適用場景。

## 核心差異

| 維度 | 知識圖譜 | RAG |
|------|---------|-----|
| **知識結構** | 節點+邊的圖結構，保留關係 | 向量嵌入，語義相似度 |
| **查詢方式** | BFS/DFS 圖遍歷，最短路徑 | 向量相似度搜索 top-k |
| **持久性** | 建構一次，跨 session 持久 | 每次查詢重新檢索 |
| **Token 效率** | 只讀相關子圖（1/71.5 原始量） | 每次注入相關段落 |
| **可審核性** | 每條邊有置信度標籤 | 向量相似度分數，較不直覺 |
| **意外發現** | 社群偵測發現非顯見連結 | 依賴查詢品質，不會主動發現 |
| **維護成本** | 需要 lint 和一致性檢查 | 索引自動更新，維護較簡單 |

## 選擇指南

### 用知識圖譜當…

- 需要跨文件發現隱藏關聯（社群偵測）
- 需要持久化、可複利的知識累積
- 需要可審核的置信度（EXTRACTED vs INFERRED vs AMBIGUOUS）
- 代碼庫理解、論文語料分析
- 知識需要長期維護和更新

### 用 RAG 當…

- 需要快速搭建，不需持久化
- 知識庫變動頻繁，不適合維護圖結構
- 只需要語義搜索，不需要關係推理
- 短期問答場景

## 混合策略：從圖譜到 Wiki

最佳的知識管理流程可能是兩者的結合（參考 `知識管理.方法論`）：

1. **Graphify 探勘**：用圖譜發現隱藏連結和社群結構
2. **選擇性沉澱**：只把 EXTRACTED 和高信心 INFERRED 邊沉澱到 wiki
3. **LLM Wiki 定居**：在 wiki 中長期維護已驗證的知識

## 相關頁面

- [[graphify]] — 知識圖譜工具
- [[llm-wiki-模式]] — LLM Wiki 的完整概念
- [[andrej-karpathy]] — LLM Wiki 提出者
- [[雙通道提取引擎]] — Graphify 結合 AST 和語義提取