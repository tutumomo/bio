---
name: knowledge-workflow
description: "知識工作流編排器 — 根據任務性質自動選擇 graphify（探勘）或 llm-wiki（定居），或串接兩者形成完整的知識生命週期：探勘→沉澱→累積→更新。"
version: 1.0.0
trigger: /knowledge-workflow
author: ETF_Master
license: MIT
metadata:
  hermes:
    tags: [knowledge, workflow, graphify, llm-wiki, research, orchestration]
    category: research
    related_skills: [graphify, llm-wiki, obsidian, arxiv]
---

# 知識工作流編排器（Knowledge Workflow Orchestrator）

智能選擇與串接 graphify 和 llm-wiki 兩個知識工具，讓 agent 知道何時用哪個、怎麼串、怎麼避免重複做工。

---

## 核心原則：探勘 vs 定居

| | Graphify（探勘） | LLM Wiki（定居） |
|---|---|---|
| **比喻** | 地質探勘隊 | 城市建設局 |
| **做什麼** | 自動發現文件之間的隱藏連結、社群結構 | 把已驗證的知識沉澱成可長期維護的 wiki 頁 |
| **何時用** | 拿到新材料、新程式碼庫、一次性的分析任務 | 長期經營的領域、需要持續更新的知識庫 |
| **輸出** | graph.json + HTML 互動圖 + GRAPH_REPORT.md | Markdown 頁面（entities/ concepts/ comparisons/ queries/） |
| **關聯發現** | 自動（AST + 語義雙軌，有信心分數） | 手工 `[[wikilinks]]` + agent 交叉引用 |
| **持久性** | 圖譜可增量更新，但偏分析快照 | 持續累積、可 lint、可審核 |
| **查詢方式** | BFS/DFS 圖遍歷 | search_files + read_file + index.md |

**一句話**：Graphify 發現你不知道的關聯；LLM Wiki 讓你持續累積已知的知識。

---

## 決策樹：何時用哪個？

```
使用者需求
│
├─ 「分析這個程式碼庫/文件夾」 → Graphify 獨立使用
├─ 「找出 X 和 Y 之間的關聯」 → Graphify 獨立使用（query / path）
├─ 「建立/更新我的知識庫」 → LLM Wiki 獨立使用
├─ 「我有新素材，想整理進知識庫」 → 串接流程（先 Graphify 後 Wiki）
├─ 「追蹤某個領域的長期知識」 → LLM Wiki 為主，定期 Graphify 探勘補充
├─ 「比較 A 和 B」 → LLM Wiki（已有頁面）或 Graphify（需要發現新角度）
├─ 「健康檢查我的知識庫」 → LLM Wiki lint
├─ 「視覺化知識結構」 → Graphify（HTML 互動圖）
└─ 「一句話判斷」：
    ├─ 材料是「一堆檔案」→ Graphify 先
    └─ 材料是「一個領域」→ LLM Wiki 先
```

---

## 串接流程：從探勘到定居

### 流程 A：新素材 → 先探勘後定居（最常用）

適用場景：拿到新的一批研究資料、新程式碼庫、新論文集，想同時發現隱藏連結又想長期累積。

**步驟：**

1. **Graphify 探勘**
   ```
   /graphify <素材路徑>
   ```
   - 讓 graphify 自動提取實體、關係、社群結構
   - 產出 `graphify-out/graph.json` 和 `GRAPH_REPORT.md`

2. **閱讀探勘報告，識別有價值的發現**
   ```bash
   read_file graphify-out/GRAPH_REPORT.md
   ```
   - 重點看：社群偵測結果（意想不到的連結）、AMBIGUOUS 邊（需要驗證的推論）、高信心 INFERRED 邊（值得沉澱的發現）

3. **選擇性沉澱到 LLM Wiki**
   - 不是所有圖譜節點都要進 Wiki——只沉澱「已驗證且長期有用」的知識
   - 沉澱判定標準：
     - EXTRACTED 邊（有明確來源）→ 優先沉澱
     - INFERRED 邊（confidence >= 0.8）→ 沉澱但標記為推論
     - AMBIGUOUS 邊 → 不沉澱，待驗證
     - 孤立節點（degree < 2）→ 除非是核心實體，否則不沉澱

4. **寫入 Wiki 頁面**
   - 每個值得沉澱的節點 → 對應一個 concept/ 或 entity/ 頁面
   - 每條值得沉澱的邊 → 對應頁面間的 `[[wikilinks]]`
   - 在頁面的 frontmatter 加上 `graphify_source: true` 標記
   - `graphify_source: true` 不是 frontmatter 的替代品；頁面仍必須滿足 llm-wiki 的基本欄位：`title`、`created`、`updated`、`type`、`tags`、`sources`、`quality`、`source_type`、`domain`
   - 如果 graphify 來源本身無法可靠提供 `quality` / `source_type`，先標成保守值（通常是 `secondary` / `manual`），並在後續 ingest 或 lint 時回填
   - 更新 `index.md` 和 `log.md`

5. **標記已沉澱**
   ```
   在 log.md 記錄：
   ## [日期] ingest | Graphify → Wiki 遷移
   - 來源：graphify-out/GRAPH_REPORT.md
   - 遷移節點：N 個
   - 遷移邊：M 條
   - 跳過（AMBIGUOUS 或孤立）：K 個
   ```

### 流程 B：Wiki 缺乏連結 → 用 Graphify 補充

適用場景：LLM Wiki 頁面很多但交叉引用不足，想發現頁面之間可能存在的隱藏關聯。

**步驟：**

1. **把 Wiki 當素材餵給 Graphify**
   ```
   mkdir -p /tmp/wiki-graphify-corpus
   cp -R ~/wiki/entities ~/wiki/concepts ~/wiki/comparisons ~/wiki/queries /tmp/wiki-graphify-corpus/
   cd /tmp/wiki-graphify-corpus && /graphify .
   ```
   - 不要把兩個路徑直接丟給 `/graphify`；這個技能假設單一 corpus root
   - 目標是只掃描 Wiki 的 Layer 2（`entities/`, `concepts/`, `comparisons/`, `queries/`），避開 `raw/` 和既有 `graphify-out/`

2. **分析圖譜結果**
   - 重點看：graphify 發現了哪些 Wiki 頁面之間的 `semantically_similar_to` 邊
   - 這些是 LLM Wiki 的 wikilinks 遺漏的交叉引用

3. **把有價值的邊補回 Wiki**
   - 每條 `semantically_similar_to` 或 `conceptually_related_to` 邊 → 在對應頁面補上 `[[wikilinks]]`
   - 更新頁面的 `updated` 日期

4. **不需要重複建頁面**——頁面已經存在，只需要補連結

### 流程 C：定期探勘更新

適用場景：Wiki 已穩定運作，但 raw/ 素材逐漸增加，想定期發現新連結。

**步驟：**

1. 對 raw/ 目錄跑 `/graphify <路徑> --update`
2. 比對新發現的邊跟 Wiki 現有頁面
3. 只沉澱「新增的、有價值的」邊到 Wiki
4. 記錄在 log.md

### Flow D：對既有 Wiki 圖譜直接查詢

適用場景：`~/wiki/graphify-out/graph.json` 已經存在，想直接問圖譜問題。

```bash
cd ~/wiki
/graphify query "<question>"
```

- 不要從別的工作目錄對 `~/wiki/graphify-out/graph.json` 傳 `--graph` 絕對路徑；目前 package 會拒絕跳出當前 `graphify-out/` 樹的路徑
- 如果 query 出現 skill/package 版本警告，先刷新 graphify 的平台安裝，再重跑

---

## 避免重複做工的規則

1. **已沉澱的知識不重建**：如果 Wiki 已有某實體的頁面，不要因為 Graphify 又偵測到同一實體就建新頁。改為：
   - 檢查 Wiki index.md 是否已有該實體
   - 如有 → 更新現有頁面（補充新資訊、新連結）
   - 如無 → 建新頁面

2. **Graphify 的 INFERRED 邊不直接進 Wiki**：只有經過人工確認或 EXTRACTED 等級的邊才 `[[wikilink]]` 進 Wiki。INFERRED 邊記錄在頁面的「相關推論」段落，標明來源和信心分數。

3. **Wiki 的 `raw/` 不要餵給 Graphify 重複提取**：因為 raw/ 本身就是不可改的原始檔，Graphify 的結果不應改動 raw/。如果需要對 raw/ 做探勘，結果放在 `graphify-out/`，沉澱結論到 Wiki 的 concepts/ 和 entities/。

4. **同一批素材不要同時跑兩個工具**：先 Graphify → 讀報告 → 再沉澱到 Wiki。順序跑，不要平行跑同一批素材。

---

## ETF 投資領域的特殊考量

當這個工作流用於 ETF / 台股投資研究時：

| 典型任務 | 用哪個 | 說明 |
|----------|--------|------|
| 分析一份新的 ETF 研究報告 | Graphify 先，找出報告裡的關鍵實體和關聯 |
| 追蹤某個 ETF 的長期知識 | LLM Wiki，持續累積該 ETF 的基本面、技術面、新聞 |
| 比較 0050 vs 00878 | LLM Wiki 的 comparisons/ 頁面 |
| 從一堆券商報告中發現隱藏關聯 | Graphify，用社群偵測找跨報告的連結 |
| 定期更新投資知識庫 | 流程 C，對新增 raw/ 跑 Graphify --update，再沉澱 |
| 檢查知識庫是否過時 | LLM Wiki lint，檢查 stale content |

---

## Pitfalls（踩坑記錄）

### 技能目錄結構與發現機制
- **Hermes 技能掃描器的路徑要求**：user-installed skills 放在 `~/.hermes/skills/` 下，但目錄結構（是否需要 category 子目錄如 `research/`）可能影響是否能被掃描到。
- **当前状态**：此技能放在 `~/.hermes/skills/research/knowledge-workflow/SKILL.md`（含 category 子目錄），但 `skill_view()` 和 `skills_list()` 均無法辨識。
- **對照**：graphify 放在 `~/.hermes/skills/graphify/SKILL.md`（flat，無 category 子目錄），同樣不出現在 `skills_list(category="research")`，但出現在 `skill_view` 的 available_skills 列表中。
- **結論**：如果技能無法被掃描到，嘗試移到 flat 結構 `~/.hermes/skills/knowledge-workflow/SKILL.md`，或者在 Hermes config 中手動註冊。
- **YAML frontmatter 格式驗證**：已確認 frontmatter 可正確解析，不是格式問題。

### Graphify 指令依賴
- 此技能引用 `/graphify` 指令，但 graphify 是獨立技能，必須已安裝且可用才能執行串接流程。
- 如果 graphify 未安裝，流程 A/B/C 中的探勘步驟會失敗，需回退到純 LLM Wiki 單獨使用。

### Graphify 單一路徑假設
- `/graphify` 工作流以單一 corpus root 為前提；像 `~/wiki/concepts/ ~/wiki/entities/` 這種多路徑示例不可直接照抄
- 若只想分析 Wiki 的 Layer 2，先把目標子目錄整理到一個暫時目錄，再對那個 root 跑 graphify

### Graphify Query 工作目錄限制
- `graphify query` 會把 graph 路徑限制在當前工作目錄下的 `graphify-out/`
- 查 `~/wiki/graphify-out/graph.json` 時，先 `cd ~/wiki` 再跑 query

### Graphify / Skill 版本漂移
- 如果 CLI 出現 `skill is from graphify X, package is Y`，代表技能文字和 package 已漂移
- 優先更新平台技能安裝，再依新版 package 行為驗證 `query` / `report` / `export` 流程

---

## 觸發條件

使用此技能當：
- 使用者提到「知識庫」、「knowledge base」、「wiki」、「知識圖譜」
- 使用者同時需要分析新素材和長期累積知識
- 使用者問「graphify 和 llm-wiki 我該用哪個」
- 使用者有新材料想整理進現有的知識庫
- 使用者想補充 Wiki 頁面之間的交叉引用
- 任何需要知識管理流程決策的場景

---

## 完整串接指令速查

### 一次探勘 + 沉澱（流程 A）
```bash
# Step 1: 探勘
/graphify <素材路徑>

# Step 2: 讀報告（agent 自動）
read_file graphify-out/GRAPH_REPORT.md

# Step 3-4: 沉澱到 Wiki（agent 依據判定標準執行）
# 更新 index.md, 建立新頁面, 更新 log.md
```

### Wiki 連結補強（流程 B）
```bash
# Step 1: 對 Wiki 二層探勘
/graphify ~/wiki/concepts/ ~/wiki/entities/

# Step 2: 找出 semantically_similar_to 邊
# Step 3: 補上 [[wikilinks]]
```

### 定期更新（流程 C）
```bash
# Step 1: 增量探勘
/graphify ~/wiki/raw/ --update

# Step 2: 比對新發現
# Step 3: 增量沉澱
```
