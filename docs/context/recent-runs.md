# Recent Runs

> 最近 10 個 Run 的摘要，幫助 Agent 快速了解上下文

---

## Run 列表

### 🟡 Run 2025-11-12-02: Epic 5 Next Engine 多平台 MVP（草稿）

**Run ID**: run-2025-11-12-02  
**類型**: Feature Development (Epic 5)  
**狀態**: 🟡 draft  
**開始時間**: 2025-11-12  

**Stories**:
- [Story 5.1: Next Engine OAuth Flow 與 Platform Adapter](../backlog/stories/story-5-1-next-engine-oauth.md) 🟡 draft
- [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](../backlog/stories/story-5-2-next-engine-connection-data.md) ⚪ pending
- [Story 5.3: 前端 Connection UX 延伸與重新授權整合](../backlog/stories/story-5-3-next-engine-ux.md) ⚪ pending
- [Story 5.4: Shopline Platform Adapter 重構](../backlog/stories/story-5-4-shopline-adapter-refactor.md) ⚪ pending
- [Story 5.5: Next Engine 庫存與倉庫 API 補強](../backlog/stories/story-5-5-next-engine-inventory-apis.md) ⚪ pending

**目前進度**:
- 完成 Next Engine 平台設計規格、環境變數設定與 sandbox 憑證紀錄（已寫入 `.env` / Render 指引）。
- Story 規劃已完成，可依序啟動 5.1 → 5.3；5.4 / 5.5 暫緩至第一輪 User Test 後再評估。

**待辦**:
- Agent 完成 5.1～5.3 的自動化測試並更新錯誤碼映射與 Activity Dock 事件。
- Human 依 User Test 清單實際走一次 OAuth / 重新授權體驗。

---

### ✅ Run 2025-11-12-01: Epic 4 Connection 管理體驗（Story 4.1-4.3）

**Run ID**: run-2025-11-12-01  
**類型**: Feature Development (Epic 4)  
**狀態**: ✅ closed  
**開始時間**: 2025-11-12  
**完成時間**: 2025-11-12  
**User Test 完成時間**: 2025-11-12

**Stories**:
- [Story 4.1: Connection Dashboard 與列表體驗](../backlog/stories/story-4-1-connection-dashboard.md) ✅ completed
- [Story 4.2: Connection 建立與重新授權工作流](../backlog/stories/story-4-2-connection-workflow.md) ✅ completed
- [Story 4.3: Connection 層級權限與端點保護](../backlog/stories/story-4-3-connection-security.md) ✅ completed

**完成內容**:
- ✅ Story 4.1: Connection Dashboard 與列表體驗
  - 取代 `pages/index.tsx`，新建 `pages/connections/index.tsx` 搭載 `PrimaryLayout`
  - 新增 `PrimaryNav`、`ContextBar`、`ActivityDock(空態)`、`ConnectionRail`、`Overview` 元件
  - 串接 `/api/connections`，顯示狀態徽章、空態、預覽列表
  - `/` redirect 至 `/connections`，Header 導覽同步
- ✅ Story 4.2: Connection 建立與重新授權工作流
  - Flow C2：新增 Connection（平台選擇 → OAuth → 回前端刷新）
  - Flow C3：重新授權流程（Modal + OAuth + Activity 記錄）
  - Flow C4：停用 / 啟用 Connection Item
  - Toast / Activity Dock 事件暫以前端狀態寫入（為 4.3 打底）
  - UI 層級優化：Primary Nav 圖標式、Global Header 簡化（GA4 風格）
- ✅ Story 4.3: Connection 層級權限與端點保護
  - Prisma `integration_audit_logs` model 與 migration
  - Audit Log Repository 建立
  - `requireConnectionOwner` middleware 實作
  - API routes 保護（`/api/connections`, `/api/connection-items/:id`, `/api/connections/:connectionId/logs`）
  - OAuth callback 寫入審計記錄（connection.create, connection.reauthorize）
  - Connection Item 狀態更新寫入審計記錄（connection_item.enable, connection_item.disable）
  - Activity Dock 從後端 `/api/audit-logs` 讀取資料
  - Webhook 安全驗證加強（connectionItemId 綁定與 userId 驗證）
  - 編譯測試通過

**測試結果**:
- ✅ Agent 功能測試：所有 Story 通過
- ✅ User Test：已完成（2025-11-12）
  - ✅ 登入後首頁 (`/connections`) 顯示新架構
  - ✅ 新增 Connection Flow 正常運作
  - ✅ 重新授權流程正常
  - ✅ 停用 / 啟用 Connection Item 正常
  - ✅ 安全驗證正常
  - ✅ Shopline OAuth Flow Regression 測試通過

**相關文件更新**:
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`（註記 Primary Layout、Activity Dock 實作完成）
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`（補充執行畫面與行為備註）
- `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`（新增登入限制與審計流程）

**推上線狀態**: ✅ 已推上線（User Test 通過）

---

### ✅ Run 2025-11-11-01: Bug Fix + Technical Debt Cleanup + Documentation

**Run ID**: run-2025-11-11-01  
**類型**: Bug Fix + Technical Debt Cleanup + Documentation  
**狀態**: ✅ closed  
**開始時間**: 2025-11-11  
**完成時間**: 2025-11-11

**Stories**:
- [Issue 2025-11-10-001: Auth 流程被搞壞（正式環境）](../backlog/issues/issue-2025-11-10-001.md) ✅ resolved
- 技術債清理：移除過渡期映射工具 ✅ completed

**完成內容**:
- ✅ 修復 OAuth callback 簽名驗證問題
  - 根本原因：簽名驗證未包含 `code` 參數
  - 修復方式：恢復為直接傳遞整個 `params` 物件給 `verifyInstallRequest`
  - 修改檔案：`backend/src/types.ts`, `backend/src/routes/auth.ts`
- ✅ 清理技術債：移除 `frontend/utils/storeToConnection.ts`
- ✅ 建立 Shopline OAuth 實作指南
  - 建立 `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`
  - 更新相關文件加入關鍵實作細節
  - 加入 Shopline 官方文件連結

**測試結果**:
- ✅ Agent 功能測試：所有修復通過
- ✅ User Test：正式環境驗證通過（2025-11-11）
  - OAuth 授權流程正常
  - 商店授權功能正常
  - 重新授權流程正常

**相關 Issue**:
- ✅ Issue 2025-11-10-001: OAuth callback 簽名驗證問題 → resolved

**推上線狀態**: ✅ 已推上線（2025-11-11，Commit: 446c3ad）

---

### ✅ Run 2025-11-10-01: Connection 基礎重構（Phase 1.2 前置）

**Run ID**: run-2025-11-10-01  
**類型**: Refactor + Feature Integration  
**狀態**: ✅ closed  
**開始時間**: 2025-11-10  
**完成時間**: 2025-11-10

**Stories**:
- [Story R1.1: 多平台狀態管理擴展](../backlog/stories/story-r1-1-multi-platform-state.md) ✅ completed
- [Story R3.0: Connection 資料模型與 Migration](../backlog/stories/story-r3-0-connection-data-model.md) ✅ completed
- [Story R3.1: Connection 狀態同步](../backlog/stories/story-r3-1-connection-state-sync.md) ✅ completed
- [Story R3.2: Token Lifecycle 與重新授權流程](../backlog/stories/story-r3-2-token-lifecycle.md) ✅ completed

**完成內容**:
- ✅ R1.1: Connection 狀態管理基礎（Zustand、Router Query、localStorage）
  - Zustand Store 更新為 Connection 欄位（selectedPlatform, selectedConnectionId, selectedConnectionItemId）
  - 登入/登出流程整合完成，SWR 快取清除機制實作
  - State 分層策略正確實作（Zustand 是唯一 Source of Truth）
- ✅ R3.0: Connection 資料模型實作
  - Prisma schema 更新（integration_accounts, connection_items）
  - Migration script 建立並執行成功
  - ConnectionRepository 建立完成
  - `/api/connections` API 端點建立完成
- ✅ R3.1: Connection 狀態同步完成
  - URL → Zustand 初始化實作（在 `_app.tsx` 層級）
  - 跨頁面切換與 Browser Back/Forward 正常運作
  - State 分層策略正確實作
- ✅ R3.2: Token lifecycle 標準化
  - 前端錯誤處理機制實作（根據錯誤碼區分 TOKEN_EXPIRED 和 SESSION_EXPIRED）
  - Token 過期提示 UI（Modal）實作
  - 重新授權流程實作完成

**測試結果**:
- ✅ Agent 功能測試：所有 Story 通過
- ✅ User Test：所有功能測試通過（2025-11-10）
  - Connection 狀態管理正常
  - 登入/登出流程正確
  - SWR 快取清除機制正常運作
  - Token 過期處理正常
  - 重新授權流程正常運作

**修復項目**:
- ✅ 登出後登入新帳號仍能看到舊資料 → 已修復（清除 SWR 快取）
- ✅ 登入時清除所有舊的快取和狀態 → 已實作

**相關 Issue**:
- ✅ Issue 2025-11-06-001: URL 參數與 Zustand Store 同步機制導致閃跳問題 → resolved
- ✅ Issue 2025-11-07-001: OAuth Token 過期時誤觸發 Admin 登出 → resolved

**推上線狀態**: ✅ 已推上線（2025-11-10，Commit: 235dfd6）

---

### ✅ Run 2025-11-07-01: Story 3.x 認證 / 授權 QA Regression

**Run ID**: run-2025-11-07-01  
**類型**: Testing  
**狀態**: ✅ closed  
**開始時間**: 2025-11-07  
**完成時間**: 2025-11-07

**Stories**:
- [Story 3.1: 使用者認證系統](../backlog/stories/story-3-1-user-authentication.md) ✅ agent-testing 完成
- [Story 3.2: 基礎權限驗證機制](../backlog/stories/story-3-2-basic-authorization.md) ✅ agent-testing 完成
- [Story 3.3: 多租戶資料隔離](../backlog/stories/story-3-3-multi-tenant-data-isolation.md) ✅ agent-testing 完成（新增 webhook / service code review）
- [Story 3.4: Admin 管理介面](../backlog/stories/story-3-4-admin-management-interface.md) ✅ QA code review（詳見 `story-3-4-admin-management-interface-code-review.md`）
- [Story 3.5: OAuth 授權流程與會員登入系統銜接](../backlog/stories/story-3-5-oauth-auth-integration.md) ✅ QA code review（詳見 `story-3-5-oauth-auth-integration-code-review.md`）

**測試結果**:
- ✅ Story 3.1 / 3.2 實機 API / Session 測試完成
- ✅ Story 3.3 多租戶資料隔離實測完成；2025-11-10 使用者指示將 OAuth 新增商店綁定視為結案，待未來 Run 覆測
- 🔍 Story 3.4 / 3.5 因需完整前端操作與 Shopline 平台授權，改以逐項 code review 驗證，2025-11-10 使用者簽核後暫視為完成

**折衷方式**:
- 前端 UI 與 OAuth 授權流程無法由 Agent 實機操作，改由 code review 驗證邏輯一致性
- 風險與說明記錄於 `docs/context/current-run.md`

**已知風險 / 待驗收**:
- Story 3.4 / 3.5 若需實機流程仍需 Human User Test，已於 2025-11-10 由使用者簽核暫結
- Story 3.3 OAuth 新增商店綁定待未來 Run 覆測，2025-11-10 由使用者簽核視為完成

**推上線狀態**: ⏳ 待 User Test 確認

---

### ✅ Run 2025-11-06-01: Epic 3 Admin 管理系統（Story 3.1-3.5）

**Run ID**: run-2025-11-06-01  
**類型**: Feature  
**狀態**: ✅ completed  
**開始時間**: 2025-11-06  
**完成時間**: 2025-11-06

**Stories**:
- [Story 3.1: 使用者認證系統](../backlog/stories/story-3-1-user-authentication.md) ✅
- [Story 3.2: 基礎權限驗證機制](../backlog/stories/story-3-2-basic-authorization.md) ✅
- [Story 3.3: 多租戶資料隔離](../backlog/stories/story-3-3-multi-tenant-data-isolation.md) ✅
- [Story 3.4: Admin 管理介面](../backlog/stories/story-3-4-admin-management-interface.md) ✅
- [Story 3.5: OAuth 授權流程與會員登入系統銜接](../backlog/stories/story-3-5-oauth-auth-integration.md) ✅

**完成內容**:
- ✅ Story 3.1: 後端認證 API（註冊、登入、登出、Session 管理、JWT Token）
- ✅ Story 3.2: 基礎權限驗證機制（認證中間件、API 端點保護、資料過濾）
- ✅ Story 3.3: 多租戶資料隔離（資料庫設計、查詢過濾器、資料遷移）
- ✅ Story 3.4: Admin 管理介面（登入/註冊頁面、路由保護、認證狀態管理）
- ✅ Story 3.5: OAuth 授權流程與會員登入系統銜接（OAuth 回調處理、前端整合、商店關聯）

**測試結果**:
- ✅ Agent 功能測試：所有 Story 通過
- ✅ User Test：核心流程通過
  - 註冊、登入功能正常
  - 商店授權流程正常
  - API 使用正常
  - Webhook 接收正常
  - 資料隔離正常

**已知問題**:
- 註冊流程防呆機制不完整（記錄在 `docs/backlog/inbox/note-2025-11-06-002.md`）
- 前後端 state 控管不順暢（記錄在 `docs/backlog/inbox/note-2025-11-06-002.md`）

**推上線狀態**: ✅ 已推上正式環境並測試通過

---

### ✅ Run 2025-11-05-01: Zustand 階段 1 核心實作

**Run ID**: run-2025-11-05-01  
**類型**: Refactor  
**狀態**: ✅ completed  
**開始時間**: 2025-11-05  
**完成時間**: 2025-11-06  

**Story**: [Story R1.0: Zustand 階段 1 核心實作](../backlog/stories/story-r1-0-zustand-implementation.md)

**完成內容**:
- ✅ Phase 1: 前端 Zustand 實作完成
  - Zustand Store 建立並整合到所有頁面
  - 操作鎖定機制實作完成
  - URL 參數與 Zustand Store 同步機制（已修復閃跳問題）
- ✅ Phase 2: 後端 Redis 整合完成
  - Redis 客戶端初始化完成
  - Token 快取功能實作完成
  - 降級機制實作完成（無 Redis 時自動降級到資料庫）
- ⏸️ Phase 3: 後端 Session 管理（可選，暫不實作）

**測試結果**:
- ✅ 測試 1: 跨頁面狀態一致性測試 - 通過
- ✅ 測試 2: 操作鎖定機制測試 - 通過
- ✅ 測試 3: URL 參數與 Zustand Store 同步機制 - 通過

**已知問題**:
- [Issue 2025-11-06-001](../backlog/issues/issue-2025-11-06-001.md): URL 參數與 Zustand Store 同步機制導致閃跳問題（已修復簡易方案）

**推上線狀態**: ✅ 準備推上線

---

**最後更新**: 2025-11-12

