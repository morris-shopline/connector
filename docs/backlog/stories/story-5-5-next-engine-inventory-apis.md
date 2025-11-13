# Story 5.5: Next Engine 商品建立改進與庫存 API 補強

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ⚪ pending  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2-3 個工作天

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

3. **查詢分倉庫存** (`/api/connections/:connectionId/inventory/warehouse/:warehouseId`)
   - NextEngine API：`/api_v1_warehouse_stock/search`
   - 支援查詢參數：`productCode`（可選）
   - 預設查詢「基本拠点」（若未指定 warehouseId）

4. **查詢倉庫列表** (`/api/connections/:connectionId/warehouses`)
   - NextEngine API：`/api_v1_warehouse_base/search`
   - 預設欄位：`warehouse_id,warehouse_name`
   - 用於在庫更新時指定正確的拠点名

5. **更新分倉庫存** (`/api/connections/:connectionId/inventory/warehouse`)
   - NextEngine API：`/api_v1_warehouse_stock/upload`
   - 請求體：`productCode`, `newStock`, `warehouseName`（或 `warehouseId`）
   - **流程**：
     1. 先查詢分倉庫當前在庫數
     2. 計算與目標值的差異
     3. 判斷操作類型：增加或減少
     4. 動態建立 CSV，使用對應的欄位：`加算数量` 或 `減算数量`
     5. 上傳 CSV

#### Phase 3: Adapter 層方法擴充與測試

6. **Adapter 層方法擴充**
   - 在 `NextEngineAdapter` 中新增以下方法：
     - `createProduct(accessToken, options?)` - 建立商品（支援動態資料）
     - `getMasterStock(accessToken, productCode?)` - 查詢主倉庫存
     - `getWarehouseStock(accessToken, productCode, warehouseId?)` - 查詢分倉庫存
     - `getWarehouses(accessToken)` - 查詢倉庫列表
     - `updateWarehouseStock(accessToken, updates)` - 更新分倉庫存

7. **測試腳本與文件**
    - 撰寫測試腳本 `backend/scripts/test-next-engine-apis.ts`
    - 提供 CLI 命令測試各個 API
    - 記錄測試結果到 audit log
    - 更新 `NE-OVERVIEW.md` 補充 API 測試操作步驟

### ❌ 不包含
- 店舖建立 API 改進（移至 Story 5.7）
- 在庫連携接收端點（移至 Story 5.7）
- Webhook 管理 UI（移至 Story 5.7）
- 訂單相關 API（移至 Story 5.6）
- 前端呈現或 UX 調整（預留後續 Story 規劃）

---

## 驗收標準

### Agent 自動化 / 測試

#### Phase 1: 改進商品建立 API
- [ ] 建立商品 API 支援動態產生測試資料（無需提供 CSV）
- [ ] 保留原有功能：提供完整 CSV 時仍可使用
- [ ] 測試腳本驗證兩種模式（動態產生 vs 手動提供）

#### Phase 2: 庫存與倉庫 API
- [ ] 查詢主倉庫存 API 可正確查詢庫存資訊
- [ ] 查詢分倉庫存 API 可正確查詢特定倉庫庫存
- [ ] 查詢倉庫列表 API 可正確取得倉庫清單
- [ ] 更新庫存 API 可正確計算差異並更新（先查詢 → 計算 → 上傳）
- [ ] 測試腳本驗證所有庫存相關 API 的成功與錯誤情境
- [ ] 將結果記錄於審計或 log，供除錯追蹤

### User Test

#### 便利性測試
- [ ] Admin 可以**不提供任何參數**建立測試商品，系統自動產生 CSV
- [ ] Admin 可以**只提供部分參數**（如 `productName`）建立商品，系統自動補齊其他欄位

#### 功能測試
- [ ] Human 確認在 Next Engine 後台可看到動態建立的商品
- [ ] Human 確認庫存查詢 API 可正確查詢庫存資訊
- [ ] Human 確認庫存更新可在 Next Engine 後台看到對應的變化
- [ ] **User Test 通過後推上正式站**

---

## 交付與文件更新

### 程式碼交付
- [ ] `NextEngineAdapter` 新增庫存相關方法
- [ ] `api.ts` 新增庫存與倉庫 API 路由
- [ ] 測試腳本 `backend/scripts/test-next-engine-apis.ts`

### 文件更新
- [ ] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md`：
  - 補充商品動態資料產生邏輯說明
  - 補充庫存與倉庫 API 規格
- [ ] 更新 `NE-OVERVIEW.md`：
  - 補充商品建立與庫存 API 測試操作步驟
  - 補充商品動態資料產生使用範例
  - 補充庫存更新流程說明
- [ ] 更新 `NEXTENGINE_API_REFERENCE.md`：
  - 補充商品動態資料產生參數說明

---

## 實作重點與技術細節

### 動態資料產生邏輯

#### 建立商品（CSV 格式）
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

### 庫存更新流程

1. **查詢當前庫存**：呼叫 `/api_v1_warehouse_stock/search` 取得當前 `warehouse_stock_free_quantity`
2. **計算差異**：`diff = newStock - currentStock`
3. **判斷操作類型**：
   - 若 `diff > 0`：使用 `加算数量` 欄位
   - 若 `diff < 0`：使用 `減算数量` 欄位（注意：減算數量不能超過當前フリー在庫数）
4. **產生 CSV**：
   ```csv
   拠点名,商品コード,加算数量,減算数量,理由
   基本拠点,${productCode},${diff > 0 ? Math.abs(diff) : ''},${diff < 0 ? Math.abs(diff) : ''},在庫数調整のため
   ```
5. **上傳 CSV**：呼叫 `/api_v1_warehouse_stock/upload`

### 錯誤處理

- **CSV 格式錯誤**：在上傳前驗證 CSV 格式
- **減算數量超過當前庫存**：在上傳前檢查並回傳明確錯誤
- **加算和減算不能同時使用**：在產生 CSV 時確保只填寫其中一個欄位

---

## 風險與備註

### 技術風險
- **在庫更新使用 CSV 上傳且有等待時間**（`wait_flag`），需考慮非同步處理與重試邏輯
  - **緩解**：先實作基本流程，後續再補強重試邏輯
- **倉庫名稱 vs 倉庫ID**：NextEngine 更新庫存時使用倉庫名稱（`kyoten_mei`），不是倉庫ID
  - **緩解**：在 API 中自動處理轉換，或提供明確的文件說明

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
