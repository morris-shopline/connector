# Backlog 目錄說明

> 任務管理，所有進行中/剛完成的任務

---

## 📁 目錄結構

```
backlog/
├── index.md          # 所有任務的總覽
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

### `stories/`
所有 Story（統一管理），包含 Feature Story、Refactor Story、Bug Fix Story。

**文件格式**：
- Feature Story: `story-{epic-id}-{story-seq}-{slug}.md`
- Refactor Story: `story-refactor-{refactor-id}-{story-seq}-{slug}.md`
- Bug Fix Story: `story-issue-{issue-seq}-{slug}.md`
- 子任務: `story-{epic-id}-{story-seq}.{sub-seq}-{slug}.md`

**Story 狀態**：
- `planned` - 規劃中
- `in-progress` - 開發中
- `dev-completed` - 開發完成，等待 User Test
- `user-test-passed` - User Test 通過，觀察中
- `completed` - 已完成

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

**最後更新**: 2025-11-05

