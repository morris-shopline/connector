# Run 管理規範

> 🚨 **Agent 必讀**：Run 完成後必須按照此規範處理 Run 記錄，確保文件管理的一致性。

---

## 📋 Run 生命週期

### Run 的完整生命週期

```
建立 Run → 開發中 → 完成 → 歸檔
    ↓         ↓        ↓        ↓
current-run.md  →  →  →  archive/old-runs/
recent-runs.md  (更新)   (更新)
```

---

## 🚨 建立 Run 前的檢查流程

### Story Review 檢查（重要）

**在建立 Run 前，必須檢查是否有相關的 Story Review 報告**：

1. **檢查位置**：`archive/discussions/review-story-*.md`

2. **檢查時機**：
   - 當要開始開發多個相關 Story 時（例如：Story 3.1-3.4）
   - 當 Story 涉及架構變更時
   - 當 Story 涉及多個系統整合時

3. **檢查內容**：
   - 是否有對應的 Review 報告
   - Review 報告是否已完成（所有問題已修正）
   - Review 報告的結論是否為「準備就緒」

4. **處理方式**：
   - **如果沒有 Review 報告**：
     - 提醒用戶是否需要進行 Story Review
     - 如果用戶確認不需要，可以繼續建立 Run
   - **如果有 Review 報告但未完成**：
     - **必須等待 Review 完成**，確保 Story 完全遵循最新架構要求
     - 提醒用戶完成 Review 流程
   - **如果 Review 報告已完成**：
     - 確認所有問題已修正
     - 可以繼續建立 Run
     - 在 Run 文件中記錄相關 Review 報告的位置和狀態

5. **Review 報告存放位置**：
   - `archive/discussions/review-story-{id}-{slug}.md`
   - 命名規範：
     - 一般 Review：`review-story-{id}-{slug}.md`
     - TPM 技術檢視：`tpm-review-story-{id}-{slug}.md`

**詳細 Review 流程**：見 `docs/memory/methodology.md` 的「階段 5: Story 建立階段」→「Story Review 流程」

---

## 🔄 Run 完成後的處理流程

### 步驟 1: 更新 Run 狀態

在 `context/current-run.md` 中：
1. 標記 Run 狀態為 `completed`
2. 記錄完成時間
3. 記錄所有 Story 的完成狀態
4. 記錄測試結果（Agent 測試 + User Test）

### 步驟 2: 更新 recent-runs.md

**更新時機**：每次 Run 完成時立即更新

**更新內容**：
1. 在 `recent-runs.md` 的 Run 列表最上方新增完成的 Run
2. 包含 Run 的基本資訊：
   - Run ID
   - 類型（Feature/Refactor/Bug Fix）
   - 狀態（completed）
   - 開始時間、完成時間
   - 完成的 Stories 清單
   - 測試結果摘要
   - 推上線狀態

**維護規則**：
- **保留數量**：最近 10 個 Run（超過 10 個時，移除最舊的）
- **更新頻率**：每次 Run 完成時立即更新
- **調閱時機**：
  - Agent 開始工作時（快速了解上下文）
  - 接續閒置的 Run 時（了解最近進度）
  - 查詢專案狀態時（了解最近完成的工作）

### 步驟 3: 歸檔 current-run.md

**歸檔時機**：**下一個 Run 開始時**（不是完成時立即歸檔）

**歸檔流程**：
1. **下一個 Run 開始前**：
   - 將 `context/current-run.md` 移動到 `docs/archive/old-runs/`
   - 檔案名稱：`run-{date}-{seq}.md`（保持原 Run ID）
   - 例如：`run-2025-11-05-01.md`

2. **建立新的 current-run.md**：
   - 清空 `context/current-run.md`
   - 建立新的 Run 記錄

**為什麼不在完成時立即歸檔？**
- 方便 Agent 在 Run 完成後立即查看完整記錄
- 避免在更新 recent-runs.md 時需要重新讀取檔案
- 確保下一個 Run 開始時有明確的歸檔觸發點

### 步驟 4: 更新相關文件

**更新 Story 狀態**：
- 將 Story 狀態更新為 `dev-completed` 或 `completed`
- 記錄測試結果

**更新 Epic/Refactor/Issue**：
- 更新對應的 Epic/Refactor/Issue 進度
- 更新 `backlog/index.md` 的狀態

---

## 📁 Run 文件的位置

### current-run.md

**位置**：`docs/context/current-run.md`

**用途**：
- 當前正在進行的 Run（如果有的話）
- Agent 開始工作時首先查看的文件

**內容**：
- Run ID、類型、狀態
- 目標任務（Epic/Refactor/Issue）
- 要完成的 Stories
- 當前進度
- 測試結果
- User Test 步驟

**更新時機**：
- Run 開始時：建立新的 Run 記錄
- Run 進行中：更新進度
- Run 完成時：標記完成狀態、記錄測試結果
- **下一個 Run 開始時**：歸檔到 `archive/old-runs/`

### recent-runs.md

**位置**：`docs/context/recent-runs.md`

**用途**：
- 最近 10 個 Run 的摘要
- Agent 快速了解最近的工作進度

**內容**：
- Run 列表（按時間倒序，最新的在最上面）
- 每個 Run 的基本資訊：
  - Run ID、類型、狀態
  - 開始時間、完成時間
  - 完成的 Stories
  - 測試結果摘要
  - 推上線狀態

**更新時機**：
- **每次 Run 完成時立即更新**

**維護規則**：
- **保留數量**：最近 10 個 Run
- **超過 10 個時**：移除最舊的 Run 記錄（不移除檔案，只從列表中移除）

### archive/old-runs/

**位置**：`docs/archive/old-runs/`

**用途**：
- 保存所有已完成的 Run 完整記錄
- 作為歷史記錄供查閱

**檔案命名**：
- 使用原 Run ID：`run-{date}-{seq}.md`
- 例如：`run-2025-11-05-01.md`

**歸檔時機**：
- **下一個 Run 開始時**（不是完成時）
- 從 `context/current-run.md` 移動到 `archive/old-runs/`

---

## 🔍 Agent 執行 Run 完成流程的檢查清單

當 Run 完成時，Agent 必須完成以下步驟：

### ✅ Run 完成檢查清單

- [ ] 更新 `context/current-run.md`：
  - [ ] 標記狀態為 `completed`
  - [ ] 記錄完成時間
  - [ ] 記錄所有 Story 的完成狀態
  - [ ] 記錄測試結果（Agent 測試 + User Test）
  - [ ] 列出 User Test 步驟（如果有的話）

- [ ] 更新 `docs/context/recent-runs.md`：
  - [ ] 在列表最上方新增完成的 Run
  - [ ] 包含 Run 的基本資訊（ID、類型、狀態、時間、Stories、測試結果）
  - [ ] 如果超過 10 個 Run，移除最舊的記錄

- [ ] 更新 Story 狀態：
  - [ ] 更新所有完成的 Story 狀態為 `dev-completed` 或 `completed`
  - [ ] 記錄測試結果到 Story 文件

- [ ] 更新 Epic/Refactor/Issue：
  - [ ] 更新對應的 Epic/Refactor/Issue 進度
  - [ ] 更新 `docs/backlog/index.md` 的狀態

- [ ] **下一個 Run 開始時**：
  - [ ] 將 `context/current-run.md` 移動到 `docs/archive/old-runs/`
  - [ ] 建立新的 `context/current-run.md` 記錄

---

## 🚨 常見錯誤

### ❌ 錯誤 1: Run 完成時立即歸檔

**錯誤做法**：
- Run 完成時立即將 `current-run.md` 移動到 `archive/old-runs/`

**正確做法**：
- Run 完成時只更新狀態，不歸檔
- **下一個 Run 開始時**才歸檔

### ❌ 錯誤 2: 忘記更新 recent-runs.md

**錯誤做法**：
- Run 完成後只更新 `current-run.md`，忘記更新 `recent-runs.md`

**正確做法**：
- **每次 Run 完成時立即更新 `recent-runs.md`**

### ❌ 錯誤 3: recent-runs.md 保留太多 Run

**錯誤做法**：
- 無限制地保留所有 Run 記錄

**正確做法**：
- 只保留最近 10 個 Run
- 超過 10 個時，移除最舊的記錄

### ❌ 錯誤 4: 歸檔時改變檔案名稱

**錯誤做法**：
- 歸檔時改變 Run ID 或檔案名稱

**正確做法**：
- 使用原 Run ID 作為檔案名稱
- 例如：`run-2025-11-05-01.md` → `archive/old-runs/run-2025-11-05-01.md`

---

## 📚 相關文件

- **Run 開發流程**：見 `docs/memory/methodology.md` 的「階段 6: 開發 Run 階段」
- **Context 目錄說明**：見 `docs/context/README.md`
- **Archive 目錄說明**：見 `docs/archive/README.md`

---

**最後更新**: 2025-11-06  
**維護者**: 專案團隊

