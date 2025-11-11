# Current Run

**Run ID**: run-2025-11-12-01  
**Run 類型**: Feature Development (Epic 4)  
**狀態**: 🛠 in-progress  
**開始時間**: 2025-11-12  

---

## Run 核心目標
1. Story 4.1：拆除舊版「商店列表」首頁，落地 `ADMIN_APP_UI_ARCHITECTURE.md` 全域架構（Primary Nav / Context Bar / Activity Dock / Workspace Tabs）。
2. Story 4.2：在新架構上串起新增／重新授權／停用等 Connection 工作流，完成 Toast 與 Activity Dock 事件寫入。
3. Story 4.3：補齊 Connection 權限檢查、審計紀錄與安全防護，最終 Activity Dock 連結後端紀錄並驗證 Shopline OAuth Flow 無回歸。

---

## 任務清單

### Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: ✅ completed
- ✅ 取代 `pages/index.tsx`，新建 `pages/connections/index.tsx` 搭載 `PrimaryLayout`
- ✅ 新增 `PrimaryNav`、`ContextBar`、`ActivityDock(空態)`、`ConnectionRail`、`Overview` 元件
- ✅ 串接 `/api/connections`，顯示狀態徽章、空態、預覽列表
- ✅ `/` redirect 至 `/connections`，Header 導覽同步

### Story 4.2: Connection 建立與重新授權工作流
- **狀態**: ✅ ready-for-user-test
- ✅ Flow C2：新增 Connection（平台選擇 → OAuth → 回前端刷新）
- ✅ Flow C3：重新授權流程（Modal + OAuth + Activity 記錄）
- ✅ Flow C4：停用 / 啟用 Connection Item
- ✅ Toast / Activity Dock 事件暫以前端狀態寫入（為 4.3 打底）
- ✅ UI 層級優化：Primary Nav 圖標式、Global Header 簡化（GA4 風格）

### Story 4.3: Connection 層級權限與端點保護
- **狀態**: ✅ ready-for-user-test
- ✅ Prisma `integration_audit_logs` model 與 migration
- ✅ Audit Log Repository 建立
- ✅ `requireConnectionOwner` middleware 實作
- ✅ API routes 保護（`/api/connections`, `/api/connection-items/:id`, `/api/connections/:connectionId/logs`）
- ✅ OAuth callback 寫入審計記錄（connection.create, connection.reauthorize）
- ✅ Connection Item 狀態更新寫入審計記錄（connection_item.enable, connection_item.disable）
- ✅ Activity Dock 從後端 `/api/audit-logs` 讀取資料
- ✅ Webhook 安全驗證加強（connectionItemId 綁定與 userId 驗證）
- ✅ 編譯測試通過

---

## 既有現況摘要
- Shopline OAuth Flow 正常運作，簽章與 callback 近期已修復，本 Run 任何調整不得破壞該流程。
- Refactor 3 已完成資料分層：`Connection` 代表平台帳戶授權（負責 OAuth / Token / 停用），`Connection Item` 代表該帳戶下的資源（負責 API 操作 / Webhook）；本 Run 的 UI 需維持這個層級但在單一商店情境下保持簡潔。
- 現有 Admin UI 仍為舊式「商店列表」頁面；Run 首要任務是完全替換成設計規格中的新架構（Primary Layout + Context Bar + Activity Dock）。
- Connection API (`GET /api/connections`) 已提供 R3 schema；Activity Dock 尚無實際資料，本 Run 會先以前端事件寫入，再由 Story 4.3 串接審計紀錄。

---

## Run 執行策略
1. **階段 1 – 架構重建（Story 4.1）**：
   - 拆除舊頁面與組件，建立新的 `PrimaryLayout` 與 Connections Landing Page。
   - 確認登入後落地 `/connections`，UI 結構與設計規格一致。
2. **階段 2 – 工作流串接（Story 4.2）**：
   - 基於新 Layout 實作新增／重新授權／停用流程，確保 Toast 與 Activity Dock 事件一致。
3. **階段 3 – 安全與審計（Story 4.3）**：
   - 套用 API 權限檢查、建立審計紀錄，替換 Activity Dock 資料來源並做 Shopline OAuth regression。

> ⚠️ 4.2 與 4.3 對 Activity Dock / Toast 的事件格式必須沿用 4.1 的實作，避免後續整合衝突。

---

## 預期 User Test 景象（Run 完成後）
1. **登入後首頁 (`/connections`)**：
   - 看到新的 `PrimaryLayout`：左側 `PrimaryNav` 顯示「Connections / Webhook 事件 / Webhook 管理 / Admin API 測試」，頂部 `GlobalHeader` 展示帳號與快速操作，頁面中央由 `ContextBar`（顯示目前 Connection 平台徽章 + 平台帳戶識別，例如 Shopline handle + 狀態徽章）與 `Workspace Tabs`（預設在 `Overview`）組成。
   - `Overview` 分頁中包含 `ConnectionSummaryCard`（平台資訊、平台帳戶 handle、授權狀態、Token 到期時間、最近重新授權時間、建立/最後更新時間、Owner 資訊、Connection Item 數量）與 `ConnectionItemsPreview`（若只有 0~1 筆 Item 則收合為摘要顯示「主要商店：{handle}」；有多筆時列出前三筆 Item 名稱、外部資源 ID/handle、狀態徽章、最近同步時間，並提供「查看全部」按鈕），底部的 `ActivityDock` 顯示「目前沒有通知」的空態。
2. **新增 Connection Flow (`AddConnectionModal` + Shopline OAuth)**：
   - 點擊 `ConnectionRail` 上方的「+ 新增 Connection」按鈕 → 彈出 `AddConnectionModal`，先選平台（預設 Shopline），再輸入 Handle（保留現有預設值）→ 按「前往授權」跳轉至 Shopline OAuth 頁面。
   - 授權完成返回 `/connections/callback` 時，系統自動刷新 `/api/connections`，新的 Connection 立即出現在 `ConnectionRail`，並在 `ContextBar` 中被選取；`ActivityDock` 加入一筆「Connection 建立成功」紀錄。若平台支援 refresh endpoint，`QuickActionsGrid` 會出現「Refresh Token」按鈕，可立即驗證 refresh API 是否更新 Token 到期時間與 Activity Dock 記錄。
3. **重新授權**：模擬 Token 過期 → 使用提示操作 → 狀態徽章恢復 Active，Activity Dock 記錄重新授權。
4. **停用 / 啟用 Connection Item**：操作後狀態即時刷新，審計紀錄可查。
5. **安全驗證**：未登入或非擁有者無法存取 Connection API／OAuth 入口；Webhook 僅接受對應 user 的事件。
6. **Shopline OAuth Flow Regression**：全程走通（成功 / 失敗 / scope mismatch），確保近期修復不會被此 Run 破壞。

---

## 風險與注意事項
- Activity Dock：4.2 會先寫入前端狀態，4.3 需成功改為後端資料來源。
- OAuth 流程：務必排定 regression 測試；如需修改後端路由要加倍審慎。
- Prisma Migration：`integration_audit_logs` 需完成 migration + 回滾策略。
- 測試環境：建議至少兩個使用者帳號驗證權限阻擋，搭配一組 webhook 測試資料。
- **UI 層級調整**：Story 4.2 需一併完成 Global Header 與 Primary Nav 的 GA4 風格調整，確保最邊邊的導覽 tab 縮小為圖標式，顏色區別，讓畫面更乾淨。

---

## Document & PR 指引
- Run 結束需更新：
  - `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`（註記 Primary Layout、Activity Dock 實作完成）
  - `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`（補充執行畫面與行為備註）
  - `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`（新增登入限制與審計流程）
- PR 描述必須附上：
  - 新 UI 截圖或影片
  - 新增/重新授權/停用流程測試結果
  - Shopline OAuth regression 測試紀錄
