---
title: 風險訊號儀表板
created: 2026-04-11
updated: 2026-04-11
type: concept
tags: [風險, 市場體制, 投資策略]
sources: [ETF_TW/instances/etf_master/state/market_event_context.json]
quality: primary
source_type: dataset
domain: invest.strategy
---


# 風險訊號儀表板

> 即時風險監控頁面。盤中掃描每 30 分鐘更新，盤後收工時做當日總結。此頁是判斷「今天能不能動」的關鍵依據。

## 核心訊號

| 訊號 | 當前值 | 狀態 | 判斷基準 |
|------|--------|------|----------|
| 事件體制 | risk-off | ⚠️ 升温 | risk-on / neutral / risk-off |
| 全球風險 | elevated | ⚠️ 升温 | low / moderate / elevated / high |
| 地緣政治 | high | 🔴 高風險 | low / medium / high |
| 利率風險 | medium | 🟡 中性 | low / medium / high |
| 能源風險 | high | 🔴 高風險 | low / medium / high |
| 台股衝擊 | cautious | ⚠️ 觀望 | positive / neutral / cautious / negative |
| 防守傾向 | high | 🛡️ 偏防守 | low / medium / high |
| 更新時間 | 2026-04-10 18:59 | — | — |

## 活躍風險事件

1. **中東地緣政治風險持續** — 影響全球風險偏好，壓抑科技類表現
2. **能源價格與風險溢價仍偏高** — 推升通膨預期，不利債券型 ETF

## 訊號變動歷史

| 日期 | 變動 | 備註 |
|------|------|------|
| 2026-04-10 | 初版建立 | 從 state market_event_context 初始化 |

## 風險等級對應行動

| 等級 | 市值型 | 高股息 | 債券型 | 現金 |
|------|--------|--------|--------|------|
| low | 積極加碼 | 適度持有 | 減碼 | 極低 |
| moderate | 正常布局 | 正常持有 | 正常配置 | 低 |
| elevated | 觀望為主 | 偏重持有 | 加碼 | 中等 |
| high | 暫停買入 | 維持不動 | 偏重 | 偏高 |
| crisis | 全數迴避 | 設停損 | 最大配置 | 最高 |

## 關聯頁面

- [[market-view]] — 市場體制判讀（風險訊號的決策上游）
- [[家族投資需求]] — 各成員的風險承受度對照
- [[債券型-etf]] — 防守偏重時的首選工具