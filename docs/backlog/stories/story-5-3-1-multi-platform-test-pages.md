# Story 5.3.1: 多平台測試頁面整合

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: 🛠 planning  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 3 個工作天

---

## Story 描述

修正 Webhook、Event、API 測試頁面，讓它們能夠配合多平台運作，跟隨 Context Bar 的 Connection 選擇，並根據 platform 動態調整顯示和 API 端點。同時實作 Next Engine 的 API 測試功能。

> 參考文件：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`、`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`

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
- **實作 Next Engine API 測試功能**：
  - 取得 Connection Items（`GET /api/connections/:id/items`）
  - 取得訂單摘要（`GET /api/connections/:id/orders/summary`）
  - 取得公司資訊（透過 `getIdentity`，可新增後端 API 或直接使用現有邏輯）
  - 取得店舖列表（透過 `getShops`，可新增後端 API 或直接使用現有邏輯）
- 當 platform 為 `next-engine` 時，顯示 Next Engine 專屬的 API 測試選項
- 當 platform 為 `shopline` 時，保持現有的 Shopline API 測試功能

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

**需要實作的 API 測試**：
1. **取得 Connection Items**
   - 端點：`GET /api/connections/:id/items`
   - 用途：顯示 Next Engine 店舖列表

2. **取得訂單摘要**
   - 端點：`GET /api/connections/:id/orders/summary`
   - 用途：顯示訂單總數和最近更新時間

3. **取得公司資訊**（可選，視後端 API 是否已實作）
   - 端點：可新增 `GET /api/connections/:id/identity` 或使用現有邏輯
   - 用途：顯示公司名稱和 ID

4. **取得店舖列表**（可選，視後端 API 是否已實作）
   - 端點：可新增 `GET /api/connections/:id/shops` 或使用現有邏輯
   - 用途：顯示詳細店舖資訊

**空態設計**：
- 當 platform 為 `next-engine` 且沒有明確的 API 定義時，顯示空態
- 空態應包含：
  - 基本架構（標題、說明）
  - 提示訊息：「Next Engine API 測試功能開發中」
  - 保留未來擴充的空間

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
- [ ] 頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
- [ ] 當 platform 為 `next-engine` 時，顯示 Next Engine API 測試選項
- [ ] Next Engine API 測試功能實作完成：
  - [ ] 取得 Connection Items
  - [ ] 取得訂單摘要
  - [ ] 取得公司資訊（如已實作）
  - [ ] 取得店舖列表（如已實作）
- [ ] 當 platform 為 `shopline` 時，保持現有的 Shopline API 測試功能

### User Test

- [ ] 切換 Connection 時，所有測試頁面正確更新
- [ ] Next Engine Connection 選擇後，頁面顯示正確的空態或功能
- [ ] Shopline Connection 選擇後，頁面功能正常運作
- [ ] Event 頁面只顯示當前 Connection 的事件

---

## 交付與文件更新

- [ ] 更新 `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md` 的多平台測試頁面章節
- [ ] 更新 `docs/backlog/inbox/note-2025-11-12-001-next-engine-issues.md`，標記問題已解決

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
- `frontend/hooks/useWebhookEvents.ts` - Webhook 事件 Hook
- `frontend/stores/useConnectionStore.ts` - Connection 狀態管理
- `frontend/hooks/useSelectedConnection.ts` - 取得當前選中的 Connection

### 後端檔案
- `backend/src/routes/api.ts` - API 路由（需要新增或修改 Event 過濾邏輯）
- `backend/src/routes/webhook.ts` - Webhook 路由（可能需要修改 Event 查詢）

### 相關 Story
- [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](./story-5-2-next-engine-connection-data.md)
- [Story 5.3: 前端 Connection UX 延伸與重新授權整合](./story-5-3-next-engine-ux.md)

