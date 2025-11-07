# Refactor 3: Connection 基礎重構（Phase 1.2 前置）

**狀態**: ⏳ planned  
**對應 Roadmap**: Phase 1.2 之前的基礎架構調整  
**開始日期**: -

---

## Refactor 描述

為了支援多平台 × 多帳戶的 Connection 架構，需在進入 Epic 4 之前完成核心重構：

- 以「Connection（platform × account）」取代既有的單一商店模型
- 重整資料庫 schema、服務層與前端狀態管理
- 修復已知的 Connection 相關 Issue，建立統一錯誤處理流程

此重構完成後，Epic 4 才能基於新的 Connection 架構擴充 UI 與權限管理。

**主要決策依據**：
- `docs/memory/decisions/connection-data-model.md`
- `docs/memory/decisions/connection-state-sync.md`
- `docs/memory/decisions/token-lifecycle-handling.md`

---

## Stories

### ⏳ Story R3.0: Connection 資料模型與 Migration
- **狀態**: planned
- **描述**: 實作 `integration_accounts`、`connection_items`、`platform_apps`（可選）等資料表，完成資料遷移與 Repository 調整
- **文件**: `docs/backlog/stories/story-r3-0-connection-data-model.md`
- **相關 Issue**: 無（新重構）

### ⏳ Story R3.1: Connection 狀態同步與 URL 單一來源
- **狀態**: planned
- **描述**: 導入 Router 事件驅動的 Connection 選取策略，整合 Refactor 1 未完成的狀態清理任務
- **文件**: `docs/backlog/stories/story-r3-1-connection-state-sync.md`
- **相關 Issue**: `issue-2025-11-06-001`

### ⏳ Story R3.2: Token Lifecycle 與重新授權流程
- **狀態**: planned
- **描述**: 標準化 token/Session 錯誤碼，建立前端提醒與重新授權流程，修復誤登出問題
- **文件**: `docs/backlog/stories/story-r3-2-token-lifecycle.md`
- **相關 Issue**: `issue-2025-11-07-001`

---

## 前置條件
- 架構決策文件已完成（見上方連結）
- 與產品/營運確認短期專注於 Shopline + Next Engine 兩個平台

## Dependencies
- Refactor 1 必須完成必要的狀態管理底層（R1 系列）
- Run 資料庫備份機制需可用，以應對 Migration 造成的風險

## 風險與備註
- Migration 涉及現有 `stores` 表重命名；須先在 staging 演練
- 前端切換到 Connection 模式時，需確保既有頁面（Webhooks、Admin API 測試）流程不受影響
- 完成此重構前，Epic 4、Epic 5 應維持 blocked 狀態

---

**最後更新**: 2025-11-07


