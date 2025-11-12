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
- **快速收集想法** → `docs/backlog/inbox/`（見下方說明）

**🚨 Run 管理規範（必讀）**：
- Run 完成後必須按照 `docs/reference/guides/RUN_MANAGEMENT.md` 處理 Run 記錄
- 關鍵規則：
  - Run 完成時立即更新 `recent-runs.md`
  - **下一個 Run 開始時**才歸檔 `current-run.md` 到 `archive/old-runs/`
  - `recent-runs.md` 只保留最近 10 個 Run
  - Story 狀態流程：`not-started`（未開始）→ `planning`（規劃中）→ `planned`（Agent 整理完成）→ `ready-for-dev`（用戶確認完成，可安排進 Run）→ `in-development`（開發中）→ `agent-testing`（Agent 自測中）→ `ready-for-user-test`（待 User 驗收）→ `user-test-passed` → `completed`
  - Run 狀態流程：`draft` → `in-progress` → `ready-for-acceptance`（全數 Story 待 User 驗收）→ `in-acceptance` → `accepted` → `closed`
  - 放進 Run 的 Story 必須已達 `ready-for-dev`
  - 正在開發的 Story 未完成 `ready-for-user-test` 前，不得切換至下一個 Story
  - Agent 測試清單需對應實際實作範圍，逐項記錄於 Story 文件並全數勾選後，方可進入 User 驗收階段

**📝 Backlog Inbox 使用（快速收集）**：
- 當用戶說「幫我記一下...」或類似表達時，快速在 `docs/backlog/inbox/` 建立 note
- 使用最小格式記錄，不需要完整 Story 格式
- 後續在適合的時機整理、分類、轉換為正式的 Epic/Story/Issue
- 詳細說明：見 `docs/backlog/inbox/README.md`

---

## 🧭 方法論與核心精神速覽

- **方法論入口**：`docs/memory/methodology.md` 提供完整流程，涵蓋階段識別、文件維護與 Run 執行規範。
- **運作原則入口**：`docs/memory/principles.md` 彙整專案的長期文化與判斷準則，遇到不確定情境時先回到此文件。
- **核心精神摘要**：
  - 文件是 Agent 的記憶，確保每次交接都能還原上下文。
  - 工作目錄僅保留單一權威來源，歷史版本一律歸檔到 `docs/archive/`。
  - Run 前精準規劃（Story 自包含），Run 中嚴格執行驗收，Run 後即時更新與歸檔。
  - 任何架構或流程決策必須留下決策紀錄與檔案軌跡。

---

## 🚨 核心原則（必須遵守）

1. **🚨 Story 文件是唯一權威來源（絕對禁止違反）**：
   - **開發前必須仔細閱讀 Story 文件**，特別是「技術重點與實作要點」和「API 操作摘要」區段
   - **嚴格按照 Story 文件中的 API 操作摘要、參數列表、端點格式實作**
   - **禁止憑經驗或參考其他平台的實作方式**，每個平台都有自己的 API 規範
   - **禁止假設外部平台會配合我們的架構**，必須遵守外部平台的 API 規範
   - **如果 Story 文件中的 API 操作摘要沒有列出某個參數，就不要加入該參數**
   - **如果 Story 文件中的 API 操作摘要明確列出參數，就必須使用這些參數**
   - **實作前必須確認**：Story 文件中的 API 規範、參考文件（如 `NEXTENGINE_API_REFERENCE.md`）是否一致
   - **違反此規範會導致實作不符合外部平台規範，造成無法運作的後果，請務必遵守！**

2. **Story 自包含**：Story 文件包含所有開發所需資訊，開發時不需要再查閱 memory/
3. **記憶優先**：重要決策、架構改變必須記錄到 `memory/decisions/` 或 `memory/architecture/`
4. **Run 完成標準**：完成所有 Agent 可測試項目，列出 User Test 步驟，告知無法自動測試的項目
5. **🚨 文件位置規範（嚴格禁止違反）**：
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
| **🚨 Run 管理規範（必讀）** | `docs/reference/guides/RUN_MANAGEMENT.md` |
| **📝 Backlog Inbox 使用指南** | `docs/backlog/inbox/README.md` |
| **🚨 Shopline OAuth 實作（必讀）** | `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md` |

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
| Story Review（多個相關 Story） | Story Review 階段 | `docs/memory/methodology.md` → 階段 5.7 |
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
3. **🚨 建立 Run 前**：檢查是否有相關的 Story Review 報告（見下方說明）
4. 開發時遵循 Story 文件，完成後更新狀態
5. **Run 完成後**：按照 `docs/reference/guides/RUN_MANAGEMENT.md` 處理 Run 記錄
6. **下一個 Run 開始時**：將已完成的 Run 歸檔到 `docs/archive/old-runs/`

**🚨 Story Review 檢查（建立 Run 前必做）**：
- **檢查位置**：`archive/discussions/review-story-*.md`
- **檢查內容**：
  - 是否有對應的 Review 報告（如果建立多個相關 Story）
  - Review 報告是否已完成（所有問題已修正）
  - Review 報告的結論是否為「準備就緒」
- **如果沒有 Review 報告**：
  - 提醒用戶是否需要進行 Story Review
  - 如果用戶確認不需要，可以繼續建立 Run
- **如果有 Review 報告但未完成**：
  - **必須等待 Review 完成**，確保 Story 完全遵循最新架構要求
  - 提醒用戶完成 Review 流程
- **如果 Review 報告已完成**：
  - 確認所有問題已修正
  - 可以繼續建立 Run

---

## 📚 需要更多資訊？

- **詳細方法論**：`docs/memory/methodology.md`
- **運作原則**：`docs/memory/principles.md`
- **文件體系說明**：`docs/README.md`
- **專案狀態摘要**：`PROJECT_STATUS.md`（root）

---

---

## 🚨 開發流程強制規範（2025-11-12 新增）

### 開發前必做檢查清單

在開始實作任何 Story 之前，**必須完成以下檢查**：

1. **仔細閱讀 Story 文件**：
   - [ ] 閱讀 Story 文件的「技術重點與實作要點」區段
   - [ ] 閱讀 Story 文件的「API 操作摘要」區段（如果有的話）
   - [ ] 閱讀 Story 文件引用的參考文件（如 `NEXTENGINE_API_REFERENCE.md`）
   - [ ] 確認 API 端點、方法、必填參數都已理解

2. **確認 API 規範**：
   - [ ] Story 文件中的 API 操作摘要是否明確列出參數？
   - [ ] 參考文件中的 API 規範是否與 Story 文件一致？
   - [ ] **如果 Story 文件沒有列出某個參數，就不要加入該參數**
   - [ ] **如果 Story 文件明確列出參數，就必須使用這些參數**

3. **禁止事項**：
   - [ ] **禁止參考其他平台的實作方式**（例如：Shopline 支援 state，不代表 Next Engine 也支援）
   - [ ] **禁止假設外部平台會配合我們的架構**
   - [ ] **禁止憑經驗或 OAuth 2.0 標準假設外部平台的行為**
   - [ ] **禁止在 Story 文件沒有明確說明的情況下，自行加入參數或修改 API 格式**

### 實作範例

**❌ 錯誤做法**：
```typescript
// 錯誤：Story 文件明確顯示授權 URL 只支援 client_id 和 redirect_uri
// 但我參考 Shopline 的實作，加入了 state 參數
const params = new URLSearchParams({
  client_id: this.clientId,
  redirect_uri: this.redirectUri,
  state: state,  // ❌ Story 文件沒有列出這個參數！
})
```

**✅ 正確做法**：
```typescript
// 正確：嚴格按照 Story 文件的 API 操作摘要實作
// Story 文件第 63 行明確列出：必填參數只有 client_id 和 redirect_uri
const params = new URLSearchParams({
  client_id: this.clientId,
  redirect_uri: this.redirectUri,
  // ✅ 不加入 state，因為 Story 文件沒有列出
})
```

---

**最後更新**: 2025-11-12
