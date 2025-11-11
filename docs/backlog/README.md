# Backlog 目錄說明

> 任務管理，所有進行中/剛完成的任務

---

## 📁 目錄結構

```
backlog/
├── index.md          # 所有任務的總覽
├── inbox/            # 📝 收集區（快速收集想法，待整理）
├── epics/            # Feature Epics
├── refactors/        # 重構任務
├── issues/           # Bug/Issue 追蹤
└── stories/          # 所有 Story（統一管理）
```

---

## 📋 文件說明

### `index.md`
所有任務的總覽，快速查看所有 Epic、Refactor、Issue、Story 的狀態。

**何時查看**：
- 查詢當前狀態時
- 了解整體任務進度時

---

### `epics/`
Feature Epics，對應 Roadmap 的階段目標。

**文件格式**：`epic-{id}-{slug}.md`

**包含內容**：
- Epic 描述
- 對應的 Roadmap 階段
- Stories 列表（狀態追蹤）
- 依賴關係

**需要更多資訊？**
- Epic 規劃流程：見 `docs/memory/methodology.md` 的「階段 3: Epic 規劃階段」

---

### `refactors/`
重構任務，架構調整但不改變功能。

**文件格式**：`refactor-{id}-{slug}.md`

**包含內容**：
- 重構目標和範圍
- Stories 列表
- 相關決策

---

### `issues/`
Bug/Issue 追蹤。

**文件格式**：`issue-{date}-{seq}.md`

**包含內容**：
- 問題描述
- 重現步驟
- 預期行為
- 解決方案
- 相關 Story

**需要更多資訊？**
- Issue 開立時機：見 `docs/memory/methodology.md` 的「Issue 開立時機詳解」

---

### `inbox/`
快速收集區，用於收集臨時想法、功能建議、優化點子。

**用途**：
- 快速記錄想法，不需要完整格式
- 不影響現有 backlog 結構
- 後續在適合的時機整理、分類、轉換為正式的 Story/Epic/Issue

**文件格式**：`note-{date}-{seq}.md`

**狀態**：
- `collected` - 剛收集，尚未整理
- `reviewed` - 已檢視，準備轉換
- `converted` - 已轉換為正式的 Epic/Story/Issue
- `archived` - 已處理或棄置

**需要更多資訊？**
- Inbox 使用流程：見 `docs/backlog/inbox/README.md`

---

### `stories/`
所有 Story（統一管理），包含 Feature Story、Refactor Story、Bug Fix Story。

**文件格式**：
- Feature Story: `story-{epic-id}-{story-seq}-{slug}.md`
- Refactor Story: `story-refactor-{refactor-id}-{story-seq}-{slug}.md`
- Bug Fix Story: `story-issue-{issue-seq}-{slug}.md`
- 子任務: `story-{epic-id}-{story-seq}.{sub-seq}-{slug}.md`

**Story 狀態**：
- `not-started` - Story 尚未開始規劃，文件尚未建立
- `planning` - Story 開始規劃，Agent 正在整理資訊
- `planned` - Agent 整理完一輪，Story 文件已建立（但尚未經過用戶確認）
- `ready-for-dev` - 用戶確認沒問題，可以開始開發
- `in-development` - 開發中
- `agent-testing` - Agent 正在執行功能測試
- `ready-for-user-test` - Agent 測試完成，等待 User Test
- `user-test-passed` - User Test 通過，觀察中
- `completed` - 已完成

**狀態轉換流程**：
```
not-started → planning → planned → ready-for-dev → in-development → agent-testing → ready-for-user-test → user-test-passed → completed
```

**包含內容**：
- Story 描述
- 驗收標準（Agent 功能測試 + User Test）
- User Test 預期步驟
- 技術需求
- 關鍵資訊（預先整理，包含 sample code）
- 參考資料（來源 ref）
- 實作進度
- Agent 測試結果
- User Test 結果

**需要更多資訊？**
- Story 建立流程：見 `docs/memory/methodology.md` 的「階段 5: Story 建立階段」
- Story 自包含設計：見 `docs/memory/methodology.md` 的「Story 自包含設計」

---

## 🔄 任務移動流程

任務完成後：
1. Story 狀態 `completed`
2. 觀察 1-2 個 Run
3. 確認無問題
4. 移動到 `docs/archive/` 對應目錄

---

---

## 🔄 Backlog 工作流程

### 快速收集（Inbox）

**時機**：用戶隨時想到功能、優化、問題

**流程**：
1. 在 `backlog/inbox/` 建立 note 文件
2. 使用最小格式快速記錄
3. 標記類型（Feature/Optimization/Refactor/Bug/Question）
4. 狀態：`collected`

**詳細說明**：見 `docs/backlog/inbox/README.md`

---

### 定期整理（Inbox → 正式任務）

**時機**：
- 定期（例如：每週或每幾個 Run）
- 在規劃新 Epic/Story 時
- 用戶明確要求整理時

**流程**：
1. 讀取所有 `backlog/inbox/` 中的 note
2. 分類整理：
   - 轉換為 Epic（如果夠大）
   - 轉換為 Story（如果可以直接實作）
   - 轉換為 Issue（如果是 Bug）
   - 合併到現有 Epic/Story（如果屬於現有任務）
   - 棄置（如果不需要了）
3. 更新 note 的「後續處理」欄位
4. 將已處理的 note 移動到 `archive/inbox/processed/`

**詳細說明**：見 `docs/backlog/inbox/README.md`

---

## 📚 相關文件

- **Inbox 使用指南**：`docs/backlog/inbox/README.md`
- **Run 管理規範**：`docs/reference/guides/RUN_MANAGEMENT.md`

---

**最後更新**: 2025-11-06

