---
title: 市場體制判讀
created: 2026-04-11
updated: 2026-04-11
type: concept
tags: [投資策略, 風險, 市場體制]
sources: [ETF_TW/instances/etf_master/state/market_context_taiwan.json]
quality: primary
source_type: dataset
domain: invest.strategy
---


# 市場體制判讀

> 這是智慧體「知識→行動」決策鏈的核心頁面。每次盤勢掃描後更新此頁，讓未來的決策有上下文可循。

## 當前體制判定

| 欄位 | 值 |
|------|------|
| 體制狀態 | cautious（謹慎） |
| 風險溫度 | elevated（升溫） |
| 核心偏重 | medium（中立） |
| 收益偏重 | medium（中立） |
| 防守偏重 | high（偏重） |
| 更新時間 | 2026-04-10 18:59 |

## 體制定義

| 體制 | 條件 | 建議行為 |
|------|------|----------|
| bullish | 多數ETF站上月線，外資持續買超，VIX < 20 | 加碼市值型，維持收益型 |
| cautious | 混合訊號，外資縮量，VIX 20-25 | 分批布局，提高防守部位 |
| bearish | 多數ETF跌破月線，外資持續賣超，VIX > 25 | 減碼市值型，強化債券型 |
| crisis | 極端事件（系統性風險），VIX > 35 | 現金為王，暫停買入 |

## 當前驅動因子

1. **地緣政治**：中東風險持續，影響風險偏好
2. **能源價格**：能源風險偏高，壓抑市場情緒
3. **外資動向**：觀察中（需即時數據補充）

## 體制轉換觸發條件

- `cautious → bullish`：外資連3日買超 + 加權指數站回月線 + VIX < 20
- `cautious → bearish`：外資連3日賣超 + 跌破季線 + VIX > 25
- 任何體制 → `crisis`：VIX > 35 或系統性事件（如戰爭、金融機構倒閉）

## 關聯頁面

- [[risk-signal]] — 風險訊號儀表板
- [[家族投資需求]] — 各成員在不同體制下的配置建議
- [[高股息-etf]] — 防守偏重時的核心選項
- [[市值型-etf]] — 多頭偏重時的成長引擎

## 上下文

- [[decision-chain]] — 體制判讀在整條知識→行動鏈中的位置
