# 📦 文件已歸檔

> **歸檔日期**: 2025-01-XX  
> **歸檔原因**: 文件已遷移至新的 Sprint 文件體系  
> **替代文件**: [docs/sprints/01-admin-api-testing.md](../sprints/01-admin-api-testing.md)  
> **Sprint 總覽**: [docs/sprints/SPRINT_INDEX.md](../sprints/SPRINT_INDEX.md)

---

此文件為 Sprint 1 的初步規劃文件，已整合到新的 Sprint 文件管理體系中。新文件包含更完整的時序資訊、前置條件和依賴關係。

**如需查看最新版本，請參考替代文件。**

---

## 📋 Sprint 概述（舊版，請參考新文件）

**目標**: 實作 Shopline Admin API 的常用測試功能，讓開發者能夠快速測試和驗證 API 整合。

**Sprint 週期**: 待定  
**狀態**: 📝 規劃中（待 Review）

---

## 🎯 Sprint 目標

1. **後端 API 封裝**: 實作 Shopline Admin API 的常用功能封裝
2. **前端測試介面**: 建立易用的測試介面，方便開發者測試 API
3. **API 文檔整合**: 確保所有實作符合官方 API 文檔規範
4. **錯誤處理完善**: 建立統一的錯誤處理機制

---

## 📊 當前進度

### ✅ 已完成功能

- OAuth 2.0 授權流程
- Webhook 訂閱/取消訂閱
- Webhook 事件接收與儲存
- 商店資訊管理

### ⏳ 待實作功能

- Admin API 常用功能封裝
- 前端測試介面
- API 錯誤處理機制
- Token 自動刷新（如需要）

---

## 🔧 實作範圍

### Phase 1: 核心 Admin API 功能（優先實作）

#### 1.1 產品 API (Products)

**後端功能**:
- `getProducts()` - 取得產品列表
- `getProduct(productId)` - 取得單一產品
- `createProduct(productData)` - 建立產品
- `updateProduct(productId, productData)` - 更新產品
- `deleteProduct(productId)` - 刪除產品

**API 端點**:
- `GET /admin/openapi/v20250601/products.json`
- `GET /admin/openapi/v20250601/products/{product_id}.json`
- `POST /admin/openapi/v20250601/products.json`
- `PUT /admin/openapi/v20250601/products/{product_id}.json`
- `DELETE /admin/openapi/v20250601/products/{product_id}.json`

**前端介面**:
- 產品列表頁面
- 產品詳情查看
- 產品建立/編輯表單
- 產品搜尋與篩選

#### 1.2 訂單 API (Orders)

**後端功能**:
- `getOrders(params?)` - 取得訂單列表（支援分頁、篩選）
- `getOrder(orderId)` - 取得單一訂單
- `updateOrder(orderId, orderData)` - 更新訂單狀態
- `getOrderCount()` - 取得訂單數量統計

**API 端點**:
- `GET /admin/openapi/v20250601/orders.json`
- `GET /admin/openapi/v20250601/orders/{order_id}.json`
- `PUT /admin/openapi/v20250601/orders/{order_id}.json`

**前端介面**:
- 訂單列表頁面（分頁、篩選）
- 訂單詳情查看
- 訂單狀態更新
- 訂單統計儀表板

#### 1.3 客戶 API (Customers)

**後端功能**:
- `getCustomers(params?)` - 取得客戶列表
- `getCustomer(customerId)` - 取得單一客戶
- `createCustomer(customerData)` - 建立客戶
- `updateCustomer(customerId, customerData)` - 更新客戶

**API 端點**:
- `GET /admin/openapi/v20250601/customers.json`
- `GET /admin/openapi/v20250601/customers/{customer_id}.json`
- `POST /admin/openapi/v20250601/customers.json`
- `PUT /admin/openapi/v20250601/customers/{customer_id}.json`

**前端介面**:
- 客戶列表頁面
- 客戶詳情查看
- 客戶建立/編輯表單

### Phase 2: 擴展功能（視需求調整）

#### 2.1 庫存 API (Inventory)

**後端功能**:
- `getInventory()` - 取得庫存資訊
- `updateInventory(variantId, quantity)` - 更新庫存

#### 2.2 商品集合 API (Collections)

**後端功能**:
- `getCollections()` - 取得商品集合列表
- `getCollection(collectionId)` - 取得單一商品集合

#### 2.3 商店資訊 API (Shop Info)

**後端功能**:
- `getShopInfo()` - 取得商店基本資訊
- `getShopSettings()` - 取得商店設定

---

## 🏗️ 技術實作規劃

### 後端架構

#### 1. Service Layer 擴展

**檔案**: `backend/src/services/shopline.ts`

新增方法結構：
```typescript
// Products
async getProducts(handle: string, params?: ProductListParams): Promise<ProductListResponse>
async getProduct(handle: string, productId: string): Promise<ProductResponse>
async createProduct(handle: string, productData: CreateProductInput): Promise<ProductResponse>
async updateProduct(handle: string, productId: string, productData: UpdateProductInput): Promise<ProductResponse>
async deleteProduct(handle: string, productId: string): Promise<DeleteResponse>

// Orders
async getOrders(handle: string, params?: OrderListParams): Promise<OrderListResponse>
async getOrder(handle: string, orderId: string): Promise<OrderResponse>
async updateOrder(handle: string, orderId: string, orderData: UpdateOrderInput): Promise<OrderResponse>

// Customers
async getCustomers(handle: string, params?: CustomerListParams): Promise<CustomerListResponse>
async getCustomer(handle: string, customerId: string): Promise<CustomerResponse>
async createCustomer(handle: string, customerData: CreateCustomerInput): Promise<CustomerResponse>
async updateCustomer(handle: string, customerId: string, customerData: UpdateCustomerInput): Promise<CustomerResponse>
```

#### 2. API Routes 擴展

**檔案**: `backend/src/routes/api.ts`

新增路由結構：
```typescript
// Products routes
GET    /api/stores/:handle/products
GET    /api/stores/:handle/products/:productId
POST   /api/stores/:handle/products
PUT    /api/stores/:handle/products/:productId
DELETE /api/stores/:handle/products/:productId

// Orders routes
GET    /api/stores/:handle/orders
GET    /api/stores/:handle/orders/:orderId
PUT    /api/stores/:handle/orders/:orderId

// Customers routes
GET    /api/stores/:handle/customers
GET    /api/stores/:handle/customers/:customerId
POST   /api/stores/:handle/customers
PUT    /api/stores/:handle/customers/:customerId
```

#### 3. 統一錯誤處理

**新增檔案**: `backend/src/utils/apiError.ts`

```typescript
export class ShoplineAPIError extends Error {
  statusCode: number
  apiError: any
  
  constructor(message: string, statusCode: number, apiError?: any) {
    super(message)
    this.statusCode = statusCode
    this.apiError = apiError
  }
}
```

#### 4. API 請求封裝

**新增檔案**: `backend/src/utils/shoplineApiClient.ts`

統一處理：
- Access Token 管理
- 請求簽名（如需要）
- 錯誤重試機制
- 速率限制處理

### 前端架構

#### 1. 新增測試頁面

**檔案**: `frontend/pages/admin-api-test.tsx`

主要功能：
- 商店選擇器
- API 功能分類標籤（Products / Orders / Customers）
- 請求/回應顯示區域
- 錯誤訊息顯示

#### 2. API Hooks

**新增檔案**: `frontend/hooks/useAdminAPI.ts`

提供統一的 API 呼叫 Hook：
```typescript
export function useAdminAPI(handle: string) {
  const getProducts = async (params?) => { ... }
  const getProduct = async (productId) => { ... }
  // ... 其他方法
}
```

#### 3. 元件擴展

**新增元件**:
- `AdminAPITestPanel.tsx` - API 測試面板
- `ProductList.tsx` - 產品列表
- `OrderList.tsx` - 訂單列表
- `CustomerList.tsx` - 客戶列表
- `APIResponseViewer.tsx` - API 回應查看器

---

## 📝 型別定義

### 新增型別檔案

**檔案**: `shared/types.ts` 或 `backend/src/types.ts`

需要定義的型別：
```typescript
// Products
interface Product { ... }
interface ProductListParams { ... }
interface ProductListResponse { ... }
interface CreateProductInput { ... }
interface UpdateProductInput { ... }

// Orders
interface Order { ... }
interface OrderListParams { ... }
interface OrderListResponse { ... }
interface UpdateOrderInput { ... }

// Customers
interface Customer { ... }
interface CustomerListParams { ... }
interface CustomerListResponse { ... }
interface CreateCustomerInput { ... }
interface UpdateCustomerInput { ... }
```

---

## 🔍 實作細節

### 1. API 版本管理

- 統一使用 `v20250601` 作為預設 API 版本
- 支援透過參數指定不同版本
- 版本號從環境變數或配置讀取

### 2. Access Token 處理

- 從資料庫讀取商店的 Access Token
- 在請求 Header 中使用 `Authorization: Bearer {token}`
- 處理 Token 過期情況（未來可擴展自動刷新）

### 3. 請求格式

所有 Admin API 請求：
- 使用 `https://{handle}.myshopline.com/admin/openapi/{version}/...`
- Headers: `Content-Type: application/json; charset=utf-8`
- Headers: `Authorization: Bearer {accessToken}`

### 4. 回應處理

- 統一處理成功回應（200, 201）
- 統一處理錯誤回應（400, 401, 404, 500）
- 記錄詳細的錯誤日誌

### 5. 分頁處理

- 支援 `page` 和 `limit` 參數
- 處理分頁回應中的 `pagination` 資訊
- 前端顯示分頁控制元件

---

## 🧪 測試規劃

### 單元測試

- Service 方法測試
- API 路由測試
- 錯誤處理測試

### 整合測試

- 完整 API 流程測試
- 前端元件測試
- 端到端測試

### 手動測試清單

- [ ] 產品列表查詢
- [ ] 產品詳情查詢
- [ ] 產品建立
- [ ] 產品更新
- [ ] 產品刪除
- [ ] 訂單列表查詢（含分頁）
- [ ] 訂單詳情查詢
- [ ] 訂單狀態更新
- [ ] 客戶列表查詢
- [ ] 客戶詳情查詢
- [ ] 客戶建立
- [ ] 客戶更新
- [ ] 錯誤處理（無效 Token、無效 ID 等）

---

## 📅 時程估算

### Phase 1: 核心功能（預計 3-5 天）

**Day 1-2: 後端實作**
- [ ] Products API 封裝（Service + Routes）
- [ ] Orders API 封裝（Service + Routes）
- [ ] Customers API 封裝（Service + Routes）
- [ ] 錯誤處理機制
- [ ] 型別定義

**Day 3: 前端基礎介面**
- [ ] 測試頁面框架
- [ ] API Hooks 實作
- [ ] 基本 UI 元件

**Day 4: 前端完整功能**
- [ ] Products 測試介面
- [ ] Orders 測試介面
- [ ] Customers 測試介面
- [ ] 回應查看器

**Day 5: 測試與優化**
- [ ] 單元測試
- [ ] 整合測試
- [ ] Bug 修復
- [ ] 文件更新

### Phase 2: 擴展功能（視需求）

- 庫存 API
- 商品集合 API
- 商店資訊 API

---

## 🚨 風險與注意事項

### 技術風險

1. **API 版本差異**: 不同 API 端點可能使用不同版本號
   - **應對**: 建立版本對照表，支援版本參數

2. **Token 過期**: Access Token 可能在使用過程中過期
   - **應對**: 實作錯誤處理，提示重新授權（未來可自動刷新）

3. **API 限制**: Shopline API 可能有速率限制
   - **應對**: 實作請求佇列或重試機制

4. **資料格式差異**: 不同 API 的回應格式可能不同
   - **應對**: 統一處理函數，適配不同格式

### 業務風險

1. **權限不足**: 商店授權時可能沒有足夠的 Scope
   - **應對**: 檢查 Scope，提供清晰的錯誤訊息

2. **測試資料**: 測試環境可能沒有足夠的測試資料
   - **應對**: 提供建立測試資料的功能

---

## 📚 參考文件

### Shopline 官方文件

- [Admin REST API 概述](https://developer.shopline.com/docs/admin-rest-api)
- [Products API](https://developer.shopline.com/docs/admin-rest-api/product)
- [Orders API](https://developer.shopline.com/docs/admin-rest-api/order)
- [Customers API](https://developer.shopline.com/docs/admin-rest-api/customer)

### 專案文件

- [系統架構](ARCHITECTURE.md)
- [Shopline API 文檔](SHOPLINE_API_DOCS.md)
- [Webhook 指南](WEBHOOK_GUIDE.md)

---

## ✅ 完成標準

### 後端完成標準

- [x] 所有 Phase 1 的 Service 方法實作完成
- [x] 所有 Phase 1 的 API Routes 實作完成
- [x] 錯誤處理機制完善
- [x] 型別定義完整
- [x] 單元測試通過率 > 80%

### 前端完成標準

- [x] 測試頁面功能完整
- [x] 所有 API 功能可正常測試
- [x] 錯誤訊息顯示清晰
- [x] UI/UX 符合專案風格
- [x] 響應式設計支援

### 整體完成標準

- [x] 所有手動測試項目通過
- [x] 文件更新完成
- [x] 程式碼 Review 通過
- [x] 無已知嚴重 Bug

---

## 🔄 後續規劃

### 短期優化（下一個 Sprint）

- Token 自動刷新機制
- API 請求快取
- 批次操作支援
- 更詳細的錯誤訊息

### 長期規劃

- GraphQL API 支援（如果 Shopline 提供）
- 資料同步功能
- 報表分析功能
- 自動化測試流程

---

## 📝 備註

- 本規劃文件為初步版本，實際實作時可能根據實際情況調整
- API 端點和參數格式需要參考最新的 Shopline 官方文件
- 建議在實作前先進行小規模測試，確認 API 格式和行為

---

**文件狀態**: 📝 待 Review  
**建立日期**: 2025-01-XX  
**最後更新**: 2025-01-XX

