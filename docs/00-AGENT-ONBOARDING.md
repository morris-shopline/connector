# Agent 快速開始

> 🚨 **新 Agent 必讀**：第一次進入專案時請先閱讀本文件。

---

## 🎯 這是什麼專案？

Shopline API 整合專案，支援 OAuth 授權、Webhook 處理和多商店管理。採用前後端分離架構，前端 Next.js + 後端 Fastify。

**專案願景**：從單一平台基礎整合，逐步發展為多平台、多租戶的企業級資料流整合平台。

---

## ⚡ 快速開始（3 步驟）

### 1. 了解當前狀態

```bash
# 讀取當前 Run（如果有）
docs/context/current-run.md

# 讀取最近 Run 摘要
docs/context/recent-runs.md

# 讀取任務總覽
docs/backlog/index.md
```

### 2. 理解工作方式

- **開發單位**：Run（20 分鐘內完成 1-3 個 Story）
- **驗收方式**：User 在 browser 中測試
- **文件是記憶**：重要資訊必須寫入 `memory/`，否則下個 Agent 會遺漏

### 3. 開始工作

根據對話內容識別階段，然後查看對應指引：
- 開發 Run → `docs/context/current-run.md` 或 `docs/backlog/stories/`
- 建立 Story → 見 `docs/memory/methodology.md` 的「Story 建立階段」
- 討論決策 → 見 `docs/memory/methodology.md` 的「決策記錄階段」

---

## 🚨 核心原則（必須遵守）

1. **Story 自包含**：Story 文件包含所有開發所需資訊，開發時不需要再查閱 memory/
2. **記憶優先**：重要決策、架構改變必須記錄到 `memory/decisions/` 或 `memory/architecture/`
3. **Run 完成標準**：完成所有 Agent 可測試項目，列出 User Test 步驟，告知無法自動測試的項目
4. **🚨 文件位置規範（嚴格禁止違反）**：
   - **絕對禁止**在 `docs/` root 層級創建任何文件
   - 所有文件必須放在對應的目錄下：
     - 討論留底 → `archive/discussions/`
     - 任務管理 → `backlog/`（epics/, stories/, issues/, refactors/）
     - 當前上下文 → `context/`
     - 核心記憶 → `memory/`（decisions/, architecture/）
     - 參考資料 → `reference/`（guides/, platform-apis/, design-specs/）
   - 如果不確定文件應該放在哪裡，**先查閱** `docs/README.md` 或 `docs/memory/methodology.md`
   - 違反此規範會導致文件體系混亂，請務必遵守！

---

## 📁 關鍵文件位置

| 需要... | 查看文件 |
|---------|---------|
| 了解專案願景和路線圖 | `docs/memory/vision.md`, `docs/memory/roadmap.md` |
| 了解系統架構 | `docs/memory/architecture/current.md` |
| 了解重要決策 | `docs/memory/decisions/` |
| 查看當前任務 | `docs/context/current-run.md` |
| 查看所有任務 | `docs/backlog/index.md` |
| 了解詳細方法論 | `docs/memory/methodology.md` |
| 了解運作原則 | `docs/memory/principles.md` |

---

## 🔄 階段識別（快速判斷要做什麼）

根據對話內容，快速識別階段：

| 對話內容 | 階段 | 關鍵文件 |
|---------|------|---------|
| 討論專案要做什麼 | 開案階段 | `docs/memory/vision.md` |
| 討論要先做什麼再做什麼 | 開案階段 | `docs/memory/roadmap.md` |
| 討論技術選型、架構設計 | 架構規劃階段 | `docs/memory/architecture/` |
| 從 roadmap 規劃功能階段 | Epic 規劃階段 | `docs/backlog/epics/` |
| 準備 Story 詳細資訊 | Story 建立階段 | `docs/memory/methodology.md` → 階段 5 |
| 開始開發功能 | 開發 Run 階段 | `docs/context/current-run.md`, `docs/backlog/stories/` |
| 發現問題要修復 | Issue 處理 | `docs/backlog/issues/` |
| 需要重構 | 重構階段 | `docs/backlog/refactors/` |

**詳細階段指引**：見 `docs/memory/methodology.md` 的「階段識別與流程指引」

---

## 🎯 專案生命週期

### 當前階段：日常運作階段

**特徵**：
- 已有完整的方法論和文件體系
- 使用 Run/Epic/Story 體系管理任務
- 持續迭代開發新功能

**你應該做的事**：
1. 查看 `docs/context/current-run.md` 確認是否有進行中的 Run
2. 如果有，接續完成；如果沒有，等待用戶指示開始新的 Run
3. 開發時遵循 Story 文件，完成後更新狀態

---

## 📚 需要更多資訊？

- **詳細方法論**：`docs/memory/methodology.md`
- **運作原則**：`docs/memory/principles.md`
- **文件體系說明**：`docs/README.md`
- **專案狀態摘要**：`PROJECT_STATUS.md`（root）

---

**最後更新**: 2025-11-05
