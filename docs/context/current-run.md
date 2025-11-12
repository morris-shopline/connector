# Current Run

**Run ID**: run-2025-11-12-02  
**Run 類型**: Feature Development (Epic 5)  
**狀態**: ✅ ready-for-review  
**開始時間**: 2025-11-12  
**完成時間**: 2025-11-12（晚間）  

---

## Run 核心目標
1. Story 5.1：導入 Next Engine OAuth Flow 與 Platform Adapter，完成授權 / refresh / 錯誤碼映射。
2. Story 5.2：將 Next Engine 資料寫入 Connection 模型，提供店舖與訂單資料讀取 API。
3. Story 5.3：前端整合 Next Engine 平台，完成多平台切換、重新授權 UX 與錯誤提示。
4. Story 5.3.1：修正 Webhook、Event、API 測試頁面，讓它們能夠配合多平台運作，並實作 Next Engine API 測試功能。

---

## 任務清單與狀態

| Story | 狀態 | 備註 |
|-------|------|------|
| [Story 5.1: Next Engine OAuth Flow 與 Platform Adapter](../backlog/stories/story-5-1-next-engine-oauth.md) | ✅ completed | 後端實作完成，已通過自動化測試 | 
| [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](../backlog/stories/story-5-2-next-engine-connection-data.md) | ✅ completed | 後端 API 完成，已通過自動化測試 |
| [Story 5.3: 前端 Connection UX 延伸與重新授權整合](../backlog/stories/story-5-3-next-engine-ux.md) | ✅ completed | 前端整合完成，User Test 通過 |
| [Story 5.3.1: 多平台測試頁面整合](../backlog/stories/story-5-3-1-multi-platform-test-pages.md) | ✅ completed | 後端代理 API 與前端整合已完成 |
| [Story 5.4: Shopline Platform Adapter 重構](../backlog/stories/story-5-4-shopline-adapter-refactor.md) | ⚪ 待前置 | 待 5.1～5.3.1 完成並通過 User Test 後啟動 |
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

## ✅ 完成狀態（2025-11-12）

### Next Engine OAuth 測通
- ✅ **OAuth 授權流程**：成功完成 Next Engine OAuth 授權，建立 Connection
- ✅ **Connection 建立**：成功將 Next Engine 公司資料寫入 `integration_accounts`
- ✅ **Connection Items 同步**：成功將 Next Engine 店舖資料寫入 `connection_items`（4 個項目）
- ✅ **前端顯示**：Connection Dashboard 正確顯示 Next Engine Connection 資訊

### 修正的問題
1. **`parseDateTime` 方法**：修正 `undefined.split()` 錯誤，加入 null/undefined 檢查
2. **錯誤處理**：修正 `tokenResult.error.message` 可能為 undefined 的問題
3. **OAuth 流程架構**：採用 3-step 流程（Frontend → Backend /install → NE → Backend /callback → Frontend /callback → Frontend calls Backend /complete）

### 最終實作架構
- **前後端分離架構下的 OAuth 流程**：
  1. 前端觸發授權 → 後端生成 Next Engine 授權 URL
  2. Next Engine 回呼 → 後端交換 token 並暫存 Redis
  3. 前端完成 Connection → 前端調用 `/api/auth/next-engine/complete` 建立 Connection

---

## Story 5.3.1 開發進度（2025-11-12）

### ⚠️ 重要說明：功能恢復記錄（2025-11-12 晚間）

**背景**：由於開發過程中進行了過度重構（將 sidebar 拆分成獨立組件），導致功能被破壞。用戶要求恢復到「根據不同平台呈現不同的 API 內容」的狀態，並明確指示**不要恢復** sidebar 拆分的大改動。

**恢復內容**：
- ✅ 恢復 `ConnectionSelectorDropdown` 組件（`frontend/components/connections/ConnectionSelectorDropdown.tsx`）
- ✅ 恢復 `api-configs.ts` 平台 API 配置檔案（`frontend/content/platforms/api-configs.ts`）
- ✅ 恢復後端 Next Engine API 代理端點（4 個端點）
- ✅ 恢復前端 `admin-api-test.tsx` 的動態平台 API 功能顯示
- ❌ **未恢復**：sidebar 拆分成 `FunctionSidebar` 和 `WorkspaceLayout` 的大改動

### ✅ 已完成項目

#### 1. 連線選擇器組件開發（2025-11-12 恢復）
- **建立 `ConnectionSelectorDropdown` 組件**（`frontend/components/connections/ConnectionSelectorDropdown.tsx`）
  - 提供下拉選單介面，可在任何頁面切換連線
  - 顯示連線名稱、平台、狀態資訊
  - 選取後自動更新 `useConnectionStore`，與 ContextBar 同步
  - 包含 `id="connection-selector-dropdown"` 和 `className="connection-selector-dropdown"` 屬性，方便 DevTools 檢查

#### 2. 平台 API 配置系統（2025-11-12 恢復）
- **建立 `api-configs.ts` 設定檔**（`frontend/content/platforms/api-configs.ts`）
  - 定義 `PlatformApiConfig`、`ApiGroup`、`ApiFunction` 類型
  - 實作 `shoplineApiConfig`：包含商家、商品、訂單、庫存 4 個群組
  - 實作 `nextEngineApiConfig`：包含店舖、商品 2 個群組，4 個 API 功能
  - 提供 `getPlatformApiConfig()` 函數，根據 platform 動態取得對應配置

#### 3. 頁面連線選擇功能更新（2025-11-12 恢復）
- **`admin-api-test.tsx`**：
  - 整合 `ConnectionSelectorDropdown` 組件
  - 根據 `selectedConnection.platform` 動態載入對應的 API 配置
  - 使用 `getPlatformApiConfig()` 取得平台專屬的 API 功能列表
  - 自動展開所有 API 群組

- **`webhook-test.tsx`**：將靜態連線顯示改為可切換的下拉選單（已於先前完成）
- **`events.tsx`**：新增連線選擇器，保持頁面一致性（已於先前完成）

#### 4. ContextBar 共享機制確認
- 所有頁面使用 `PrimaryLayout`，已包含 `ContextBar`
- `ContextBar` 透過 `useConnectionStore` 取得選取的連線
- 在任何頁面切換連線時，`ContextBar` 會自動更新顯示

#### 5. Next Engine API 測試功能實作（2025-11-12 恢復）

**後端代理 API 端點**（`backend/src/routes/api.ts`）：
- `POST /api/connections/:connectionId/shops/search` - 取得店舖列表
- `POST /api/connections/:connectionId/shops/create` - 建立店舖
- `POST /api/connections/:connectionId/goods/search` - 查詢商品
- `POST /api/connections/:connectionId/goods/upload` - 建立商品（上傳 CSV）

**後端實作細節**：
- 所有端點都使用 `authMiddleware` 和 `requireConnectionOwner` middleware
- 從 Connection 的 `authPayload.accessToken` 取得 access token
- 錯誤處理：正確檢查 Next Engine API 回應格式（`data.code !== '000000'` 或 `data.result !== 'success'`）
- 錯誤訊息優先順序：`error_description` → `error` → `message` → 預設訊息
- 記錄審計日誌（成功/失敗），operation 名稱：`next-engine.shops.search`、`next-engine.shops.create`、`next-engine.goods.search`、`next-engine.goods.upload`

**前端 API 測試功能**（`frontend/pages/admin-api-test.tsx`）：
- 根據 `selectedConnection.platform` 動態選擇 API 功能列表
- 使用 `getPlatformApiConfig()` 取得平台專屬配置
- 將設定檔轉換為舊格式以相容現有邏輯
- Next Engine API 參數輸入 UI：
  - 取得店舖列表：Fields 參數輸入（預設值：`shop_id,shop_name,shop_abbreviated_name,shop_note`）
  - 建立店舖：XML 資料輸入（含 XML 範本）
  - 查詢商品：Fields、Goods ID、Offset、Limit 參數輸入
  - 建立商品：CSV 資料輸入（含 CSV 範本）
- Next Engine API 呼叫邏輯：
  - 使用 `getBackendUrl()` 取得後端 URL
  - 透過 `fetch` API 呼叫後端代理端點
  - 正確處理 Next Engine API 回應格式（`{ success: true, data: { ... } }`）
- 錯誤處理：正確處理 HTTP 錯誤和 JSON 回應
- 回應顯示：顯示 Next Engine API 的完整回應資料

**前端實作細節**：
- 使用 `useSelectedConnection` hook 取得當前選取的 Connection
- 根據 platform 動態計算 endpoint（Next Engine 使用 `connectionId`，Shopline 使用 `handle`）
- 按鈕 disabled 狀態正確處理 Next Engine 的特殊參數驗證（XML、CSV）

### 📝 技術實作細節

**連線選擇器特性**：
- 使用 `useConnectionStore` 和 `useConnections` hook 取得連線列表
- 下拉選單顯示連線名稱、平台名稱、狀態標籤
- 選取後呼叫 `setSelectedConnection` 更新 store
- 所有使用 `useConnectionStore` 的組件會自動響應變更

**平台 API 配置系統**：
- 集中管理不同平台的 API 功能定義
- 支援動態載入，根據 platform 自動切換
- 保留 Shopline 舊格式的 fallback，確保向後相容

**後端 API 錯誤處理**：
- Next Engine API 回應格式：`{ result: 'success', code: '000000', data: { ... } }`
- 錯誤檢查：先檢查 `code`，再檢查 `result`
- 錯誤訊息優先順序確保使用者能看到最詳細的錯誤資訊

### ✅ Story 5.3.1 已完成（2025-11-12 晚間恢復）

所有待完成項目已完成，Story 5.3.1 已可進行 User Test。

---

## 🚨 發現的問題與待補事項

### Story 遺漏問題

#### 1. ✅ Webhook、Event、API 測試頁面未跟隨 Context Bar（已解決）
**問題描述**：
- `webhook-test.tsx`、`admin-api-test.tsx`、`events.tsx` 三個頁面都顯示「商店選擇」而非「連線選擇」
- 這些頁面沒有跟隨 Context Bar 所選的 `connectionId` 進行操作
- 目前不管怎麼選，都是當作 Shopline 在處理，沒有因應 `platform` 做異動

**解決方案**（2025-11-12 完成）：
- ✅ 建立 `ConnectionSelectorDropdown` 組件，提供統一的連線選擇介面
- ✅ 將三個頁面的「商店選擇」改為「連線選擇」
- ✅ 讓這些頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
- ✅ ContextBar 自動同步顯示當前選取的連線
- ✅ 根據 `selectedConnection.platform` 動態調整 API 端點和邏輯（Next Engine API 測試功能已完成）
- ✅ 統一 API 呼叫架構（使用 apiClient，與 Shopline 一致）
- ✅ 統一 URL 處理（使用 getBackendUrl）
- ✅ 修復 CORS 問題（加強後端 CORS 設定）

#### 2. Token 到期時間顯示問題
**問題描述**：
- Shopline 和 Next Engine 的 token 到期時間取法不同
- Next Engine 使用 `expiresAt`（ISO 8601 格式）
- Shopline 使用 `expires_at`（可能是其他格式）
- 目前 `ConnectionSummaryCard` 有處理兩種格式，但 Next Engine 的 token 到期時間可能沒有正確從後端取得

**需要檢查**：
- 後端 `POST /api/auth/next-engine/complete` 是否正確儲存 `expiresAt` 到 `authPayload`
- Next Engine API 回傳的 `access_token_end_date` 格式是否正確解析
- 前端 `ConnectionSummaryCard` 的 `expiresAt` 解析邏輯是否正確

### 設計問題

#### 3. Next Engine Store 建立邏輯
**問題描述**：
- Next Engine 的 store（店舖）可以用 API 去 create
- 每增加一個 store，Connection Item 就會增加一個
- 這可能導致邏輯問題：使用者透過 API 建立 store 後，Connection Item 應該如何同步？

**需要討論**：
- Connection Item 是否應該自動同步 Next Engine 的 store 變更？
- 是否需要提供手動同步機制？
- Store 建立後，Connection Item 的建立時機和方式

---

## 開放議題與待補事項
- Sandbox 憑證（Client ID/Secret/Auth Key）**已取得**，sandbox 範例值記錄於 `NEXT_ENGINE_PLATFORM_SPEC.md`。實際部署時請在 `.env`、Render/Vercel 設定同步更新，若更換 ngrok 或域名需一併調整。
- Next Engine API 錯誤碼將於實測時逐步補齊；請在 adapter 中保留 fallback 並記錄原始訊息。如碰到官方文件未涵蓋的情境，參考 `NEXTENGINE_API_REFERENCE.md` 並在 Run 中回報。
- Phase 2 的 Connection 共用策略仍暫緩，對應 note `docs/backlog/inbox/note-2025-11-11-001-admin-connection-isolation.md`。