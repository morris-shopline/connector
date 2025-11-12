# Current Run

**Run ID**: run-2025-11-12-02  
**Run 類型**: Feature Development (Epic 5)  
**狀態**: 🟢 in-progress  
**開始時間**: 2025-11-12  

---

## Run 核心目標
1. Story 5.1：導入 Next Engine OAuth Flow 與 Platform Adapter，完成授權 / refresh / 錯誤碼映射。
2. Story 5.2：將 Next Engine 資料寫入 Connection 模型，提供店舖與訂單資料讀取 API。
3. Story 5.3：前端整合 Next Engine 平台，完成多平台切換、重新授權 UX 與錯誤提示。

---

## 任務清單與狀態

| Story | 狀態 | 備註 |
|-------|------|------|
| [Story 5.1: Next Engine OAuth Flow 與 Platform Adapter](../backlog/stories/story-5-1-next-engine-oauth.md) | ✅ completed | 後端實作完成，已通過自動化測試 | 
| [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](../backlog/stories/story-5-2-next-engine-connection-data.md) | ✅ completed | 後端 API 完成，已通過自動化測試 |
| [Story 5.3: 前端 Connection UX 延伸與重新授權整合](../backlog/stories/story-5-3-next-engine-ux.md) | ✅ completed | 前端整合完成，等待 User Test |
| [Story 5.4: Shopline Platform Adapter 重構](../backlog/stories/story-5-4-shopline-adapter-refactor.md) | ⚪ 待前置 | 待 5.1～5.3 完成並通過 User Test 後啟動 |
| [Story 5.5: Next Engine 庫存與倉庫 API 補強](../backlog/stories/story-5-5-next-engine-inventory-apis.md) | ⚪ 待前置 | 待 5.1～5.3 確認穩定後、視情況啟動 |

---

## Run 執行策略
1. **階段 1 — 後端授權能力（Story 5.1）**：
   - 建立 Next Engine Adapter 與授權 API，使用假值驗證流程，待憑證提供後再跑實機授權。
   - 完成錯誤碼映射與 Activity Dock 事件，提供 Postman collection 給後續 Story。
2. **階段 2 — 資料寫入與 API（Story 5.2）**：
   - 以已授權的 Connection 為基礎，建立 Prisma migration、同步店舖資料並實作訂單摘要 API。
   - 提供 Swagger / API spec 與測試腳本。
3. **階段 3 — 前端整合（Story 5.3）**：
   - 啟用 Next Engine 平台切換、顯示資料、完成重新授權 UX。
   - 與人類夥伴驗證整體操作流程與錯誤處理，完成第一輪 User Test。
4. **階段 4 — Shopline 重構（Story 5.4）**：
   - 在 Story 5.1～5.3 完成並通過 User Test 後，將 Shopline 平台切換至 adapter 架構，再進行一次回歸測試。
5. **階段 5 — 庫存／倉庫補強（Story 5.5，視進度啟動）**：
   - 若前述流程穩定，再補齊 Next Engine 庫存及倉庫 API，以避免在架構未定前實作過多端點。

---

## Human ↔ Agent 協作計畫
- **OAuth UI 操作**：Agent 完成後端功能與自動測試後，Human 於 Admin 介面實際操作一次 Next Engine 授權、資料檢視與重新授權流程，提供截圖或錄影。
- **錯誤情境驗證**：Agent 模擬 API 錯誤並確認 UI 提示，Human 僅需在完成版界面上確認體驗符合預期。
- **Shopline 重構**：待 Story 5.1～5.3 驗收完成後，Human 與 Agent 協同安排折返測試時段，再啟動 Story 5.4。

---

## User Test 步驟（Run 完成後）

### 測試環境
- **後端服務**: http://localhost:3001
- **前端服務**: http://localhost:3000
- **測試帳號**: 請使用已註冊的測試帳號登入

### 測試步驟

#### 1. Next Engine 授權流程
1. 開啟瀏覽器，前往 http://localhost:3000
2. 登入系統（如未登入）
3. 進入 Connections 頁面（左側導覽 → Connections）
4. 點擊「新增 Connection」按鈕
5. 選擇「Next Engine」平台
6. 點擊「前往 Next Engine 授權」按鈕
7. 系統會跳轉至 Next Engine 登入頁面
8. 使用 Sandbox 帳號登入並授權
9. 授權完成後，系統會自動返回並建立 Connection
10. **驗證點**：
    - Connection Rail 左側應顯示新的 Next Engine Connection
    - Context Bar 頂部應顯示「Next Engine • [公司名稱]」
    - Overview Tab 應顯示 Connection 摘要資訊
    - Activity Dock 底部應顯示「Connection "[公司名稱]" 已成功建立」事件

#### 2. 檢視 Connection Items（店舖列表）
1. 在 Connection Rail 中選擇剛才建立的 Next Engine Connection
2. 切換至「Connection Items」Tab
3. **驗證點**：
    - 應顯示從 Next Engine 同步的店舖列表
    - 每個店舖應顯示店舖名稱、ID 和狀態
    - 店舖數量應與 Next Engine 後台一致

#### 3. 檢視訂單摘要
1. 保持在 Next Engine Connection 選取狀態
2. 切換至「Overview」Tab
3. **驗證點**：
    - Connection Summary Card 應顯示平台、帳戶、Token 到期時間等資訊
    - Connection Items Preview 應顯示店舖摘要
    - Activity Dock 應顯示「已成功取得訂單摘要」事件（如果 API 呼叫成功）

#### 4. 平台切換測試
1. 在 Connection Rail 的平台過濾器中，點擊「Shopline」
2. 選擇一個 Shopline Connection（如果有的話）
3. 再切換回「Next Engine」
4. 選擇剛才建立的 Next Engine Connection
5. **驗證點**：
    - 切換時資料不應閃爍或消失
    - URL 參數應正確更新（`?platform=next-engine&connectionId=xxx`）
    - Context Bar 應正確顯示 Next Engine 平台名稱

#### 5. 重新授權流程
1. 在 Connection Rail 中，將滑鼠移到 Next Engine Connection 上
2. 點擊右上角的「重新授權」圖示（旋轉箭頭）
3. 確認 Modal 顯示正確的重新授權說明
4. 點擊「前往 Next Engine 重新授權」
5. 完成授權流程
6. **驗證點**：
    - 授權完成後應顯示成功 Toast
    - Activity Dock 應顯示「Connection "[公司名稱]" 已成功重新授權」事件
    - Connection 狀態應更新為 Active

#### 6. 錯誤處理測試（可選）
1. 在 Next Engine 後台撤銷應用權限（或等待 Token 過期）
2. 嘗試重新載入 Connection 資料
3. **驗證點**：
    - 應顯示錯誤 Toast 訊息（中文）
    - Activity Dock 應顯示錯誤事件，包含錯誤碼和訊息
    - 錯誤訊息應友善且可理解

### 預期結果
- ✅ 所有功能正常運作，無 404 錯誤
- ✅ UI 顯示正確的平台名稱和資料
- ✅ 授權流程順暢，無中斷
- ✅ 錯誤訊息友善且可理解
- ✅ 平台切換時狀態保持一致

---

## ⚠️ 部署注意事項

### Next Engine OAuth 測試限制

**本地測試無法完成**：
- Next Engine OAuth 需要公開可訪問的 callback URL
- `localhost:3001` 無法被 Next Engine 回調
- 雖然可用 ngrok，但需要額外設定且每次 URL 變更都要更新 Next Engine 後台

**建議**：直接部署到正式站測試會更快、更穩定。

### 部署檢查清單

📋 **完整部署步驟**：見 `docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`

**快速檢查**：
1. ✅ Render 環境變數已設定（`NEXTENGINE_CLIENT_ID`、`NEXTENGINE_CLIENT_SECRET`、`NEXTENGINE_REDIRECT_URI`）
2. ✅ Next Engine Developer 後台 Callback URL 已設定
3. ✅ Render 服務已重新部署
4. ✅ 測試 OAuth 授權流程

---

## Story 5.1 完成進度（2025-11-12）

### ✅ 已完成項目
1. **PlatformServiceFactory 與 PlatformAdapter 介面**
   - 建立 `backend/src/types/platform.ts` 定義統一的 Adapter 介面
   - 建立 `backend/src/services/platformServiceFactory.ts` 提供工廠模式管理平台 Adapter
   - 支援註冊與取得 Adapter 的擴充機制

2. **NextEngineAdapter 實作**
   - 實作 `getAuthorizeUrl()`：組合 Next Engine 授權 URL
   - 實作 `exchangeToken()`：交換授權碼取得 Token
   - 實作 `refreshToken()`：刷新 Access Token
   - 實作 `getIdentity()`：取得公司資訊（用於 Connection displayName）

3. **OAuth API 路由**
   - `GET /api/auth/next-engine/install`：取得授權 URL（需登入）
   - `GET /api/auth/next-engine/callback`：OAuth 回調處理
   - `POST /api/auth/next-engine/refresh`：Token 刷新

4. **錯誤碼映射**
   - `002002` → `TOKEN_EXPIRED`
   - `002003` → `TOKEN_REFRESH_FAILED`
   - 其他未知錯誤 → `PLATFORM_UNKNOWN`（保留原始訊息）

5. **Activity Dock 整合**
   - 成功/失敗事件皆寫入審計記錄
   - 錯誤訊息包含錯誤碼與原始回應（供除錯）

6. **測試腳本**
   - 建立 `backend/scripts/test-next-engine-oauth.ts` 驗證 Adapter 基本功能

### ⏳ 待驗證項目（需實際 OAuth 流程）
- 實際 OAuth 授權流程測試（需要 Sandbox 憑證與 Next Engine 後台操作）
- Token 刷新錯誤處理驗證（002002, 002003）
- 錯誤碼映射實際測試

### 📝 技術備註
- Next Engine OAuth 使用 `uid` 而非 `code` 作為授權碼
- Token 刷新需要 `uid` 和 `state`，已儲存於 Connection 的 `authPayload` 中
- 錯誤訊息保留原始日文內容於 `raw` 欄位，供 PM/CS 追蹤

---

## 開放議題與待補事項
- Sandbox 憑證（Client ID/Secret/Auth Key）**已取得**，sandbox 範例值記錄於 `NEXT_ENGINE_PLATFORM_SPEC.md`。實際部署時請在 `.env`、Render/Vercel 設定同步更新，若更換 ngrok 或域名需一併調整。
- Next Engine API 錯誤碼將於實測時逐步補齊；請在 adapter 中保留 fallback 並記錄原始訊息。如碰到官方文件未涵蓋的情境，參考 `NEXTENGINE_API_REFERENCE.md` 並在 Run 中回報。
- Phase 2 的 Connection 共用策略仍暫緩，對應 note `docs/backlog/inbox/note-2025-11-11-001-admin-connection-isolation.md`。