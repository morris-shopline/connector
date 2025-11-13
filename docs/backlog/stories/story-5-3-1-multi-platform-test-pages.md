# Story 5.3.1: 多平台測試頁面整合

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ✅ ready-for-user-test  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 3 個工作天

---

## Story 描述

修正 Webhook、Event、API 測試頁面，讓它們能夠配合多平台運作，跟隨 Context Bar 的 Connection 選擇，並根據 platform 動態調整顯示和 API 端點。同時實作 Next Engine 的 API 測試功能。

> 參考文件：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 🔧 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含 API 測試功能的端到端實作）

---

## 前情提要

- Story 5.1, 5.2, 5.3 已完成 Next Engine OAuth、Connection 建立和前端整合
- 目前 Webhook、Event、API 測試頁面仍使用舊的「商店選擇」邏輯，沒有跟隨 Context Bar
- 這些頁面目前都當作 Shopline 處理，無法支援 Next Engine
- Event 頁面甚至連 Shopline 自己的 Connection 切換都會顯示錯誤的事件（A Connection 會看到 B Connection 的事件）

---

## 依賴與前置條件

1. Story 5.1, 5.2, 5.3 已完成並通過 User Test
2. `useConnectionStore` 已提供 Connection 狀態管理
3. Context Bar 已正確顯示選中的 Connection
4. Story 5.2 的後端 API 已實作並可用

---

## 範圍定義

### ✅ 包含

#### 1. Webhook 測試頁面修正
- 將「商店選擇」改為「連線選擇」，跟隨 `useConnectionStore` 的 `selectedConnectionId`
- 根據 `selectedConnection.platform` 動態調整 Webhook 訂閱邏輯
- 當 platform 為 `next-engine` 時，顯示空態（保留基本架構，但先不定義明確細節）
- 修正 Webhook 事件過濾，確保只顯示當前 Connection 的事件

#### 2. Event 頁面修正
- 跟隨 `useConnectionStore` 的 `selectedConnectionId`
- 修正事件過濾邏輯，確保只顯示當前 Connection 的事件（修正 Shopline A 會看到 B 的問題）
- 根據 `selectedConnection.platform` 動態調整顯示
- 當 platform 為 `next-engine` 時，顯示空態

#### 3. API 測試頁面修正與 Next Engine API 實作
- 將「商店選擇」改為「連線選擇」，跟隨 `useConnectionStore` 的 `selectedConnectionId`
- 根據 `selectedConnection.platform` 動態調整 API 端點和邏輯
- **實作 Next Engine API 測試功能**（對應 Story 5.2 的 API 操作摘要）：
  - **取得店舖列表**：`POST https://api.next-engine.org/api_v1_master_shop/search`
    - 參數：`access_token`, `fields=shop_id,shop_name,...`
    - 用途：查詢 Next Engine 店舖清單
  - **建立店舖**：`POST https://api.next-engine.org/api_v1_master_shop/create`
    - 參數：`access_token`, `data=<XML>`, `wait_flag=1`
    - 用途：建立新的 Next Engine 店舖
  - **建立商品**：`POST https://api.next-engine.org/api_v1_master_goods/upload`
    - 參數：`access_token`, `data_type=csv`, `data=<CSV>`, `wait_flag=1`
    - 用途：上傳 CSV 格式的商品資料
  - **查詢商品**：`POST https://api.next-engine.org/api_v1_master_goods/search`
    - 參數：`access_token`, `fields=goods_id,goods_name,...`, `goods_id-eq`
    - 用途：查詢 Next Engine 商品資料
- 當 platform 為 `next-engine` 時，顯示 Next Engine 專屬的 API 測試選項
- 當 platform 為 `shopline` 時，保持現有的 Shopline API 測試功能
- **注意**：這些 API 測試功能需要透過後端代理呼叫 Next Engine API（使用 Connection 的 `accessToken`）

### ❌ 不包含

- Next Engine Webhook 的完整實作（Phase 2）
- Next Engine 其他進階 API（Story 5.5）
- 多平台共用抽象與動態路由重構（Phase 2）

---

## 技術重點與實作要點

### 1. 統一 Connection 選擇邏輯

**問題**：
- 目前 `webhook-test.tsx`、`admin-api-test.tsx`、`events.tsx` 都使用獨立的 store selection 邏輯
- 沒有跟隨 Context Bar 的 `selectedConnectionId`

**解決方案**：
- 移除獨立的 store selection，改用 `useConnectionStore` 的 `selectedConnectionId`
- 使用 `useSelectedConnection` hook 取得當前選中的 Connection
- 確保這些頁面與 Connection Dashboard 的選擇狀態同步

### 2. 平台動態切換

**問題**：
- 目前所有頁面都假設 platform 為 `shopline`
- 沒有根據 `selectedConnection.platform` 調整邏輯

**解決方案**：
- 檢查 `selectedConnection.platform`
- 根據 platform 動態調整：
  - API 端點（Shopline vs Next Engine）
  - 資料格式（Shopline handle vs Next Engine companyId）
  - UI 顯示（平台專屬的文案和選項）

### 3. Event 過濾修正

**問題**：
- `useWebhookEvents` 目前沒有過濾 `connectionId`
- 導致 A Connection 會看到 B Connection 的事件

**解決方案**：
- 修改 `useWebhookEvents` hook，接受 `connectionId` 參數
- 修改後端 API `GET /api/webhooks/events`，支援 `connectionId` 查詢參數
- 前端根據 `selectedConnectionId` 過濾事件

### 4. Next Engine API 測試實作

**需要實作的 API 測試**（對應 Story 5.2 的 API 操作摘要）：

1. **取得店舖列表** ✅ 已完成
   - Next Engine API：`POST https://api.next-engine.org/api_v1_master_shop/search`
   - 參數：`access_token`, `fields=shop_id,shop_name,shop_abbreviated_name,shop_note`
   - 實作方式：透過後端代理 API `POST /api/connections/:connectionId/shops/search`
   - 用途：查詢 Next Engine 店舖清單
   - 前端 UI：Fields 參數輸入欄位（預設值已提供）

2. **建立店舖** ✅ 已完成
   - Next Engine API：`POST https://api.next-engine.org/api_v1_master_shop/create`
   - 參數：`access_token`, `data=<XML>`, `wait_flag=1`
   - 實作方式：透過後端代理 API `POST /api/connections/:connectionId/shops/create`
   - 用途：建立新的 Next Engine 店舖（測試用）
   - 前端 UI：XML 資料輸入 textarea（含 XML 範本）

3. **建立商品** ✅ 已完成
   - Next Engine API：`POST https://api.next-engine.org/api_v1_master_goods/upload`
   - 參數：`access_token`, `data_type=csv`, `data=<CSV>`, `wait_flag=1`
   - 實作方式：透過後端代理 API `POST /api/connections/:connectionId/goods/upload`
   - 用途：上傳 CSV 格式的商品資料（測試用）
   - 前端 UI：CSV 資料輸入 textarea（含 CSV 範本）

4. **查詢商品** ✅ 已完成
   - Next Engine API：`POST https://api.next-engine.org/api_v1_master_goods/search`
   - 參數：`access_token`, `fields=goods_id,goods_name,...`, `goods_id-eq`（可選）, `offset`, `limit`
   - 實作方式：透過後端代理 API `POST /api/connections/:connectionId/goods/search`
   - 用途：查詢 Next Engine 商品資料
   - 前端 UI：Fields、Goods ID、Offset、Limit 參數輸入欄位

**實作要點**：
- 所有 Next Engine API 呼叫都需要透過後端代理（使用 Connection 的 `accessToken`）
- 後端需要新增對應的代理 API 端點（例如 `/api/connections/:id/shops/search`，**注意：不使用 `/test/` 前綴，因為這些是業務可用的 API**）
- 前端 API 測試頁面提供 UI 讓使用者輸入參數並查看結果
- 參考 Story 5.2 的 API 操作摘要和 `NEXTENGINE_API_REFERENCE.md` 的格式要求

**實作完成狀態**（2025-11-12 晚間恢復）：
- ✅ 後端 4 個代理 API 端點已實作完成：
  - `POST /api/connections/:connectionId/shops/search`
  - `POST /api/connections/:connectionId/shops/create`
  - `POST /api/connections/:connectionId/goods/search`
  - `POST /api/connections/:connectionId/goods/upload`
- ✅ 後端錯誤處理已正確實作：
  - 檢查 Next Engine API 回應的 `code` 欄位（`code !== '000000'` 表示錯誤）
  - 檢查 `result` 欄位（`result !== 'success'` 表示錯誤）
  - 錯誤訊息優先順序：`error_description` → `error` → `message` → 預設訊息
- ✅ 前端平台 API 配置系統已建立（`api-configs.ts`）：
  - 定義 `PlatformApiConfig`、`ApiGroup`、`ApiFunction` 類型
  - 實作 `shoplineApiConfig` 和 `nextEngineApiConfig`
  - 提供 `getPlatformApiConfig()` 函數
- ✅ 前端動態 API 功能顯示已實作：
  - 根據 `selectedConnection.platform` 動態載入對應配置
  - 自動展開所有 API 群組
  - 將設定檔轉換為舊格式以相容現有邏輯
- ✅ Next Engine API 參數輸入 UI 已實作：
  - 取得店舖列表：Fields 參數輸入
  - 建立店舖：XML 資料輸入（含範本）
  - 查詢商品：Fields、Goods ID、Offset、Limit 參數輸入
  - 建立商品：CSV 資料輸入（含範本）
- ✅ Next Engine API 呼叫邏輯已實作：
  - 使用 `getBackendUrl()` 取得後端 URL
  - 透過 `fetch` API 呼叫後端代理端點
  - 正確處理 Next Engine API 回應格式
- ✅ 連線選擇器組件已建立（`ConnectionSelectorDropdown`）：
  - 可在任何頁面切換連線
  - 與 ContextBar 自動同步

---

## 驗收標準

### Agent 自動化 / 測試

#### Webhook 測試頁面
- [ ] 頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
- [ ] 當 platform 為 `next-engine` 時，顯示空態
- [ ] 當 platform 為 `shopline` 時，保持現有功能
- [ ] Webhook 事件只顯示當前 Connection 的事件

#### Event 頁面
- [ ] 頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
- [ ] 事件過濾正確，A Connection 不會看到 B Connection 的事件
- [ ] 當 platform 為 `next-engine` 時，顯示空態
- [ ] 當 platform 為 `shopline` 時，保持現有功能

#### API 測試頁面
- [x] 頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
- [x] 當 platform 為 `next-engine` 時，顯示 Next Engine API 測試選項
- [x] Next Engine API 測試功能實作完成（對應 Story 5.2 的 4 個 API）：
  - [x] 取得店舖列表（`api_v1_master_shop/search`）
  - [x] 建立店舖（`api_v1_master_shop/create`）
  - [x] 建立商品（`api_v1_master_goods/upload`）
  - [x] 查詢商品（`api_v1_master_goods/search`）
- [x] 後端代理 API 端點實作完成（透過 Connection 的 `accessToken` 呼叫 Next Engine API）
- [x] 當 platform 為 `shopline` 時，保持現有的 Shopline API 測試功能

### User Test

- [ ] 切換 Connection 時，所有測試頁面正確更新
- [ ] Next Engine Connection 選擇後，頁面顯示正確的空態或功能
- [ ] Shopline Connection 選擇後，頁面功能正常運作
- [ ] Event 頁面只顯示當前 Connection 的事件

---

## 交付與文件更新

- [x] 更新 `docs/context/current-run.md`，記錄 Story 5.3.1 的開發進度與恢復內容
- [x] 更新 `docs/backlog/stories/story-5-3-1-multi-platform-test-pages.md`，標記完成項目
- [ ] 更新 `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md` 的多平台測試頁面章節（待後續補齊）
- [ ] 更新 `docs/backlog/inbox/note-2025-11-12-001-next-engine-issues.md`，標記問題已解決（待後續補齊）

---

## 風險與備註

- Next Engine Webhook 機制尚未實作，Webhook 測試頁面在 Next Engine 下只能顯示空態
- Event 頁面的後端 API 需要支援 `connectionId` 過濾，可能需要修改資料庫查詢邏輯
- API 測試頁面的 Next Engine API 選項需要與 Story 5.2 的後端 API 對應

---

## 相關檔案

### 前端檔案
- `frontend/pages/webhook-test.tsx` - Webhook 測試頁面
- `frontend/pages/events.tsx` - Event 頁面
- `frontend/pages/admin-api-test.tsx` - API 測試頁面
- `frontend/components/connections/ConnectionSelectorDropdown.tsx` - 連線選擇器組件（新增）
- `frontend/content/platforms/api-configs.ts` - 平台 API 配置檔案（新增）
- `frontend/hooks/useWebhookEvents.ts` - Webhook 事件 Hook
- `frontend/stores/useConnectionStore.ts` - Connection 狀態管理
- `frontend/hooks/useSelectedConnection.ts` - 取得當前選中的 Connection
- `frontend/lib/api.ts` - API 工具函數（export `getBackendUrl`）

### 後端檔案
- `backend/src/routes/api.ts` - API 路由（新增 Next Engine API 代理端點）
- `backend/src/routes/webhook.ts` - Webhook 路由（可能需要修改 Event 查詢）

### 相關 Story
- [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](./story-5-2-next-engine-connection-data.md)
- [Story 5.3: 前端 Connection UX 延伸與重新授權整合](./story-5-3-next-engine-ux.md)

---

## 實作記錄（2025-11-12）

### 功能恢復記錄

**背景**：開發過程中進行了過度重構（將 sidebar 拆分成獨立組件），導致功能被破壞。用戶要求恢復到「根據不同平台呈現不同的 API 內容」的狀態。

**恢復的檔案**：
- `frontend/components/connections/ConnectionSelectorDropdown.tsx` - 連線選擇器組件
- `frontend/content/platforms/api-configs.ts` - 平台 API 配置檔案
- `backend/src/routes/api.ts` - 新增 4 個 Next Engine API 代理端點
- `frontend/pages/admin-api-test.tsx` - 整合平台配置系統和動態 API 功能顯示
- `frontend/lib/api.ts` - export `getBackendUrl` 函數

**未恢復的內容**：
- sidebar 拆分成 `FunctionSidebar` 和 `WorkspaceLayout` 的大改動（用戶明確指示不要恢復）

### 技術決策

1. **後端 API 端點命名**：
   - 不使用 `/test/` 前綴，因為這些是業務可用的 API
   - 端點格式：`/api/connections/:connectionId/shops/search`（而非 `/api/connections/:connectionId/test/shops/search`）

2. **錯誤處理**：
   - Next Engine API 回應格式：`{ result: 'success', code: '000000', data: { ... } }`
   - 錯誤檢查順序：先檢查 `code !== '000000'`，再檢查 `result !== 'success'`
   - 錯誤訊息優先順序確保使用者能看到最詳細的錯誤資訊

3. **平台 API 配置系統**：
   - 集中管理不同平台的 API 功能定義
   - 保留 Shopline 舊格式的 fallback，確保向後相容
   - 未來可擴展支援更多平台

