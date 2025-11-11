# Story 4.2: Connection 建立與重新授權工作流

**所屬 Epic**: [Epic 4: Connection 管理體驗（Phase 1.2）](../epics/epic-4-multi-store-management.md)  
**狀態**: ✅ ready-for-user-test  
**完成 Run**: -  
**建立日期**: 2025-11-11  
**對應 Roadmap**: Phase 1.2（多商店管理）

---

## Story 描述

整合 Connection 建立、重新授權、停用等核心操作流程，提供一致的 UX 與成功/錯誤回饋。此 Story 在 Story 4.1 的 UI 架構之上，落實 Flow C2 / C3 / C4（見 `CONNECTION_MANAGEMENT_UI_DESIGN.md`），讓 Admin 能在 Connection Landing Page 上進行完整的 OAuth 授權與維護。

> ⚠️ **依賴提醒**：Activity Dock 在本 Story 中會先採用前端狀態寫入，確保 UI 流程完整；Story 4.3 會將這些事件改為串接後端審計紀錄。請保持事件 schema 一致，避免 4.3 後續整合時遺漏。

**核心目標**：
- 完成新增 Connection Flow（平台選擇 → OAuth → 回前端刷新）
- 完成重新授權 Flow（根據 Token 錯誤或使用者操作觸發）
- 提供停用 / 啟用 Connection Item 的工作流與反饋
- 將流程狀態與 Activity Dock / Toast / Context Bar 同步
- **UI 層級優化**：調整 Global Header 與 Primary Nav，參考 GA4 風格，將最邊邊的導覽 tab 縮小為圖標式，顏色區別，讓畫面更乾淨地留給功能本身

**範圍說明**：
- ✅ 包含：前端 Flow 組件、Modal、Toast、Activity 更新、後端 API 串接、基本錯誤處理。
- ❌ 不含：權限驗證與審計紀錄（Story 4.3）、Next Engine 平台細節（Phase 1.3）。

---

## 前情提要

### 架構基礎
- Story 4.1 已建立 Connection Landing Page 的 UI 架構與基本狀態展示。
- Refactor 3（R3.1 / R3.2）提供 URL 初始化、Token Lifecycle 錯誤碼與共用錯誤處理。
- OAuth 後端流程既有（Refactor 3 + Issue 2025-11-10-001 修復）。

### 相關決策與文件
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`（Flow C2 / C3 / C4）
- `docs/memory/decisions/token-lifecycle-handling.md`
- `docs/memory/decisions/connection-state-sync.md`

---

## 🚨 前置條件（Human / 其他 Story）
1. Story 4.1 已合併，確保 Connection Rail、Overview Tab、Activity Dock 容器存在。
2. 後端 OAuth 安裝／重新授權 API 可用：
   - `GET /api/auth/shopline/install`
   - `GET /api/auth/shopline/callback`
   - `DELETE /api/connections/:connectionId`（待確認，如無則需於本 Story 補完）
3. 決策文件若需補充流程文案或錯誤碼，需先更新。

---

## 技術需求

### 1. 新增 Connection Flow（Flow C2）
- 平台選擇器（Modal）：
  - `components/connections/AddConnectionModal.tsx`
  - Phase 1.2 顯示 Shopline；Next Engine 預留 disabled 選項。
  - 顯示平台說明、所需權限連結、流程提示。
- OAuth 導引：
  - 按下「前往授權」→ 呼叫 `/api/auth/{platform}/install` → window.location.href。
  - Callback 完成後後端 redirect 至前端（含成功 / 錯誤狀態）。
- 前端事件處理：
  - 在 callback 頁面 (`/connections/callback?status=success`) 觸發 `useConnectionStore.refresh()`。
  - 顯示 success toast，「已成功建立 {displayName}」。
  - 自動選取新 Connection 並刷新 Overview。

### 2. 重新授權 Flow（Flow C3）
- 觸發入口：
  - Connection Rail hover 快速操作 → `重新授權`
  - Overview 卡片 → `重新授權`按鈕
  - Token 錯誤 toast → CTA 按鈕
- Modal 內容：顯示錯誤原因（TOKEN_EXPIRED/TOKEN_REVOKED），列出執行步驟。
- OAuth 過程同 Flow C2；完成後顯示成功/失敗 toast。
- Activity Dock：記錄重新授權成功（包含時間、操作者）。

### 3. 停用 / 啟用 Connection Item（Flow C4）
- Connection Items Tab（Story 4.1 建立的預覽）需補完整頁：
  - `frontend/pages/connections/items.tsx`（或在同頁 Tab 呈現）。
  - 列表操作欄加入 `停用/啟用` 動作。
- 確認對話框：
  - 顯示影響（Webhook 停止、API 需重新授權）。
  - 選擇停用後呼叫 API `PATCH /api/connection-items/:id {status}`。
  - 成功後更新列表狀態，寫入 Activity Dock。
- 若 Items 停用導致 Connection 進入 Error 狀態（規則待確認），需更新 Context Bar 與 Status Pill。

### 4. 共用元件與錯誤處理
- Toasts：統一使用 `components/common/useToast()`（若無需新建），支援 success/info/error。
- Activity Dock：新增 `useActivityLog()` helper，允許不同事件種類推入（`connection.created`, `connection.reauthorized`, `connection_item.disabled`）。
- Loading 狀態：Modal 中顯示 Spinner；API 失敗提供重試按鈕。
- 錯誤碼映射：
  - OAuth callback 失敗 (`OAUTH_DENIED`, `TOKEN_SCOPE_MISMATCH`) → 顯示相關訊息並保留活動記錄。
  - API 403/409 需顯示對應引導（多半屬於 Story 4.3 權限驗證，但此處要有對應提示）。

### 5. 路由與狀態同步
- `_app.tsx` 中監聽 OAuth callback query：若 `?status=success` → 重新拉取 Connections。
- `useConnectionStore` 增加 `refreshConnections` 方法（呼叫 API 並更新 store）。
- 重新授權成功後，應保留使用者當前 Tab，不強制跳回 Overview；但 Overview 的狀態/Badge 應更新。

### 6. UI 層級優化（參考 GA4 風格）
- **Primary Nav 調整**：
  - 縮小為圖標式導覽（寬度約 48-64px），僅顯示圖標，hover 時顯示工具提示
  - 使用顏色區別不同模組（Connections、Webhook、Admin API、Settings）
  - 移除文字標籤，讓畫面更乾淨
- **Global Header 調整**：
  - 簡化 Header 內容，移除重複的導覽項目（已在 Primary Nav）
  - 保留 LOGO、使用者資訊、登出按鈕
  - 可選：加入 Workspace Switcher 預留位置
- **整體布局**：
  - 確保主要內容區域（Workspace Canvas）有最大可用空間
  - Connection Rail 與主要內容區域的比例優化

### 7. 統一 Layout 架構（所有頁面）
- **PrimaryLayout 組件**：
  - 建立統一的 `PrimaryLayout` 組件，包含 Primary Nav、Context Bar、Activity Dock
  - 所有主要頁面（Connections、Webhook 事件、Webhook 管理、Admin API 測試）都使用相同 layout
  - 確保頁面間可以順暢切換，導航一致
- **頁面更新**：
  - `/connections` - 已使用統一 layout（含 Connection Rail）
  - `/events` - 新建 Webhook 事件頁面，使用統一 layout
  - `/webhook-test` - 更新為使用統一 layout
  - `/admin-api-test` - 更新為使用統一 layout
- **導航一致性**：
  - Primary Nav 的路由連結正確指向對應頁面
  - 所有頁面都能透過 Primary Nav 切換
  - Context Bar 和 Activity Dock 在所有頁面保持一致

### 8. 文件與程式結構
```
frontend/
├── components/
│   ├── layout/
│   │   ├── PrimaryNav.tsx (調整為圖標式)
│   │   ├── PrimaryLayout.tsx (統一 layout 組件)
│   │   └── GlobalHeader.tsx (簡化)
│   └── connections/
│       ├── AddConnectionModal.tsx
│       ├── ReauthorizeConnectionModal.tsx
│       ├── ConnectionItemsTable.tsx
│       └── ConnectionItemActionMenu.tsx
├── hooks/
│   └── useActivityLog.ts
├── lib/api/
│   └── connections.ts (新增 create/reauthorize/disable API)
└── pages/
    ├── connections/
    │   ├── index.tsx (整合 Story 4.1 產出)
    │   └── callback.tsx (處理 OAuth 回傳)
    ├── events.tsx (新建 Webhook 事件頁面)
    ├── webhook-test.tsx (更新為統一 layout)
    └── admin-api-test.tsx (更新為統一 layout)
```

---

## 測試計劃

### 🧪 Agent 功能測試
- 新增 Flow：
  - 開啟 Modal → 選擇 Shopline → 被引導到 OAuth → Callback 後顯示成功訊息且新的 Connection 出現在列表並被選取。
  - 錯誤路徑：callback 帶 `status=failed` → 顯示錯誤訊息，Activity Dock 記錄。
- 重新授權 Flow：
  - 從 Connection Rail 觸發 → 完成 OAuth → 狀態徽章變為 Active，Activity Dock 有紀錄。
  - Token 錯誤 toast 提供 CTA → 流程相同。
- 停用 Connection Item：
  - 停用後列表狀態更新為 Disabled，重整頁面後仍維持。
  - Activity Dock 顯示「{item} 已停用」。
  - 再次啟用 → 狀態恢復 Active。
- URL / State：`refreshConnections` 只更新 store，不更新 URL，且 context bar / overview 同步。
- Toast / Activity：所有成功/失敗流程均有對應提示。
- ESLint / TypeScript 通過。

### 👤 User Test 建議
1. 使用者新增一個新的 Shopline Connection → 檢查列表、Overview 更新 → 驗證 Activity 記錄。
2. 人為將 Token 設為過期（後端協助）→ 回到前端顯示錯誤 → 點擊重新授權 → 驗證成功後狀態恢復。
3. 停用某個 Connection Item → 從其他頁面切換回來 → 狀態仍為 Disabled，且 Activity Dock 有紀錄。
4. 驗證錯誤情境：OAuth 被拒、API 回傳權限不足 → UI 顯示符合決策的提示與指引。

---

## 驗收標準
- ✅ 新增、重新授權、停用/啟用流程皆可在 UI 端操作完成，並與後端同步。
- ✅ Flow C2 / C3 / C4 對應的 UI 元件與提示（Modal、Toast、Activity）全部到位，符合設計規格。
- ✅ Connection Rail、Context Bar、Overview 在流程後即時更新，不需重新整理頁面。
- ✅ 所有流程的成功/失敗事件皆寫入 Activity Dock，並提供可追溯資訊（時間、操作者、Connection 名稱）。
- ✅ **統一 Layout 架構**：所有主要頁面（Connections、Webhook 事件、Webhook 管理、Admin API 測試）都使用相同的 PrimaryLayout，確保導航一致性和頁面間順暢切換。
- ✅ **導航功能**：Primary Nav 可以正確切換到所有頁面，不會出現「點不進去」或「點不回來」的問題。
- ✅ Story 文件中的測試項目與 User Test 步驟全部完成並紀錄。

---

## 參考文件
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- `docs/memory/decisions/token-lifecycle-handling.md`
- `docs/memory/decisions/connection-state-sync.md`
- `docs/backlog/epics/epic-4-multi-store-management.md`

