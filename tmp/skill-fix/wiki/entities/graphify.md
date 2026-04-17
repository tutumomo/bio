---
title: Graphify
created: 2026-04-12
updated: 2026-04-12
type: entity
tags: [知識管理.圖譜, AI工具.提取, AI工具.助理, 比較]
sources: [raw/articles/aivi-graphify-overview-2026.md]
quality: secondary
source_type: articledomain: knowledge.tooling
---


# Graphify

AI coding assistant 的 Skill 插件，核心使命是將任意文件夾中的代碼、文檔、論文、圖片轉化為可查詢的知識圖譜。MIT 開源授權。

## 核心價值

建圖一次後，查詢只消耗原始 token 量的 1/71.5。解決了 LLM 每次都需要重新閱讀整個代碼庫的問題。

## 雙通道提取引擎

| 通道 | 技術 | 開銷 | 支援範圍 |
|------|------|------|---------|
| Channel A | tree-sitter AST 分析 | 零 LLM 開銷 | 15 種程式語言 |
| Channel B | LLM agent | 需要 token | 文檔、圖片 |

## 三級置信度

| 標籤 | 置信度 | 說明 |
|------|--------|------|
| EXTRACTED | 1.0 | 直接從原始碼提取 |
| INFERRED | 0.6-0.9 | LLM 推斷的關聯 |
| AMBIGUOUS | 低 | 模糊或不可靠 |

## 社群偵測

使用 **Leiden 演算法**發現文件間的隱藏連結和社群結構。

## 輸出格式

- HTML（互動圖譜）、JSON（GraphRAG 就緒）、Obsidian Markdown
- 也支援 SVG、GraphML（Gephi/yEd）、Neo4j Cypher

## 進階功能

- **超邊（Hyperedges）**：超越二元關係的多實體關聯
- **設計決策節點**：記錄「為什麼」而非只是「是什麼」
- **Git Hooks** + `--watch` 模式實現自動增量更新
- **深度模式** `--mode deep`：更徹底的提取，更豐富的 INFERRED 邊

## 管線架構

```
detect() → extract() → build_graph() → cluster() → analyze() → report() → export()
```

## OpenClaw 整合

```bash
pip install graphifyy && graphify install --platform claw
```

Skill 定義安裝到 `~/.claw/skills/graphify/SKILL.md`。

## 相關頁面

- [[llm-wiki-模式]] — Graphify 採用的知識管理哲學繼承自 Karpathy 的 LLM Wiki
- [[知識圖譜-vs-RAG]] — 圖譜方法與 RAG 的對比分析
- [[雙通道提取引擎]] — Graphify 的 AST+LLM 雙通道技術詳解