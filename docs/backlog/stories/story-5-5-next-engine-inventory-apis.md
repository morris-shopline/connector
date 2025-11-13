# Story 5.5: Next Engine 商品建立改進與庫存 API 補強

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ✅ completed  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2-3 個工作天（包含前端整合）  
**實際完成時間**: 2025-11-13（地端測試通過 + 正式機測試通過）

---

## Story 描述

在 Story 5.2 完成店舖 / 商品的基本串接後，**改進商品建立 API 並補強庫存與倉庫相關 API**，包括：

1. **改進商品建立 API**：支援動態產生測試資料（無需手動 key CSV）
2. **補強庫存與倉庫 API**：查詢庫存、更新庫存、查詢倉庫等功能

**目標**：讓 admin 可以方便地測試 Next Engine 商品建立與庫存管理 API，而不需要手動準備完整的 CSV 格式資料。

**完成後將進行 User Test，通過後推上正式站。**

> 📌 **參考文件**：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 📌 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含所有 API 的端到端流程與動態資料產生邏輯）
> - 📘 **詳解指南**：`docs/reference/platform-apis/nextengine-api-playbook-detailed.md`（以 ne-test 驗證過的 OAuth／庫存 API 詳細流程）

---

## 前情提要

### 現有實作狀況（Story 5.1～5.3）

**已實作的 Next Engine API**：
- ✅ OAuth 授權流程（Story 5.1）
- ✅ 查詢店舖列表 `/api/connections/:connectionId/shops/search`
- ✅ 建立店舖 `/api/connections/:connectionId/shops/create` - **目前需要手動提供完整 XML**
- ✅ 查詢商品 `/api/connections/:connectionId/goods/search`
- ✅ 建立商品 `/api/connections/:connectionId/goods/upload` - **目前需要手動提供完整 CSV**
- ✅ 訂單摘要（在 adapter 中）

**問題點**：
- 建立商品時需要手動準備完整的 CSV 格式，測試不便
- 缺少庫存與倉庫相關 API

### 參考專案（ne-test）的便利功能

根據 `NE-EXAMPLE.md`，參考專案提供：
- **動態產生測試資料**：建立店舖/商品時可選參數，未提供則自動產生
- **簡化的 API 介面**：接受簡單 JSON 參數，內部轉換為 XML/CSV
- **完整的庫存 API**：主倉、分倉、倉庫列表、更新庫存

---

## 依賴與前置條件

1. Story 5.1～5.3 已完成並通過 User Test。  
2. Sandbox 環境可穩定建立商品與店舖，並可在 Next Engine 後台查詢資料。
3. 已研讀 `NE-EXAMPLE.md` 了解參考專案的實作方式。

---

## 範圍定義

### ✅ 包含

#### Phase 1: 改進商品建立 API（動態產生測試資料）

1. **改進建立商品 API** (`/api/connections/:connectionId/goods/upload`)
   - 支援可選參數：`productCode`, `productName`, `price`, `cost`（未提供則自動產生）
   - 動態產生內容：
     - `syohin_code`、`daihyo_syohin_code`：`TEST_<timestamp>`（若未提供）
     - `syohin_name`：`Test Product <timestamp>`（若未提供）
     - 其它必填欄位使用固定測試值（`sire_code=9999`、`genka_tnk=1000`、`baika_tnk=1500`）
   - 自動封裝為官方支援的 CSV 格式並以 `data_type=csv` 上傳
   - 保留原有功能：若提供 `data`（完整 CSV），則直接使用

#### Phase 2: 庫存與倉庫 API

2. **查詢主倉庫存** (`/api/connections/:connectionId/inventory`)
   - NextEngine API：`/api_v1_master_stock/search`
   - 支援查詢參數：`productCode`（可選，用於單一商品查詢）
   - 預設帶完整欄位

3. **查詢分倉庫存** (`POST /api/connections/:connectionId/inventory/warehouse/search`)
   - NextEngine API：`/api_v1_warehouse_stock/search`
   - 支援請求體欄位：`productCode`（可選）、`warehouseKey`（可選）
   - `warehouseKey` 為 `getWarehouses` 回傳的 `warehouse_id` 原值（實際為倉庫名稱字串），未提供或填入 `default` 時由系統轉換成 Sandbox 預設的 `基本拠点`

4. **查詢倉庫列表** (`/api/connections/:connectionId/warehouses`)
   - NextEngine API：`/api_v1_warehouse_base/search`
   - 預設欄位：`warehouse_id,warehouse_name`
   - 用於在庫更新時指定正確的拠点名

5. **更新分倉庫存** (`POST /api/connections/:connectionId/inventory/warehouse`)
   - NextEngine API：`/api_v1_warehouse_stock/upload`
   - 請求體：`productCode`, `newStock`, `warehouseKey`（可選，預設 `default` 對應 `基本拠点`）
   - **流程**：
     1. 透過 `getWarehouses` 取得 `warehouse_id` ↔︎ `warehouse_name` 對照，並依 `warehouseKey` 確認實際倉庫名稱（`warehouse_name`）
     2. 查詢分倉庫當前在庫數（同步使用對應的 `warehouseKey`）
     3. 計算與目標值的差異
     4. 判斷操作類型：增加或減少
     5. 動態建立 CSV，使用對應的欄位：`加算数量` 或 `減算数量`（`拠点名` 欄位帶入步驟 1 的倉庫名稱）
     6. 上傳 CSV

#### Phase 3: Adapter 層方法擴充與測試

6. **Adapter 層方法擴充**
   - 在 `NextEngineAdapter` 中新增以下方法：
     - `createProduct(accessToken, options?)` - 建立商品（支援動態資料）
     - `getMasterStock(accessToken, productCode?)` - 查詢主倉庫存
     - `getWarehouseStock(accessToken, options?: { productCode?: string; warehouseKey?: string })` - 查詢分倉庫存（`warehouseKey` 預設對應 `基本拠点`）
     - `getWarehouses(accessToken)` - 查詢倉庫列表
     - `updateWarehouseStock(accessToken, updates: { productCode: string; newStock: number; warehouseKey?: string })` - 更新分倉庫存（自動換算對應的倉庫名稱）

7. **前端 API 客戶端整合**（`frontend/lib/api.ts`）
   - 更新 `uploadGoods(connectionId, options?)` - 支援動態參數（productCode, productName, price, cost）
   - 新增 `getMasterStock(connectionId, productCode?)` - 查詢主倉庫存
   - 新增 `getWarehouseStock(connectionId, params?: { productCode?: string; warehouseKey?: string })` - 查詢分倉庫存
   - 新增 `getWarehouses(connectionId)` - 查詢倉庫列表
   - 新增 `updateWarehouseStock(connectionId, payload: { productCode: string; newStock: number; warehouseKey?: string })` - 更新分倉庫存（內部判斷 `warehouseKey` 是否為 `default`）

8. **前端 API 配置整合**（`frontend/content/platforms/api-configs.ts`）
   - 更新 `neUploadGoods` 配置：支援動態參數輸入（productCode, productName, price, cost），保留 CSV 輸入選項
   - 在 `nextEngineApiConfig` 中新增 `inventory` 群組：
     - `neGetMasterStock` - 查詢主倉庫存
     - `neGetWarehouseStock` - 查詢分倉庫存（參數表單需顯示 `warehouseKey`，預設值 `default`）
     - `neGetWarehouses` - 查詢倉庫列表
     - `neUpdateWarehouseStock` - 更新分倉庫存（表單欄位 `warehouseKey`，預設 `default`）
   - 配置查詢參數：`productCode`、`warehouseKey`（預設 `default`）、`newStock` 等；刪除舊的 `warehouseName` 欄位，並在 UI 標示 `warehouseKey` 可直接使用倉庫名稱字串

9. **前端測試頁面整合**（`frontend/pages/admin-api-test.tsx`）
   - 更新 `neUploadGoods` 處理邏輯：支援動態參數模式（優先使用動態參數，若未提供則使用 CSV）
   - 在 Next Engine API 的 switch case 中加入庫存相關 API 的處理邏輯
   - 支援查詢參數輸入和結果顯示

10. **測試腳本與文件**
    - 撰寫測試腳本 `backend/scripts/test-next-engine-apis.ts`（CLI 支援 `--mode create-product|master-stock|warehouse-stock|update-stock`、`--warehouse-key`、`--sample N`、`--dry-run`）
    - 每個 mode 需呼叫對應後端路由，驗證動態商品、主倉／分倉、倉庫列表與庫存更新流程
    - 腳本輸出進度摘要並以 `auditLogRepository` 紀錄 `script.next-engine.<mode>` 操作，metadata 包含 `warehouseKey` / `warehouseName`
    - 更新 `NE-OVERVIEW.md` 補充 CLI 使用範例、預期輸出與錯誤處理說明

### ❌ 不包含
- 店舖建立 API 改進（移至 Story 5.7）
- 在庫連携接收端點（移至 Story 5.7）
- Webhook 管理 UI（移至 Story 5.7）
- 訂單相關 API（移至 Story 5.6）
- 複雜的前端 UI/UX 調整（僅在 admin-api-test 頁面整合，follow 既有架構）

---

## 驗收標準

### Agent 自動化 / 測試

#### Phase 1: 改進商品建立 API
- [x] 建立商品 API 支援動態產生測試資料（無需提供 CSV）✅
- [x] 保留原有功能：提供完整 CSV 時仍可使用✅
- [x] 前端 API 客戶端支援動態參數模式✅
- [x] 前端 API 配置正確顯示動態參數輸入選項✅
- [x] 前端測試頁面可正確處理動態參數模式✅
- [x] 測試腳本驗證兩種模式（動態產生 vs 手動提供）✅

#### Phase 2: 庫存與倉庫 API
- [x] 查詢主倉庫存 API 可正確查詢庫存資訊✅
- [x] 查詢分倉庫存 API 支援 `warehouseKey`（預設 `default` → `基本拠点`）與 `productCode`✅
- [x] 查詢倉庫列表 API 回傳 `warehouse_id` 與 `warehouse_name`，並於後端快取映射✅
- [x] 更新庫存 API 可正確計算差異並更新（先查詢 → 計算 → 上傳），回應中帶回 `warehouseKey` 與對應的 `warehouseName`✅
- [x] 前端 API 客戶端方法可正確呼叫後端 API，並自動處理 `warehouseKey` → 倉庫名稱的對照✅
- [x] 前端 API 配置正確顯示在 admin-api-test 頁面，並對 `warehouseKey` 欄位提供預設 `default`✅
- [x] 前端測試頁面可正確處理庫存相關 API 呼叫，並顯示倉庫列表讓使用者複製 `warehouse_id`✅
- [x] 測試腳本驗證所有庫存相關 API 的成功與錯誤情境（含 `warehouseKey` 不存在時的錯誤訊息）✅
- [x] 審計或 log 記錄所有操作（含 `warehouseKey` / `warehouseName`）供除錯追蹤✅

### User Test

#### 便利性測試
- [x] Admin 在 admin-api-test 頁面選擇 Next Engine Connection✅
- [x] Admin 可以**不提供任何參數**建立測試商品，系統自動產生 CSV✅
- [x] Admin 可以**只提供部分參數**（如 `productName`）建立商品，系統自動補齊其他欄位✅
- [x] Admin 確認「庫存」群組顯示四個 API 功能（查詢主倉、查詢分倉、查詢倉庫列表、更新庫存）✅
- [x] Admin 可在表單上看到 `warehouseKey` 欄位提示（預設輸入 `default`），並能從倉庫列表結果複製 `warehouse_id`✅

#### 功能測試
- [x] Human 在 admin-api-test 頁面測試動態建立商品功能✅
- [x] Human 確認在 Next Engine 後台可看到動態建立的商品✅
- [x] Human 在 admin-api-test 頁面測試庫存查詢 API（主倉、分倉、倉庫列表）✅
- [x] Human 確認庫存查詢 API 可正確查詢庫存資訊✅
- [x] Human 在 admin-api-test 頁面測試更新庫存功能✅
- [x] Human 確認庫存更新可在 Next Engine 後台看到對應的變化✅
- [x] Human 驗證使用 `default` 與指定 `warehouseKey` 均能成功更新，審計 log 含倉庫資訊✅
- [x] **User Test 通過後推上正式站**✅ **正式機測試通過**✅

---

## 交付與文件更新

### 程式碼交付
- [x] `NextEngineAdapter` 新增庫存相關方法✅
- [x] `backend/src/routes/api.ts` 新增庫存與倉庫 API 路由✅
- [x] `frontend/lib/api.ts` 更新商品建立 API 並新增庫存 API 客戶端方法✅
- [x] `frontend/content/platforms/api-configs.ts` 更新商品建立配置並新增 inventory 群組配置✅
- [x] `frontend/pages/admin-api-test.tsx` 整合商品建立改進與庫存 API 處理邏輯✅
- [x] 測試腳本 `backend/scripts/test-next-engine-apis.ts`✅

### 文件更新
- [x] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md`：✅
  - 補充商品動態資料產生邏輯說明✅
  - 補充庫存與倉庫 API 規格✅
- [x] 更新 `NE-OVERVIEW.md`：✅
  - 補充商品建立與庫存 API 測試操作步驟✅
  - 補充商品動態資料產生使用範例✅
  - 補充庫存更新流程說明✅
- [x] 更新 `NEXTENGINE_API_REFERENCE.md`：✅
  - 補充商品動態資料產生參數說明✅
  - 補充完整的官方 CSV 格式規格與欄位說明✅

---

## Story 完成總結

**完成日期**: 2025-11-13  
**測試狀態**: ✅ 地端測試通過 + ✅ 正式機測試通過

### 關鍵修正
1. **CSV 格式修正**：使用官方英文欄位名稱（`kyoten_mei`, `syohin_code`, `kasan_su`, `gensan_su`, `kyoten_syohin_sakujyo`, `nyusyukko_riyu`）
2. **佇列狀態處理**：`que_status_id = -1` 時返回 `success: true`（API 呼叫成功，但佇列處理失敗）
3. **錯誤處理改進**：從多個欄位提取錯誤訊息，記錄完整錯誤資訊
4. **佇列查詢增強**：返回完整欄位資訊（`que_method_name`, `que_upload_name`, `que_file_name`, `que_message`）

### 測試結果
- ✅ 地端測試：所有功能正常運作
- ✅ 正式機測試：所有功能正常運作
- ✅ User Test：通過

---

## 實作重點與技術細節

### 後端實作

#### 動態資料產生邏輯

**建立商品（CSV 格式）**：
```typescript
// 動態產生商品代碼與名稱
const timestamp = Date.now()
const productCode = options?.productCode || `TEST_${timestamp}`
const productName = options?.productName || `Test Product ${timestamp}`
const cost = options?.cost || 1000
const price = options?.price || 1500

// 自動填入必填欄位並封裝為 CSV
const csvData = `syohin_code,sire_code,syohin_name,genka_tnk,baika_tnk,daihyo_syohin_code
${productCode},9999,${productName},${cost},${price},${productCode}`
```

#### 庫存更新流程

1. **查詢當前庫存**：呼叫 `/api_v1_warehouse_stock/search` 取得當前 `warehouse_stock_free_quantity`
2. **計算差異**：`diff = newStock - currentStock`
3. **判斷操作類型**：
   - 若 `diff > 0`：使用 `加算数量` 欄位
   - 若 `diff < 0`：使用 `減算数量` 欄位（注意：減算數量不能超過當前フリー在庫数）
4. **產生 CSV**（`拠点名` 使用步驟 1 換算的 `warehouseName`）：
   ```csv
   拠点名,商品コード,加算数量,減算数量,理由
   ${warehouseName},${productCode},${diff > 0 ? Math.abs(diff) : ''},${diff < 0 ? Math.abs(diff) : ''},在庫数調整のため
   ```
5. **上傳 CSV**：呼叫 `/api_v1_warehouse_stock/upload`

#### 錯誤處理

- **CSV 格式錯誤**：在上傳前驗證 CSV 格式
- **減算數量超過當前庫存**：在上傳前檢查並回傳明確錯誤
- **加算和減算不能同時使用**：在產生 CSV 時確保只填寫其中一個欄位

### 前端實作

#### API 客戶端方法（`frontend/lib/api.ts`）

**更新商品建立 API**：
```typescript
async uploadGoods(connectionId: string, options?: {
  productCode?: string
  productName?: string
  price?: number
  cost?: number
  csvData?: string  // 保留原有 CSV 輸入選項
}): Promise<ApiResponse<any>>
```

**新增庫存 API 方法**：
```typescript
async getMasterStock(connectionId: string, productCode?: string): Promise<ApiResponse<any>>

async getWarehouseStock(
  connectionId: string,
  params?: {
    productCode?: string
    warehouseKey?: string
  }
): Promise<ApiResponse<any>>

async getWarehouses(connectionId: string): Promise<ApiResponse<any>>

async updateWarehouseStock(
  connectionId: string, 
  payload: {
    productCode: string
    newStock: number
    warehouseKey?: string
  }
): Promise<ApiResponse<any>>
```

#### API 配置（`frontend/content/platforms/api-configs.ts`）

**更新商品建立配置**：
```typescript
{
  id: 'neUploadGoods',
  name: '建立商品（支援動態參數）',
  group: 'goods',
  method: 'POST',
  endpoint: (connectionId: string) => `/api/connections/${connectionId}/goods/upload`,
  hasBody: true,
  bodyDescription: '支援動態參數或 CSV 格式',
  paramConfig: [
    { id: 'productCode', label: 'Product Code（選填，動態模式）', type: 'text' },
    { id: 'productName', label: 'Product Name（選填，動態模式）', type: 'text' },
    { id: 'price', label: 'Price（選填，動態模式）', type: 'text', defaultValue: '1500' },
    { id: 'cost', label: 'Cost（選填，動態模式）', type: 'text', defaultValue: '1000' },
    { 
      id: 'csvData', 
      label: 'CSV 資料（選填，手動模式）', 
      type: 'textarea',
      placeholder: '若未提供動態參數，則使用 CSV 資料'
    }
  ]
}
```

**新增庫存群組配置**：
```typescript
{
  id: 'inventory',
  name: '庫存',
  functions: [
    {
      id: 'neGetMasterStock',
      name: '查詢主倉庫存',
      group: 'inventory',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory`,
      hasBody: true,
      paramConfig: [
        { id: 'productCode', label: 'Product Code（選填）', type: 'text' }
      ]
    },
    {
      id: 'neGetWarehouseStock',
      name: '查詢分倉庫存',
      group: 'inventory',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory/warehouse/search`,
      hasBody: true,
      paramConfig: [
        { id: 'warehouseKey', label: 'Warehouse Key（選填，預設 default）', type: 'text', defaultValue: 'default' },
        { id: 'productCode', label: 'Product Code（選填）', type: 'text' }
      ]
    },
    {
      id: 'neGetWarehouses',
      name: '查詢倉庫列表',
      group: 'inventory',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/warehouses`,
      hasBody: true
    },
    {
      id: 'neUpdateWarehouseStock',
      name: '更新分倉庫存',
      group: 'inventory',
      method: 'POST',
      endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory/warehouse`,
      hasBody: true,
      paramConfig: [
        { id: 'productCode', label: 'Product Code（必填）', type: 'text' },
        { id: 'newStock', label: 'New Stock（必填）', type: 'text' },
        { id: 'warehouseKey', label: 'Warehouse Key（選填，預設 default）', type: 'text', defaultValue: 'default' }
      ]
    }
  ]
}
```

#### 測試頁面整合（`frontend/pages/admin-api-test.tsx`）

**更新商品建立處理邏輯**：
```typescript
case 'neUploadGoods': {
  // 優先使用動態參數，若未提供則使用 CSV
  if (paramValues.productCode || paramValues.productName || paramValues.price || paramValues.cost) {
    result = await apiClient.uploadGoods(connectionId, {
      productCode: paramValues.productCode,
      productName: paramValues.productName,
      price: paramValues.price ? parseInt(paramValues.price) : undefined,
      cost: paramValues.cost ? parseInt(paramValues.cost) : undefined
    })
  } else if (paramValues.csvData) {
    result = await apiClient.uploadGoods(connectionId, { csvData: paramValues.csvData })
  } else {
    // 都不提供時，使用動態模式（不傳參數）
    result = await apiClient.uploadGoods(connectionId)
  }
  break
}
```

**新增庫存 API 處理邏輯**：
```typescript
case 'neGetMasterStock': {
  result = await apiClient.getMasterStock(connectionId, paramValues.productCode)
  break
}
case 'neGetWarehouseStock': {
  result = await apiClient.getWarehouseStock(connectionId, {
    warehouseKey: paramValues.warehouseKey || 'default',
    productCode: paramValues.productCode
  })
  break
}
case 'neGetWarehouses': {
  result = await apiClient.getWarehouses(connectionId)
  break
}
case 'neUpdateWarehouseStock': {
  if (!paramValues.productCode || !paramValues.newStock) {
    setError('請輸入 Product Code 和 New Stock')
    setIsLoading(false)
    return
  }
  result = await apiClient.updateWarehouseStock(connectionId, {
    productCode: paramValues.productCode,
    newStock: parseInt(paramValues.newStock),
    warehouseKey: paramValues.warehouseKey || 'default'
  })
  break
}
```

**注意**：前端實作需 follow 既有架構，參考現有的 Next Engine API 整合方式（如 `neSearchGoods`）。

---

### 倉庫識別欄位對照

| 功能 | 前端欄位 | Next Engine 對應 | 備註 |
| --- | --- | --- | --- |
| 查分倉庫存 | `warehouseKey` | `warehouse_stock_warehouse_id-eq` | 取自 `getWarehouses` 的 `warehouse_id` 字串；`default` 代表 `基本拠点` |
| 查分倉庫存 | `productCode` | `warehouse_stock_goods_id-eq` | 可選 |
| 更新分倉庫存 | `warehouseKey` | CSV `拠点名` | 透過映射轉換為實際倉庫名稱 |
| 更新分倉庫存 | `productCode` | CSV `商品コード` | 必填 |
| 更新分倉庫存 | `newStock` | CSV `加算数量` / `減算数量` | 差值 > 0 → `加算数量`；差值 < 0 → `減算数量` |
| 查倉庫列表 | — | `/api_v1_warehouse_base/search` | 回傳 `warehouse_id`（實際為名稱字串）與 `warehouse_name` |

> ✅ Column Type Handling Rule：所有含 `id`／`code`／`number` 的欄位均以字串處理；Next Engine 的 `warehouse_id` 為倉庫名稱（多為日文），不得強制轉型為數值。

---

## 風險與備註

### 技術風險
- **在庫更新使用 CSV 上傳且有等待時間**（`wait_flag`），需考慮非同步處理與重試邏輯
  - **緩解**：先實作基本流程，後續再補強重試邏輯
- **倉庫名稱 vs 倉庫ID**：Next Engine 雖以 `warehouse_id` 命名，但實際值為倉庫名稱（多為日文）
  - **緩解**：建立 `warehouseKey` → `warehouseName` 映射，預設 `default` 對應 `基本拠点`，避免要求使用者輸入日文字串

### 測試風險
- **Sandbox 環境限制**：若 sandbox 無法完整測試（例如無權限操作庫存），需記錄並在 Run 中提出支援需求

### 向後相容性
- **保留原有功能**：提供完整 XML/CSV 時仍可使用原有邏輯
- **API 路由不變**：只擴充功能，不改變現有路由結構

---

## 參考實作範本

詳細的實作範本請參考 `docs/reference/platform-apis/NE-EXAMPLE.md`，包含：
- 動態資料產生的完整邏輯
- CSV/XML 格式的標準模板
- 錯誤處理的最佳實踐
- 測試腳本的範例結構
