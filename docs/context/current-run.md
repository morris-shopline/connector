# Current Run

**Run ID**: run-2025-11-13-01  
**Run 類型**: Refactor + Bug Fix + Feature Development (Epic 5)  
**狀態**: 🟡 in-progress（Story 5.5 已完成，Story 5.6 待啟動）  
**開始時間**: 2025-11-13  
**達到 ready-for-acceptance 時間**: 2025-11-13  
**開始驗收時間**: 2025-11-13（推上正式站）  
**Story 5.5 完成時間**: 2025-11-13（地端 + 正式機測試通過）  

---

## Run 核心目標

1. **Story 5.4**：將 Shopline 授權／API 流程重構為與 Next Engine 一致的 Platform Adapter 架構
2. **Issue 2025-11-11-001**：調查並修復停用 Connection Item 時出現的 Network Error
3. **Story 5.5**：Next Engine 商品建立改進與庫存 API 補強（完成後進行 User Test，通過後推上正式站）
4. **Story 5.6**：Next Engine 訂單 API 補強
5. **Story 5.7**：Next Engine 店舖建立改進與在庫連携接收端點

---

## 任務清單與狀態

| 任務 | 狀態 | 備註 |
|------|------|------|
| [Story 5.4: Shopline Platform Adapter 重構](../backlog/stories/story-5-4-shopline-adapter-refactor.md) | ✅ completed | ✅ User Test 完成，Story 已關閉 |
| [Issue 2025-11-11-001: 停用 Connection Item 時出現 Network Error](../backlog/issues/issue-2025-11-11-001-disable-connection-item-network-error.md) | ⏸ pending | ⏸ 不在此 run 處理，待之後適當時機處理 |
| [Story 5.5: Next Engine 商品建立改進與庫存 API 補強](../backlog/stories/story-5-5-next-engine-inventory-apis.md) | ✅ completed | ✅ 地端測試通過 + 正式機測試通過，Story 已結案 |
| [Story 5.6: Next Engine 訂單 API 補強](../backlog/stories/story-5-6-next-engine-order-apis.md) | ⏸ pending | ⏳ 待下週繼續開發 |
| [Story 5.7: Next Engine 店舖建立改進與在庫連携接收端點](../backlog/stories/story-5-7-next-engine-shop-creation-and-stock-webhook.md) | ⏸ pending | ⏳ 待 Story 5.6 完成後啟動 |

---

## 執行順序與策略

### 階段 1：Story 5.4 - Shopline Platform Adapter 重構（✅ 已完成）

**目標**：將 Shopline 授權／API 流程重構為與 Next Engine 一致的 Platform Adapter 架構

**目前狀態**：✅ **已完成，User Test 通過，Story 已關閉**

**已完成項目**：
1. ✅ 建立 `ShoplineAdapter`，實作 `PlatformAdapter` 介面（OAuth 相關方法）
2. ✅ 將 ShoplineService 的 API 方法移到 ShoplineAdapter（作為額外方法）
   - `getStoreInfoFromAPI`, `getProducts`, `getProduct`, `createProduct`
   - `getOrders`, `createOrder`, `getLocations`
3. ✅ 將 ShoplineService 的 Webhook 方法移到 ShoplineAdapter
   - `verifyWebhookSignature`, `subscribeWebhook`, `unsubscribeWebhook`
   - `getSubscribedWebhooks`, `getWebhookCount`
4. ✅ 更新 `PlatformServiceFactory` 註冊 ShoplineAdapter
5. ✅ 重構 `routes/auth.ts` 使用 PlatformServiceFactory
6. ✅ 重構 `routes/api.ts` 使用 ShoplineAdapter（所有 Shopline API 呼叫）
7. ✅ 重構 `routes/webhook.ts` 使用 ShoplineAdapter（Webhook 相關操作）
8. ✅ 在應用啟動時初始化 PlatformServiceFactory（`backend/src/index.ts`）

**保留項目**：
- `ShoplineService` 保留用於資料庫操作（`getStoreByHandle`, `isWebhookProcessed`, `saveWebhookEvent` 等）
- 這些方法涉及 Prisma 資料庫操作，不屬於 Adapter 範疇

**⚠️ 已知問題與風險**：

1. **未進行實際測試**
   - ❌ 只做了代碼結構檢查（方法存在性），沒有實際呼叫 API 測試
   - ❌ 沒有啟動伺服器進行端到端測試
   - ❌ 沒有驗證 OAuth 流程是否正常運作
   - ❌ 沒有驗證 API 呼叫是否正常運作

2. **可能的問題點**：
   - ⚠️ `routes/api.ts` 和 `routes/webhook.ts` 中，所有 Shopline API 呼叫都需要先透過 `shoplineService.getStoreByHandle(handle)` 取得 store，然後取得 `store.accessToken`
   - ⚠️ 如果 `getStoreByHandle` 返回的 store 結構與預期不同，可能會導致錯誤
   - ⚠️ 沒有驗證 `store.accessToken` 是否存在或有效
   - ⚠️ 錯誤處理邏輯可能不完整（例如 store 不存在時的處理）

3. **TypeScript 編譯錯誤**（測試檔案）：
   - ⚠️ `backend/src/routes/__tests__/next-engine-auth.test.ts` - `afterEach` 未定義
   - ⚠️ `backend/src/routes/__tests__/next-engine-data.test.ts` - `afterEach` 未定義
   - ⚠️ `backend/src/services/__tests__/nextEngine.test.ts` - 多處 TypeScript 錯誤（error 屬性不存在）

4. **伺服器啟動問題**：
   - ⚠️ 後端伺服器啟動時，Next Engine Adapter 初始化失敗（環境變數未設定），但這不影響 Shopline
   - ⚠️ 沒有成功啟動前端和後端伺服器供 User Test
   - ⚠️ 無法確認伺服器是否正常運作

5. **未完成的驗證**：
   - ❌ 沒有驗證 OAuth 授權流程
   - ❌ 沒有驗證 API 端點功能
   - ❌ 沒有驗證 Webhook 功能
   - ❌ 沒有進行 User Test

**驗收標準**：
- [x] `PlatformServiceFactory` 能夠依據 `platform` 回傳 Shopline adapter ✅
- [x] ShoplineAdapter 所有 16 個方法已實作 ✅
- [x] Routes 已更新為使用 Factory 模式 ✅
- [x] 代碼編譯無錯誤（主要代碼）✅
- [x] 統一錯誤處理邏輯（使用 helper functions）✅
- [x] Linter 檢查無錯誤 ✅
- [x] 代碼結構驗證通過 ✅
- [ ] **User Test：OAuth 授權流程** ⏳ **待 User Test**
- [ ] **User Test：API 端點功能** ⏳ **待 User Test**
- [ ] **User Test：Webhook 功能** ⏳ **待 User Test**

**Agent 測試完成項目**：
- ✅ ShoplineAdapter 方法存在性檢查（16/16）
- ✅ PlatformServiceFactory 註冊檢查
- ✅ 路由架構檢查（api.ts: 13處, webhook.ts: 全部, auth.ts: 5處）
- ✅ Helper functions 檢查（getShoplineStoreWithToken, handleRouteError, RouteError）
- ✅ 錯誤處理統一性檢查（13處使用 handleRouteError）
- ✅ 代碼編譯檢查
- ✅ Linter 檢查

**User Test 步驟**：見 Story 5.4 文件中的「User Test」章節

**推上線狀態**: 🚀 **已推上正式站，進行 User Test**

**正式站測試重點**：
1. **Shopline OAuth 授權流程**：確認授權 URL 生成、回調處理、Connection 建立正常
2. **Shopline API 端點**：確認所有 API 端點（Store Info、Products、Orders、Locations）正常運作
3. **Shopline Webhook**：確認 Webhook 簽名驗證、訂閱、取消訂閱功能正常
4. **Next Engine 回歸測試**：確認重構未影響 Next Engine 功能

---

### 階段 2：Issue 2025-11-11-001 - 調查並修復 Network Error（⏸ 不在此 run 處理）

**目標**：調查並修復停用 Connection Item 時出現的 Network Error

**狀態**：⏸ **不在此 run 處理，待之後適當時機處理**

**問題描述**：
- 在 Connection Items 頁面點擊「停用」按鈕時，出現 Network Error
- Network 標籤顯示請求狀態為 "COR..."（可能是 CORS 錯誤）
- 請求類型：xhr，請求時間：180 ms

**待調查項目**：
- [ ] 檢查 Network 標籤中的完整錯誤訊息
- [ ] 檢查後端 CORS 設定
- [ ] 檢查 API 請求格式（PATCH 方法是否在 CORS 允許的方法列表中）
- [ ] 檢查後端日誌
- [ ] 確認 Render 服務狀態

**相關檔案**：
- `frontend/components/connections/ConnectionItemsTable.tsx`
- `backend/src/routes/api.ts` - `/api/connection-items/:id` 端點
- `frontend/lib/api.ts` - API 客戶端設定

**注意**：此 Issue 將由另一個 Agent 先進行調查，調查完成後才會進入修復階段。

---

### 階段 3：Story 5.5 - Next Engine 商品建立改進與庫存 API 補強（✅ 已完成）

**目標**：改進商品建立 API 並補強庫存與倉庫相關 API

**狀態**：✅ **已完成**（地端測試通過 + 正式機測試通過）

**完成時間**：2025-11-13

**前置條件**：
- ✅ Story 5.1～5.3 已完成並通過 User Test
- ✅ Story 文件已更新完成

**實作重點**：
1. ✅ 改進建立商品 API，支援動態產生測試資料
2. ✅ 實作庫存與倉庫 API（查詢主倉、分倉、倉庫列表、更新庫存）
3. ✅ 在 `NextEngineAdapter` 中新增庫存相關方法
4. ✅ 撰寫測試腳本驗證功能

**關鍵修正**：
1. ✅ 修正 CSV 格式：使用官方英文欄位名稱（`kyoten_mei`, `syohin_code`, `kasan_su`, `gensan_su`, `kyoten_syohin_sakujyo`, `nyusyukko_riyu`）
2. ✅ 修正佇列狀態處理：`que_status_id = -1` 時返回 `success: true`（API 呼叫成功，但佇列處理失敗）
3. ✅ 改進錯誤處理：從多個欄位提取錯誤訊息，記錄完整錯誤資訊
4. ✅ 增強佇列查詢：返回完整欄位資訊

**驗收標準**：
- [x] 建立商品 API 支援動態產生測試資料✅
- [x] 所有庫存相關 API 可正確運作✅
- [x] User Test 通過後推上正式站✅
- [x] 正式機測試通過✅

**備註**：今天花了比較久時間在修正 CSV 格式和錯誤處理邏輯，但最終成功完成並通過測試。

---

### 階段 4：Story 5.6 - Next Engine 訂單 API 補強（待啟動）

**目標**：補強 Next Engine 訂單相關 API

**狀態**：⏸ 待下週繼續開發

**前置條件**：
- ✅ Story 5.5 已完成並通過 User Test

**實作重點**：
1. 實作查詢訂單 base API
2. 實作查詢訂單 rows（明細）API
3. 實作扣庫分析 API
4. 在 `NextEngineAdapter` 中新增訂單相關方法

---

### 階段 5：Story 5.7 - Next Engine 店舖建立改進與在庫連携接收端點（待啟動）

**目標**：改進店舖建立 API 並實作在庫連携接收端點

**狀態**：⏸ 待 Story 5.6 完成後啟動

**前置條件**：
- ⏳ Story 5.6 已完成

**實作重點**：
1. 改進建立店舖 API，支援動態產生測試資料
2. 實作在庫連携接收端點（GET `/UpdateStock.php`）
3. 實作簽名驗證邏輯（MD5）
4. 實作監控 API
5. 實作 Webhook 管理 UI（在 `webhook-test.tsx`）
6. 新增前端 Hooks 與 Components

---

## Human ↔ Agent 協作計畫

### Story 5.4
- **重構驗證**：Agent 完成重構與自動測試後，Human 進行回歸測試
- **User Test**：重構後再次跑一次 Shopline + Next Engine 的授權 / 資料讀取流程，確認無回歸

### Issue 2025-11-11-001
- **調查階段**：由另一個 Agent 先進行調查，釐清問題根源
- **修復階段**：調查完成後，再進行修復

### Story 5.5
- **開發階段**：Agent 完成商品建立改進與庫存 API 實作
- **User Test**：Human 進行 User Test，通過後推上正式站

### Story 5.6
- **開發階段**：Agent 完成訂單 API 實作
- **User Test**：Human 進行 User Test

### Story 5.7
- **開發階段**：Agent 完成店舖建立改進與在庫連携接收端點實作
- **User Test**：Human 進行 User Test

---

## 開發注意事項

### Story 5.4 開發重點

1. **參考實作**：
   - 參考 `NextEngineAdapter` 的實作方式（`backend/src/services/nextEngine.ts`）
   - 參考 `PlatformAdapter` 介面定義（`backend/src/types/platform.ts`）

2. **需要重構的路由**：
   - `backend/src/routes/auth.ts` - Shopline OAuth 相關路由
   - `backend/src/routes/api.ts` - Shopline API 相關路由
   - `backend/src/routes/webhook.ts` - Shopline Webhook 相關路由

3. **需要保留的邏輯**：
   - Shopline 的簽章驗證邏輯（`verifySignature`、`verifyGetSignature` 等）
   - Shopline 的錯誤處理邏輯
   - 現有的 `authPayload` 格式（backward-compatible）

4. **測試重點**：
   - OAuth 授權流程
   - Token 刷新流程
   - API 呼叫（Products、Orders、Store Info、Locations）
   - Webhook 驗證與處理

---

## 風險與備註

### Story 5.4
- ⚠️ 重構期間需特別注意 Shopline 正式環境授權流程不可中斷
- ⚠️ 建議在非尖峰時間佈署，並保留 rollback 策略
- ⚠️ 確保 backward-compatible，避免破壞既有 Connection

### Issue 2025-11-11-001
- ⚠️ 可能是 CORS 設定問題，需要檢查後端 CORS 配置
- ⚠️ 可能是 PATCH 方法未在 CORS 允許的方法列表中

### Story 5.5
- ⚠️ 完成後進行 User Test，通過後推上正式站
- ⚠️ 僅包含商品建立改進與庫存 API，不包含店舖建立與在庫連携

### Story 5.6
- ⚠️ 待 Story 5.5 完成後才能啟動

### Story 5.7
- ⚠️ 待 Story 5.6 完成後才能啟動
- ⚠️ 包含店舖建立改進、在庫連携接收端點、Webhook 管理 UI

---

## 交付與文件更新

### Story 5.4
- [ ] 更新 `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md` 中的「共用架構」章節，標註 Shopline 已切換至 adapter
- [ ] 更新 `docs/memory/decisions/connection-data-model.md`（或另建決策補充段落）說明 Shopline 遷移完成
- [ ] 如有抽取共用工具，於 `docs/reference/guides/NE-OVERVIEW.md` 或新文件補充說明

---

---

## Story 5.4 實作細節與問題清單

### 已完成的重構（代碼層面）

1. **ShoplineAdapter 建立** (`backend/src/services/shoplineAdapter.ts`)
   - ✅ 實作 `PlatformAdapter` 介面：`getAuthorizeUrl`, `exchangeToken`, `refreshToken`, `getIdentity`
   - ✅ 新增 API 方法：`getStoreInfoFromAPI`, `getProducts`, `getProduct`, `createProduct`, `getOrders`, `createOrder`, `getLocations`
   - ✅ 新增 Webhook 方法：`verifyWebhookSignature`, `subscribeWebhook`, `unsubscribeWebhook`, `getSubscribedWebhooks`, `getWebhookCount`
   - ✅ 所有方法接收 `accessToken` 和 `handle` 作為參數，不依賴資料庫

2. **PlatformServiceFactory 更新** (`backend/src/services/platformServiceFactory.ts`)
   - ✅ 註冊 ShoplineAdapter
   - ✅ 初始化時處理 Next Engine 環境變數缺失的情況（不影響 Shopline）

3. **Routes 重構**
   - ✅ `routes/auth.ts`：OAuth 流程使用 `PlatformServiceFactory.getAdapter('shopline')`
   - ✅ `routes/api.ts`：所有 Shopline API 呼叫改為使用 `ShoplineAdapter`，先透過 `ShoplineService.getStoreByHandle()` 取得 accessToken
   - ✅ `routes/webhook.ts`：Webhook 操作改為使用 `ShoplineAdapter`

4. **應用啟動初始化** (`backend/src/index.ts`)
   - ✅ 在應用啟動時呼叫 `PlatformServiceFactory.initialize()`

### ⚠️ 已知問題與風險

#### 1. 未進行實際測試
- ❌ **只做了代碼結構檢查（方法存在性），沒有實際呼叫 API 測試**
- ❌ **沒有啟動伺服器進行端到端測試**
- ❌ **沒有驗證 OAuth 流程是否正常運作**
- ❌ **沒有驗證 API 呼叫是否正常運作**
- ❌ **沒有驗證 Webhook 功能是否正常運作**

#### 2. 可能的邏輯問題

**問題 A：routes/api.ts 中的錯誤處理**
- 所有 API 端點都需要先呼叫 `shoplineService.getStoreByHandle(handle)`
- 如果 store 不存在，會返回 404，但沒有驗證 `store.accessToken` 是否存在
- 如果 `store.accessToken` 為 null 或 undefined，傳給 Adapter 可能會導致錯誤

**問題 B：routes/webhook.ts 中的錯誤處理**
- Webhook 訂閱相關端點也需要先取得 store
- 如果 store 不存在或 accessToken 無效，錯誤處理可能不完整

**問題 C：routes/auth.ts 中的邏輯**
- 已重構為使用 PlatformServiceFactory，但沒有實際測試 OAuth 流程
- 可能會有型別轉換問題或邏輯錯誤

#### 3. TypeScript 編譯錯誤（測試檔案）
- ⚠️ `backend/src/routes/__tests__/next-engine-auth.test.ts` - `afterEach` 未定義
- ⚠️ `backend/src/routes/__tests__/next-engine-data.test.ts` - `afterEach` 未定義
- ⚠️ `backend/src/services/__tests__/nextEngine.test.ts` - 多處 TypeScript 錯誤（error 屬性不存在）

#### 4. 伺服器啟動問題
- ⚠️ 後端伺服器啟動時，Next Engine Adapter 初始化失敗（環境變數未設定），但這不影響 Shopline
- ⚠️ **沒有成功啟動前端和後端伺服器供 User Test**
- ⚠️ **無法確認伺服器是否正常運作**

#### 5. 代碼結構檢查結果（僅供參考）
- ✅ ShoplineAdapter 實例化成功（使用測試環境變數）
- ✅ PlatformServiceFactory 註冊成功
- ✅ 所有 API 方法存在性檢查通過
- ✅ 所有 Webhook 方法存在性檢查通過
- ✅ Linter 檢查無錯誤（主要代碼）

### 🔴 待其他 Agent 處理的項目

1. **實際測試 OAuth 授權流程**
   - `/api/auth/shopline/authorize` - 生成授權 URL
   - `/api/auth/shopline/callback` - 處理授權回調
   - `/api/auth/shopline/install` - 安裝流程

2. **實際測試 API 端點功能**
   - `GET /api/stores/:handle/info` - 取得商店資訊
   - `GET /api/stores/:handle/products` - 取得產品列表
   - `GET /api/stores/:handle/orders` - 取得訂單列表
   - `POST /api/stores/:handle/products` - 建立產品
   - `POST /api/stores/:handle/orders` - 建立訂單
   - `GET /api/stores/:handle/locations` - 取得地點列表

3. **實際測試 Webhook 功能**
   - `POST /webhook/shopline` - 接收 Webhook（簽名驗證）
   - `POST /webhook/subscribe` - 訂閱 Webhook
   - `GET /webhook/subscribe` - 取得訂閱列表

4. **修復可能的問題**
   - 檢查並修復 `routes/api.ts` 和 `routes/webhook.ts` 中的錯誤處理邏輯
   - 驗證 `store.accessToken` 是否存在和有效
   - 確保所有錯誤情況都有適當的處理

5. **啟動前端和後端伺服器**
   - 確保後端伺服器正常啟動在 port 3001
   - 確保前端伺服器正常啟動在 port 3000
   - 進行 User Test

### 📋 重構後的代碼變更摘要

**新增檔案**：
- `backend/src/services/shoplineAdapter.ts` - ShoplineAdapter 實作

**修改檔案**：
- `backend/src/services/platformServiceFactory.ts` - 註冊 ShoplineAdapter
- `backend/src/routes/auth.ts` - 使用 PlatformServiceFactory
- `backend/src/routes/api.ts` - 使用 ShoplineAdapter（所有 Shopline API）
- `backend/src/routes/webhook.ts` - 使用 ShoplineAdapter（Webhook 操作）
- `backend/src/index.ts` - 初始化 PlatformServiceFactory

**保留檔案**：
- `backend/src/services/shopline.ts` - 保留用於資料庫操作

---

**最後更新**: 2025-11-13
