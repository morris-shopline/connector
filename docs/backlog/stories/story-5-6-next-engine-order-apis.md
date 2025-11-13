# Story 5.6: Next Engine 訂單 API 補強

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: 🟡 in-progress  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2-3 個工作天（包含前端整合）

---

## Story 描述

在 Story 5.2 完成訂單摘要後，補強 Next Engine 訂單相關 API，包括查詢訂單 base、查詢訂單 rows（明細）、扣庫分析等功能。

**目標**：讓 admin 可以方便地查詢和分析 Next Engine 訂單資料。

> 📌 **參考文件**：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 📌 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含訂單 API 的端到端流程）

---

## 前情提要

### 現有實作狀況

**已實作的 Next Engine API**：
- ✅ OAuth 授權流程（Story 5.1）
- ✅ 查詢店舖列表（Story 5.2）
- ✅ 查詢商品（Story 5.2）
- ✅ 建立商品（Story 5.2，Story 5.5 改進）
- ✅ 訂單摘要（Story 5.2，在 adapter 中）

**問題點**：
- 訂單摘要僅提供總數和最近更新時間
- 缺少訂單明細查詢功能
- 缺少訂單扣庫分析功能

---

## 依賴與前置條件

1. Story 5.1～5.5 已完成並通過 User Test。  
2. Sandbox 環境可穩定建立商品與店舖，並可在 Next Engine 後台查詢資料。

---

## 範圍定義

### ✅ 包含

1. **查詢訂單 Base** (`/api/connections/:connectionId/orders/base`)
   - NextEngine API：`/api_v1_receiveorder_base/search`
   - 支援查詢參數：`shopId`, `orderId`, `dateFrom`, `dateTo`（可選）
   - 預設欄位：`receive_order_shop_id`, `receive_order_id`, `receive_order_date`, `receive_order_total_amount` 等
   - 支援分頁：`offset`, `limit`

2. **查詢訂單 Rows（明細）** (`/api/connections/:connectionId/orders/rows`)
   - NextEngine API：`/api_v1_receiveorder_row/search`
   - 支援查詢參數：`orderId`, `productCode`, `shopId`（可選）
   - 預設欄位：
     - `receive_order_row_receive_order_id`
     - `receive_order_row_shop_cut_form_id`
     - `receive_order_row_no`
     - `receive_order_row_goods_id`
     - `receive_order_row_quantity`
     - `receive_order_row_cancel_flag`
     - `receive_order_row_stock_allocation_quantity`
     - `receive_order_row_stock_allocation_date`
     - `receive_order_row_creation_date`
     - `receive_order_row_last_modified_date`
   - 支援分頁：`offset`, `limit`

3. **扣庫分析** (`/api/connections/:connectionId/orders/analyze-allocation`)
   - NextEngine API：`/api_v1_receiveorder_row/search`（用於查詢）
   - 請求體：`productCode`（商品代碼）
   - **流程**：
     1. 呼叫 `/api_v1_receiveorder_row/search`，條件為：
        - `receive_order_row_goods_id-eq=<productCode>`
        - `receive_order_row_cancel_flag-eq=0`（排除已取消）
     2. 分析每筆訂單的 `quantity` 與 `stock_allocation_quantity`，分類為：
        - 未扣庫：`stock_allocation_quantity = 0`
        - 部分扣庫：`0 < stock_allocation_quantity < quantity`
        - 已扣庫：`stock_allocation_quantity = quantity`
        - 扣庫異常：`stock_allocation_quantity > quantity`
     3. 回傳統計結果、總量與原始列資料

4. **Adapter 層方法擴充**
   - 在 `NextEngineAdapter` 中新增以下方法：
     - `getOrderBase(accessToken, options?)` - 查詢訂單 base
     - `getOrderRows(accessToken, options?)` - 查詢訂單 rows
     - `analyzeStockAllocation(accessToken, productCode)` - 扣庫分析

5. **前端 API 客戶端整合**（`frontend/lib/api.ts`）
   - 新增 `getOrderBase(connectionId, params?)` - 查詢訂單 base
   - 新增 `getOrderRows(connectionId, params?)` - 查詢訂單 rows
   - 新增 `analyzeStockAllocation(connectionId, productCode)` - 扣庫分析

6. **前端 API 配置整合**（`frontend/content/platforms/api-configs.ts`）
   - 在 `nextEngineApiConfig` 中新增 `orders` 群組：
     - `neGetOrderBase` - 查詢訂單 Base
     - `neGetOrderRows` - 查詢訂單 Rows（明細）
     - `neAnalyzeStockAllocation` - 扣庫分析
   - 配置查詢參數（shopId, orderId, dateFrom, dateTo, productCode 等）

7. **前端測試頁面整合**（`frontend/pages/admin-api-test.tsx`）
   - 在 Next Engine API 的 switch case 中加入訂單相關 API 的處理邏輯
   - 支援查詢參數輸入（shopId, orderId, dateFrom, dateTo, productCode 等）
   - 顯示查詢結果和扣庫分析結果

8. **測試腳本與文件**
   - 更新測試腳本 `backend/scripts/test-next-engine-apis.ts`
   - 提供 CLI 命令測試訂單相關 API
   - 記錄測試結果到 audit log
   - 更新 `NE-OVERVIEW.md` 補充訂單 API 測試操作步驟

### ❌ 不包含
- 訂單建立或更新功能（Next Engine 訂單通常由外部系統建立）
- 複雜的前端 UI/UX 調整（僅在 admin-api-test 頁面整合，follow 既有架構）

---

## 驗收標準

### Agent 自動化 / 測試
- [x] 查詢訂單 base API 可正確查詢訂單資訊 ✅ 已完成並測試通過
- [x] 查詢訂單 rows API 可正確查詢訂單明細 ✅ 已完成並測試通過
- [x] 扣庫分析 API 可正確分析扣庫狀態 ✅ 已完成並測試通過
- [x] 前端 API 客戶端方法可正確呼叫後端 API ✅ 已完成並測試通過
- [x] 前端 API 配置正確顯示在 admin-api-test 頁面 ✅ 已完成並測試通過
- [x] 前端測試頁面可正確處理訂單相關 API 呼叫 ✅ 已完成並測試通過
- [ ] 測試腳本驗證所有訂單相關 API 的成功與錯誤情境 ⏳ 待完成
- [ ] 將結果記錄於審計或 log，供除錯追蹤 ⏳ 待完成

### User Test
- [ ] Human 在 admin-api-test 頁面選擇 Next Engine Connection
- [ ] Human 確認「訂單」群組顯示三個 API 功能（查詢 Base、查詢 Rows、扣庫分析）
- [ ] Human 確認查詢訂單 base API 可正確取得訂單資料
- [ ] Human 確認查詢訂單 rows API 可正確取得訂單明細
- [ ] Human 確認扣庫分析可正確分類訂單狀態並顯示結果
- [ ] Human 確認在 Next Engine 後台可驗證查詢結果

---

## 交付與文件更新

### 程式碼交付
- [x] `NextEngineAdapter` 新增訂單相關方法 ✅ 已完成（`getOrderBase`, `getOrderRows`, `analyzeStockAllocation`）
- [x] `backend/src/routes/api.ts` 新增訂單 API 路由 ✅ 已完成（`/orders/base`, `/orders/rows`, `/orders/analyze-allocation`）
- [x] `frontend/lib/api.ts` 新增訂單 API 客戶端方法 ✅ 已完成（`getOrderBase`, `getOrderRows`, `analyzeStockAllocation`）
- [x] `frontend/content/platforms/api-configs.ts` 新增 Next Engine orders 群組配置 ✅ 已完成
- [x] `frontend/pages/admin-api-test.tsx` 整合訂單 API 處理邏輯 ✅ 已完成
- [ ] 更新測試腳本 `backend/scripts/test-next-engine-apis.ts` ⏳ 待完成

### 文件更新
- [ ] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md`：
  - 補充訂單 API 規格
- [ ] 更新 `NE-OVERVIEW.md`：
  - 補充訂單 API 測試操作步驟
  - 補充扣庫分析使用範例
- [ ] 更新 `NEXTENGINE_API_REFERENCE.md`：
  - 補充訂單 API 參數說明

---

## 實作重點與技術細節

### 後端實作

#### 訂單查詢流程

1. **查詢訂單 Base**：
   - 使用 `/api_v1_receiveorder_base/search`
   - 支援多種查詢條件（shopId, orderId, dateFrom, dateTo）
   - 回傳訂單基本資訊

2. **查詢訂單 Rows**：
   - 使用 `/api_v1_receiveorder_row/search`
   - 可依訂單 ID 或商品代碼查詢
   - 回傳訂單明細資訊

3. **扣庫分析**：
   - 先查詢訂單 rows
   - 分析每筆訂單的扣庫狀態
   - 分類並統計結果

#### 錯誤處理

- **查詢條件為空**：自動刪除空值避免 Next Engine API 400 錯誤
- **訂單不存在**：回傳空陣列而非錯誤
- **API 錯誤**：統一轉換為 `PLATFORM_ERROR` 並記錄

### 前端實作

#### API 客戶端方法（`frontend/lib/api.ts`）

參考現有的 Next Engine API 方法（如 `searchGoods`, `uploadGoods`），新增：

```typescript
async getOrderBase(connectionId: string, params?: {
  shopId?: string
  orderId?: string
  dateFrom?: string
  dateTo?: string
  offset?: number
  limit?: number
}): Promise<ApiResponse<any>>

async getOrderRows(connectionId: string, params?: {
  orderId?: string
  productCode?: string
  shopId?: string
  offset?: number
  limit?: number
}): Promise<ApiResponse<any>>

async analyzeStockAllocation(connectionId: string, productCode: string): Promise<ApiResponse<any>>
```

#### API 配置（`frontend/content/platforms/api-configs.ts`）

在 `nextEngineApiConfig.groups` 中新增 orders 群組：

```typescript
{
  id: 'orders',
  name: '訂單',
  functions: [
    {
      id: 'neGetOrderBase',
      name: '查詢訂單 Base',
      group: 'orders',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/base`,
      hasBody: true,
      paramConfig: [
        { id: 'shopId', label: 'Shop ID（選填）', type: 'text' },
        { id: 'orderId', label: 'Order ID（選填）', type: 'text' },
        { id: 'dateFrom', label: '開始日期（選填）', type: 'text', placeholder: 'YYYY-MM-DD' },
        { id: 'dateTo', label: '結束日期（選填）', type: 'text', placeholder: 'YYYY-MM-DD' },
        { id: 'offset', label: 'Offset（選填）', type: 'text', defaultValue: '0' },
        { id: 'limit', label: 'Limit（選填）', type: 'text', defaultValue: '100' }
      ]
    },
    {
      id: 'neGetOrderRows',
      name: '查詢訂單 Rows（明細）',
      group: 'orders',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/rows`,
      hasBody: true,
      paramConfig: [
        { id: 'orderId', label: 'Order ID（選填）', type: 'text' },
        { id: 'productCode', label: 'Product Code（選填）', type: 'text' },
        { id: 'shopId', label: 'Shop ID（選填）', type: 'text' },
        { id: 'offset', label: 'Offset（選填）', type: 'text', defaultValue: '0' },
        { id: 'limit', label: 'Limit（選填）', type: 'text', defaultValue: '100' }
      ]
    },
    {
      id: 'neAnalyzeStockAllocation',
      name: '扣庫分析',
      group: 'orders',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/analyze-allocation`,
      hasBody: true,
      paramConfig: [
        { id: 'productCode', label: 'Product Code（必填）', type: 'text' }
      ]
    }
  ]
}
```

#### 測試頁面整合（`frontend/pages/admin-api-test.tsx`）

在 Next Engine API 的 switch case 中新增處理邏輯：

```typescript
case 'neGetOrderBase': {
  result = await apiClient.getOrderBase(connectionId, {
    shopId: paramValues.shopId,
    orderId: paramValues.orderId,
    dateFrom: paramValues.dateFrom,
    dateTo: paramValues.dateTo,
    offset: paramValues.offset ? parseInt(paramValues.offset) : undefined,
    limit: paramValues.limit ? parseInt(paramValues.limit) : undefined
  })
  break
}
case 'neGetOrderRows': {
  result = await apiClient.getOrderRows(connectionId, {
    orderId: paramValues.orderId,
    productCode: paramValues.productCode,
    shopId: paramValues.shopId,
    offset: paramValues.offset ? parseInt(paramValues.offset) : undefined,
    limit: paramValues.limit ? parseInt(paramValues.limit) : undefined
  })
  break
}
case 'neAnalyzeStockAllocation': {
  if (!paramValues.productCode) {
    setError('請輸入 Product Code')
    setIsLoading(false)
    return
  }
  result = await apiClient.analyzeStockAllocation(connectionId, paramValues.productCode)
  break
}
```

**注意**：前端實作需 follow 既有架構，參考現有的 Next Engine API 整合方式（如 `neSearchGoods`, `neUploadGoods`）。

---

## 風險與備註

### 技術風險
- **訂單資料量大**：若訂單數量很多，需要適當的分頁處理
  - **緩解**：預設使用 `limit=100`，支援 `offset` 和 `limit` 參數

### 測試風險
- **Sandbox 環境限制**：若 sandbox 沒有訂單資料，需記錄並在 Run 中提出支援需求

---

## 參考實作範本

詳細的實作範本請參考 `docs/reference/platform-apis/NE-EXAMPLE.md` 的「8. 訂單 API」章節，包含：
- 訂單 base 和 rows 查詢的完整邏輯
- 扣庫分析的實作方式
- 錯誤處理的最佳實踐

