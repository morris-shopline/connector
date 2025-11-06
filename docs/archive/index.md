# Archive Index

> 已完成的任務和棄置的任務

---

## 📚 已歸檔目錄

### 舊 Sprint 記錄（舊方法論）

**位置**: `archive/sprints/`

**說明**: 專案初期使用舊 Sprint 方法論時的詳細實作記錄。新方法論已改用 Run/Epic/Story 體系。

**包含內容**:
- Sprint 0: 基礎架構與 OAuth 授權
- Sprint 1: Bug 修復與架構優化
- Sprint 2: Admin API 測試功能
- Sprint 3: 狀態管理架構重構

**替代方案**: 當前任務管理請使用 `docs/backlog/` 和 `docs/context/current-run.md`

---

## 📚 已歸檔討論文件

### 型別策略相關討論

這些文件是型別定義策略的分析和討論，已確定採用「完全獨立」策略。

- **TYPE_SHARING_ANALYSIS.md** - 型別共享策略分析
  - **歸檔原因**: 型別定義策略已確定為「完全獨立」，此分析文件已結案
  - **替代文件**: `docs/memory/architecture/project-structure.md`

- **TYPE_STRATEGY_COMPARISON.md** - 型別策略深度比較
  - **歸檔原因**: 型別策略比較已完成，已確定採用「完全獨立」策略
  - **替代文件**: `docs/memory/architecture/project-structure.md`

- **AUTO_SYNC_ANALYSIS.md** - 自動化同步方案分析
  - **歸檔原因**: 自動化同步方案經過評估後不採用
  - **替代文件**: `docs/memory/architecture/project-structure.md`

- **TYPE_SYNC_WORKFLOW.md** - 型別同步工作流程
  - **歸檔原因**: 已確定不採用同步機制
  - **替代文件**: `docs/memory/architecture/project-structure.md`

### Sprint 相關討論

- **SPRINT_ADMIN_API_TESTING.md** - Sprint 1 初步規劃文件
  - **歸檔原因**: 文件已遷移至新的文件體系
  - **替代文件**: `archive/sprints/02-admin-api-testing.md`

### 架構相關討論

- **architecture-handle-token-management.md** - Handle/Token 狀態管理架構分析
  - **歸檔原因**: 問題已解決，決策記錄在 `docs/memory/decisions/state-management.md`

- **state-management-strategy-2025-11-04.md** - 狀態管理策略詳細討論
  - **歸檔原因**: 決策已確定，精簡版記錄在 `docs/memory/decisions/state-management.md`

### 其他討論

- **COMPLIANCE_CHECK.md** - Shopline API 合規性檢查
- **LESSONS_LEARNED.md** - 開發過程中的重要學習點

---

## 📁 已歸檔任務

### Closed Epics

| Epic | 完成日期 | 完成 Run | 相關文件 |
|------|----------|----------|----------|
| Epic 0: 基礎架構與 OAuth 授權 | 2025-11-03 | Run 1 | `../backlog/epics/epic-0-foundation.md` |
| Epic 2: Admin API 測試功能 | 2025-01-XX | Run 3 | `../backlog/epics/epic-2-admin-api-testing.md` |

### Closed Refactors

| Refactor | 完成日期 | 完成 Run | 相關文件 |
|----------|----------|----------|----------|
| Epic 1: Bug 修復與架構優化 | 2025-01-XX | Run 2 | `../backlog/epics/epic-1-bug-fix-and-optimization.md` |

### Closed Issues

| Issue | 完成日期 | 完成 Run |
|-------|----------|----------|
| 無 | - | - |

### Abandoned Tasks

| Task | 棄置日期 | 原因 |
|------|----------|------|
| 無 | - | - |

---

## 📝 歸檔原則

### 何時歸檔文件

1. **文件已被新版本取代** - 新文件已建立，舊文件保留作為參考
2. **文件內容已過時** - 文件中的資訊不再符合當前專案狀態
3. **文件結構已重組** - 文件內容已整合到新的文件體系中
4. **文件不再需要** - 功能已移除或不再使用
5. **討論過程已結案** - 討論過程留底，決策已記錄在 `memory/decisions/`

### 歸檔位置

- **討論過程**: `archive/discussions/`
- **已完成任務**: `archive/epics/`, `archive/refactors/`, `archive/issues/`, `archive/stories/`
- **舊 Run 記錄**: `archive/old-runs/`
- **舊 Sprint 記錄**: `archive/sprints/` - 舊方法論下的 Sprint 詳細記錄（已改用新方法論）

---

**最後更新**: 2025-11-05

---

## 📌 備註

已完成的 Epic 和 Story 仍保留在 `backlog/` 目錄中，但狀態標記為 `completed`。這些文件作為歷史記錄和參考，方便後續查閱。
