# Story 4.3: Connection 層級權限與端點保護

**所屬 Epic**: [Epic 4: Connection 管理體驗（Phase 1.2）](../epics/epic-4-multi-store-management.md)  
**狀態**: ✅ ready-for-user-test  
**完成 Run**: -  
**建立日期**: 2025-11-11  
**對應 Roadmap**: Phase 1.2（多商店管理）

---

## Story 描述

補齊 Connection 相關 API／Webhook 的權限檢查與審計記錄，確保僅有擁有者或授權角色可進行操作，並封存原先為匿名開放的入口。此 Story 也負責將安全事件與操作記錄寫入 Activity Dock，為未來 Phase 2 的角色／權限治理打底。

> ⚠️ **依賴提醒**：本 Story 需在 4.1/4.2 實作完成後進行。請將 Activity Dock 原有的前端事件寫入邏輯替換為後端 `integration_audit_logs` 資料來源，確保事件格式與 UI 呈現保持不變。

**核心目標**：
- 保證所有 Connection / Connection Item 操作皆需登入、具備擁有權並符合平台 scope。
- 保護 OAuth 入口：`/api/auth/shopline/install` 保留 SHOPLINE 簽名驗證（即「特定一次性簽章」），`/api/auth/shopline/authorize` 需 Session 驗證。
- 建立審計記錄：記錄 userId、connectionId、operation、結果、timestamp。
- 將安全防護與錯誤回饋整合到前端 UI（Context Bar、Activity Dock、Toast）。

**範圍說明**：
- ✅ 包含：後端 Fastify route 保護、Service 層擁有權檢查、審計紀錄寫入、Webhook 驗證、前端錯誤處理與提示。
- ❌ 不含：角色權限細分（Owner / Admin / Operator 之外）、Next Engine 平台特有權限（Phase 1.3 進行）。

---

## 前情提要

### 既有成果
- Refactor 3 完成 Connection schema 與狀態同步。
- Story 4.1 / 4.2 將 UI 與工作流整合完成，提供 Activity Dock 寫入管道。
- `docs/memory/decisions/token-lifecycle-handling.md` 定義 Token 錯誤碼與前端行為。

### 相關文件
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- `docs/memory/decisions/connection-state-sync.md`
- `docs/memory/decisions/token-lifecycle-handling.md`
- `docs/archive/inbox/processed/note-2025-11-07-001.md`（公開端點檢視）

---

## 🚨 前置條件
1. Story 4.1 / 4.2 已完成，Activity Dock 與 Connection 工作流可寫入事件。
2. 登入／Session 機制（Story 3.x）可靠運作，可偵測 session 過期。
3. Prisma schema 已含必要欄位：`integration_accounts.userId`, `connection_items.integrationAccountId`。

---

## 技術需求

### 1. 後端 API 保護
- 封裝 `requireConnectionOwner` decorator：
  - 驗證 request.user 是否存在。
  - 查詢 `integration_accounts` 比對 userId + connectionId。
  - 驗證 platform scope（比對 URL `:platform` 與資料庫）。
  - 若驗證失敗 → 回傳 `403` + 錯誤碼 `CONNECTION_FORBIDDEN`。
- 套用於下列路由：
  - `GET /api/connections`
  - `GET /api/connections/:connectionId`
  - `PATCH /api/connections/:connectionId`
  - `PATCH /api/connection-items/:id`
  - 未來可擴充至 `/api/webhook/*` 需 connectionId。

### 2. OAuth 入口保護
- `GET /api/auth/shopline/install`：
  - ⚠️ **重要說明**：此端點由 SHOPLINE 平台主動呼叫（在 App Settings 中設定），SHOPLINE 不會有我們的 session。
  - 已具備 SHOPLINE 簽名驗證（appkey, handle, timestamp, sign），此即為「特定一次性簽章」機制。
  - **保留匿名訪問**，但需確保簽名驗證嚴格執行。
  - 若需使用者登入才能安裝，應使用 `/api/auth/shopline/authorize` 端點（已實作，需 session）。
- `GET /api/auth/shopline/callback`：
  - 將成功授權的 connection 綁定 `userId`（從 state 參數或 Redis 暫存中取得）。
  - 寫入審計記錄（operation=`connection.create`）。
  - 若無法取得 userId（匿名安裝），則記錄為匿名操作或要求使用者登入後補綁定。

### 3. 審計紀錄
- 新增 Prisma Model（若尚未存在）：`integration_audit_logs`
  - `id`, `userId`, `connectionId`, `connectionItemId?`, `operation`, `result`, `metadata`, `createdAt`。
- 在後端 Service 中寫入紀錄點：
  - 新增 Connection、重新授權、停用/啟用 Connection Item、Token 錯誤。
- 提供 `GET /api/connections/:connectionId/logs` API（僅返回最近 N 筆），供 Activity Dock 與未來 Monitoring 使用。

### 4. Webhook 安全
- 確保 `/webhook/shopline`：
  - 依據新的 Connection mapping，驗證 `connectionItemId` 屬於當前 user。
  - 驗證簽章後將事件寫入 `webhook_events` 並附上 `userId`。
  - 避免匿名或跨使用者寫入。

### 5. 前端整合
- Activity Dock：將後端 `logs` API 串接，顯示最近事件（成功/失敗）。
- Toast / Modal 錯誤：根據錯誤碼顯示權限提示（例如建議聯絡 Owner）。
- Context Bar：若有未授權錯誤，顯示橘色 Banner 並鎖定操作按鈕。

### 6. 單元／整合測試
- 後端新增 e2e 測試：
  - 未登入呼叫 `/api/connections` → 401。
  - 登入但非擁有者呼叫 `/api/connections/:id` → 403。
  - 登入後新增 Connection → 審計紀錄寫入。
  - Webhook 呼叫使用不同 userId → 驗證被拒。
- 前端 Cypress（若有）：
  - 未授權使用者看到限制提示。
  - Activity Dock 顯示審計紀錄。

### 7. 文件更新
- 更新 `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`：補充需登入與審計流程。
- 更新 `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`：在 Activity Dock / Security 章節標註已落地。

---

## 測試計劃

### 🧪 Agent 功能測試
- 未登入訪問保護路由 → 401 + redirect。
- 非擁有者訪問他人 Connection → 403 + `CONNECTION_FORBIDDEN` 錯誤碼。
- 新增/重新授權/停用操作後在 `integration_audit_logs` 可找到相應紀錄。
- Activity Dock 顯示最新紀錄，提供操作結果與時間。
- Webhook 透過另一個使用者簽名呼叫 → 驗證失敗並記錄安全事件。
- ESLint / TypeScript / 後端測試通過。

### 👤 User Test 建議
1. 以使用者 A 登入 → 正常操作 Connection。
2. 切換至使用者 B → 嘗試訪問 A 的 Connection，確認提示「沒有權限」。
3. 使用者 A 重新授權 → Activity Dock 顯示成功紀錄。
4. 停用 Connection Item → Activity Dock 顯示停用紀錄；嘗試操作時確認需要登入。
5. 測試未登入狀態直接訪問 `/api/auth/shopline/install` → 系統要求登入或返回錯誤。

---

## 驗收標準
- ✅ 所有 Connection / Connection Item API 均需登入與擁有權驗證，未授權請求被拒並返回一致錯誤碼。
- ✅ 審計紀錄完整記錄操作（包含 userId、connectionId、operation、result）。
- ✅ Activity Dock / Context Bar 能反映安全事件與權限狀態。
- ✅ Webhook 寫入時已綁定正確 userId，阻止跨使用者注入。
- ✅ Story 測試項目與 User Test 流程全部完成並紀錄。

---

## 參考文件
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- `docs/memory/decisions/token-lifecycle-handling.md`
- `docs/memory/decisions/connection-state-sync.md`
- `docs/archive/inbox/processed/note-2025-11-07-001.md`
- `docs/backlog/epics/epic-4-multi-store-management.md`

