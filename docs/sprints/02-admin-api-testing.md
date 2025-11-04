# Sprint 2: Admin API 測試功能

## 📋 Sprint 概述

**目標**: 實作 Shopline Admin API 的常用測試功能，讓開發者能夠快速測試和驗證 API 整合。

**狀態**: 📝 規劃中（待 Review）  
**開始日期**: 待定  
**完成日期**: 待定  
**持續時間**: 預計 3-5 天

**前置 Sprint**: [Sprint 1: Bug 修復與架構優化](./01-bug-fix-and-architecture.md)  
**後續 Sprint**: 待定

---

## 🎯 Sprint 目標

1. **後端 API 封裝**: 實作 Shopline Admin API 的常用功能封裝（已實測確認）
2. **前端測試介面**: 建立易用的測試介面，方便開發者測試 API
3. **測試資料生成**: 實作動態隨機機制，確保測試資料不重複
4. **錯誤處理完善**: 使用 Sprint 1 的統一錯誤處理機制

---

## 📊 前置條件

### 依賴的 Sprint 0 功能

- ✅ OAuth 授權流程（取得 Access Token）
- ✅ 商店資訊儲存（Access Token 管理）
- ✅ `ShoplineService` 基礎架構
- ✅ 資料庫連接與 Prisma 設定
- ✅ 前端基礎介面框架

### 依賴的 Sprint 1 功能

- ✅ Token 過期檢查機制（`validateStoreToken()`）
- ✅ 統一錯誤處理機制（`handleApiError()`）
- ✅ 型別定義完全獨立策略
- ✅ 健康檢查功能（後端狀態監控）

### 使用的現有功能

- 使用 `ShoplineService.validateStoreToken()` 驗證商店並檢查 Token（Sprint 1 新增）
- 使用 `ShoplineService.handleApiError()` 統一處理錯誤（Sprint 1 新增）
- 使用已儲存的 Access Token 進行 API 呼叫
- 擴展現有的 `backend/src/routes/api.ts` 路由
- 使用現有的前端框架和元件結構
- 使用已改進的錯誤處理機制（Token 過期提示、重新授權引導）

---

## 🔧 實作範圍

### Phase 1: 核心 Admin API 功能（優先實作，實測確認）

#### 1.1 商店資訊 API (Store) - 優先實作

**後端功能**:
- `getStoreInfo(handle)` - 取得商店基本資訊

**Shopline API 端點**（實測確認）:
- `GET /admin/openapi/v20250601/merchants/shop.json`

**本專案 API 端點**:
- `GET /api/stores/:handle/info`

**實作目的**:
- 驗證 Token 是否有效
- 測試基本的 API 連線
- 取得商店基本資訊
- 檢查是否有 `location_id`（用於 Create Order）

---

#### 1.2 產品 API (Products)

**後端功能**:
- `getProducts(params?)` - 取得產品列表
- `getProduct(productId)` - 取得單一產品
- `createProduct(productData)` - 建立產品

**Shopline API 端點**（實測確認）:
- `GET /admin/openapi/v20250601/products/products.json` - 取得產品列表
- `GET /admin/openapi/v20250601/products/products.json?ids={{product_id}}` - 取得單一產品
- `POST /admin/openapi/v20250601/products/products.json` - 建立產品

**本專案 API 端點**:
- `GET /api/stores/:handle/products` - 取得產品列表
- `GET /api/stores/:handle/products/:productId` - 取得單一產品
- `POST /api/stores/:handle/products` - 建立產品

**實作注意事項**:
- ✅ Create Product 必須實作動態隨機機制，確保 `handle` 不重複
- ✅ 使用時間戳或 UUID 生成唯一的 `handle`（例如：`shopline-${timestamp}-${random}`）
- ⚠️ 每個商店的 `handle` 必須唯一，否則會建立失敗

**Create Product 請求格式**（實測確認）:
```json
{
  "product": {
    "handle": "shopline-251014-01",  // ⚠️ 必須唯一，需動態生成
    "title": "shopline-251014-01",
    "tags": ["tag1, tag2"],
    "variants": [
      {
        "sku": "T0000000001",
        "price": "1000",
        "required_shipping": true,
        "taxable": true,
        "image": {
          "alt": "This is a image alt",
          "src": "https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png"
        },
        "inventory_tracker": true
      }
    ],
    "images": [
      {
        "src": "https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png",
        "alt": "This is a image alt"
      }
    ],
    "subtitle": "This is a subtitle",
    "body_html": "This is a description",
    "status": "active",
    "published_scope": "web"
  }
}
```

**動態隨機機制設計**:
```typescript
// 生成唯一的 handle
function generateUniqueHandle(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `shopline-${timestamp}-${random}`
}
```

**前端介面**:
- 產品列表頁面
- 產品詳情查看
- 產品建立表單（自動生成 `handle`）

---

#### 1.3 訂單 API (Orders)

**後端功能**:
- `getOrders(params?)` - 取得訂單列表
- `createOrder(orderData)` - 建立訂單（測試用）

**Shopline API 端點**（實測確認）:
- `GET /admin/openapi/v20250601/orders.json` - 取得訂單列表
- `POST /admin/openapi/v20250601/orders.json` - 建立訂單

**本專案 API 端點**:
- `GET /api/stores/:handle/orders` - 取得訂單列表
- `POST /api/stores/:handle/orders` - 建立訂單（測試用）

**實作注意事項**:
- ✅ Create Order 流程較複雜，需要先設計
- ✅ 需要先 `getProducts()` 隨機取得一個產品的 `variant.id`
- ✅ 需要 `location_id`（每個商店不同）
- ⚠️ `location_id` 目前沒有文件，需要後續補充

**Create Order 流程設計**:
1. 呼叫 `getProducts()` 取得產品列表
2. 隨機選擇一個產品
3. 取得該產品的 `variants[0].id` 作為 `variant_id`
4. 取得商店的 `location_id`（待決策：如何取得）
5. 建立訂單請求（數量、價格、運費隨意設定，測試用）

**Create Order 請求格式**（實測確認）:
```json
{
  "order": {
    "tags": "API_Revised",
    "price_info": {
      "total_shipping_price": "8.00"
    },
    "line_items": [
      {
        "location_id": "6402444512912503764",  // ⚠️ 每個商店不同，待決策如何取得
        "price": "3.25",
        "quantity": 1,
        "title": "beautiful skirt",
        "variant_id": "18068894570286381842792925"  // 從 getProducts 隨機取得
      }
    ]
  }
}
```

**待決策問題**:
- ❓ 如何取得商店的 `location_id`？
  - 選項 A：從 Store Info API 回應中取得
  - 選項 B：需要額外的 API 端點查詢（例如：`/locations.json`）
  - 選項 C：需要用戶手動提供（透過前端輸入）
  - 選項 D：儲存在資料庫中（首次授權時取得並儲存）
  - **目前狀態**: ⚠️ 待用戶提供相關文件或資訊

**前端介面**:
- 訂單列表頁面
- 訂單建立介面（自動選擇隨機產品，`location_id` 待決策）

---

#### 1.4 客戶 API (Customers) - Phase 2（視需求調整）

**狀態**: 暫時不實作，先完成 Store Info, Products, Orders

---

## 🏗️ 技術實作規劃

### 後端架構

#### 1. Service Layer 擴展

**檔案**: `backend/src/services/shopline.ts`

在現有的 `ShoplineService` 類別中新增方法：

```typescript
// Store Info
async getStoreInfo(handle: string, apiVersion: string = 'v20250601'): Promise<StoreInfoResponse>

// Products
async getProducts(handle: string, params?: ProductListParams, apiVersion: string = 'v20250601'): Promise<ProductListResponse>
async getProduct(handle: string, productId: string, apiVersion: string = 'v20250601'): Promise<ProductResponse>
async createProduct(handle: string, productData: CreateProductInput, apiVersion: string = 'v20250601'): Promise<ProductResponse>

// Orders
async getOrders(handle: string, params?: OrderListParams, apiVersion: string = 'v20250601'): Promise<OrderListResponse>
async createOrder(handle: string, orderData: CreateOrderInput, apiVersion: string = 'v20250601'): Promise<OrderResponse>
```

**實作模式**:
- 使用 `validateStoreToken()` 驗證商店並檢查 Token 是否過期（Sprint 1 新增）
- 使用 `fetch` 呼叫 Shopline API
- 使用 `handleApiError()` 統一處理錯誤（Sprint 1 新增）
- 統一錯誤處理和回應格式

**API 版本管理**:
- 統一使用 `v20250601` 作為預設 API 版本（已實測確認）
- API 端點格式：`https://{{handle}}.myshopline.com/admin/openapi/{{version}}/...`

**測試資料生成**:
- Create Product 使用動態隨機機制生成 `handle`
- 建議格式：`shopline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
- 確保每次測試建立的是新商品

**Create Order 流程**:
```typescript
async createOrder(handle: string, orderData?: Partial<CreateOrderInput>): Promise<OrderResponse> {
  // 1. 驗證 Token
  const store = await this.validateStoreToken(handle)
  
  // 2. 如果沒有提供 orderData，自動生成
  if (!orderData) {
    // 2.1 取得產品列表
    const products = await this.getProducts(handle)
    
    // 2.2 隨機選擇一個產品
    const randomProduct = products.products[Math.floor(Math.random() * products.products.length)]
    
    // 2.3 取得 variant_id
    const variantId = randomProduct.variants[0]?.id
    
    // 2.4 取得 location_id（待決策）
    const locationId = await this.getLocationId(handle) // ⚠️ 待實作
    
    // 2.5 生成訂單資料
    orderData = {
      order: {
        tags: "API_Test",
        price_info: {
          total_shipping_price: "8.00"
        },
        line_items: [
          {
            location_id: locationId,
            price: randomProduct.variants[0].price || "100",
            quantity: 1,
            title: randomProduct.title,
            variant_id: variantId
          }
        ]
      }
    }
  }
  
  // 3. 建立訂單
  // ... API 呼叫
}
```

#### 2. API Routes 擴展

**檔案**: `backend/src/routes/api.ts`

在現有的路由中新增：

```typescript
// Store Info routes
GET    /api/stores/:handle/info

// Products routes
GET    /api/stores/:handle/products
GET    /api/stores/:handle/products/:productId
POST   /api/stores/:handle/products

// Orders routes
GET    /api/stores/:handle/orders
POST   /api/stores/:handle/orders
```

#### 3. 型別定義

**檔案**: `frontend/types.ts` 和 `backend/src/types.ts`（採用完全獨立策略）

需要定義的型別：
```typescript
// Store Info
interface StoreInfoResponse {
  shop?: {
    id?: string
    name?: string
    domain?: string
    location_id?: string  // ⚠️ 待確認是否存在
    // ... 其他欄位
  }
}

// Products
interface Product {
  id: string
  handle: string
  title: string
  variants: ProductVariant[]
  images?: Array<{ src: string, alt: string }>
  subtitle?: string
  body_html?: string
  status: string
  published_scope: string
  // ... 其他欄位
}

interface ProductVariant {
  id: string
  sku: string
  price: string
  required_shipping: boolean
  taxable: boolean
  inventory_tracker: boolean
  // ... 其他欄位
}

interface ProductListParams {
  page?: number
  limit?: number
  ids?: string
}

interface ProductListResponse {
  products: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

interface CreateProductInput {
  product: {
    handle: string  // ⚠️ 必須唯一，需動態生成
    title: string
    tags: string[]
    variants: Array<{
      sku: string
      price: string
      required_shipping: boolean
      taxable: boolean
      image?: { alt: string, src: string }
      inventory_tracker: boolean
    }>
    images?: Array<{ src: string, alt: string }>
    subtitle?: string
    body_html?: string
    status: string
    published_scope: string
  }
}

// Orders
interface Order {
  id: string
  // ... 其他欄位
}

interface OrderListParams {
  page?: number
  limit?: number
  status?: string
}

interface OrderListResponse {
  orders: Order[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

interface CreateOrderInput {
  order: {
    tags?: string
    price_info: {
      total_shipping_price: string
    }
    line_items: Array<{
      location_id: string  // ⚠️ 每個商店不同，待決策如何取得
      price: string
      quantity: number
      title: string
      variant_id: string  // 從 getProducts 隨機取得
    }>
  }
}
```

### 前端架構

#### 1. 新增測試頁面

**檔案**: `frontend/pages/admin-api-test.tsx`

主要功能：
- 商店選擇器（使用現有的商店列表）
- API 功能分類標籤（Store Info / Products / Orders）
- 請求/回應顯示區域（JSON 格式）
- 錯誤訊息顯示

#### 2. API Hooks

**新增檔案**: `frontend/hooks/useAdminAPI.ts`

提供統一的 API 呼叫 Hook：
```typescript
export function useAdminAPI(handle: string) {
  const getStoreInfo = async () => { ... }
  const getProducts = async (params?) => { ... }
  const getProduct = async (productId) => { ... }
  const createProduct = async (productData?) => { ... }  // 可選，自動生成
  const getOrders = async (params?) => { ... }
  const createOrder = async (orderData?) => { ... }  // 可選，自動生成
}
```

#### 3. 元件擴展

**新增元件**:
- `AdminAPITestPanel.tsx` - API 測試面板
- `ProductList.tsx` - 產品列表
- `ProductForm.tsx` - 產品建立表單（自動生成 handle）
- `OrderList.tsx` - 訂單列表
- `OrderForm.tsx` - 訂單建立表單（自動選擇隨機產品）
- `APIResponseViewer.tsx` - API 回應查看器

---

## 🔍 實作細節

### 1. API 版本管理

- 統一使用 `v20250601` 作為預設 API 版本（已實測確認）
- API 端點格式：`https://{{handle}}.myshopline.com/admin/openapi/{{version}}/...`

### 2. Access Token 處理

- 使用 `validateStoreToken()` 驗證商店並檢查 Token 是否過期（Sprint 1 新增）
- 在請求 Header 中使用 `Authorization: Bearer {token}`
- 處理 Token 過期情況（會自動提示重新授權）

### 3. 請求格式

所有 Admin API 請求：
- Base URL: `https://{handle}.myshopline.com/admin/openapi/v20250601/...`
- Headers: `Content-Type: application/json; charset=utf-8`
- Headers: `Authorization: Bearer {accessToken}`

### 4. 回應處理

- 統一處理成功回應（200, 201）
- 使用 `handleApiError()` 統一處理錯誤（Sprint 1 新增）
- 記錄詳細的錯誤日誌

### 5. 測試資料生成

**Create Product**:
- 使用動態隨機機制生成唯一 `handle`
- 建議格式：`shopline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
- 確保每次測試建立的是新商品

**Create Order**:
- 先呼叫 `getProducts()` 取得產品列表
- 隨機選擇一個產品
- 取得 `variants[0].id` 作為 `variant_id`
- 取得 `location_id`（待決策：如何取得）
- 數量、價格、運費隨意設定（測試用）

### 6. 本地測試

**後端測試**:
- 從資料庫讀取未過期的 Token
- 使用對應的 `handle` 進行測試
- 確保 Token 未過期（使用 `validateStoreToken()`）

**前端測試**:
- 使用已授權的商店進行測試
- 顯示 Token 過期提示（如果過期）
- 提供重新授權選項

### 7. 待決策事項處理

**Location ID**:
- 先實作其他功能（Store Info, Products）
- 在 Store Info API 回應中檢查是否有 `location_id`
- 如果沒有，暫時使用前端輸入或待用戶提供資訊
- 記錄在「待決策問題」區塊中

---

## 🧪 測試規劃

### 單元測試

- Service 方法測試
- API 路由測試
- 錯誤處理測試
- 動態隨機機制測試

### 整合測試

- 完整 API 流程測試
- 前端元件測試
- 端到端測試

### 手動測試清單

**Store Info**:
- [ ] 取得商店資訊
- [ ] 檢查 Token 是否有效
- [ ] 檢查回應格式

**Products**:
- [ ] 產品列表查詢
- [ ] 產品詳情查詢（使用 `ids` 參數）
- [ ] 產品建立（測試動態隨機機制）
- [ ] 產品建立（測試 handle 重複處理）

**Orders**:
- [ ] 訂單列表查詢
- [ ] 訂單建立（自動選擇隨機產品）
- [ ] 訂單建立（location_id 處理）
- [ ] 錯誤處理（無效 Token、無效 ID 等）

---

## 📅 時程估算

### Phase 1: 核心功能（預計 3-5 天）

**Day 1: 後端基礎 API 實作**
- [ ] Store Info API 封裝（Service + Routes）
- [ ] Products API 封裝（Service + Routes）
  - [ ] Get Products
  - [ ] Get Product By Id
  - [ ] Create Product（含動態隨機機制）
- [ ] 錯誤處理機制
- [ ] 型別定義

**Day 2: 後端 Orders API 實作**
- [ ] Get Orders API 封裝
- [ ] Create Order 流程設計與實作
  - [ ] 隨機產品選擇機制
  - [ ] Location ID 處理（待決策）
- [ ] 錯誤處理機制

**Day 3: 前端基礎介面**
- [ ] 測試頁面框架
- [ ] API Hooks 實作
  - [ ] useStoreInfo
  - [ ] useProducts
  - [ ] useOrders
- [ ] 基本 UI 元件

**Day 4: 前端完整功能**
- [ ] Store Info 測試介面
- [ ] Products 測試介面（列表、詳情、建立）
- [ ] Orders 測試介面（列表、建立）
- [ ] 回應查看器
- [ ] 錯誤訊息顯示

**Day 5: 測試與優化**
- [ ] 本地測試（使用資料庫中的 Token）
- [ ] 整合測試
- [ ] Bug 修復
- [ ] 文件更新

---

## 🚨 風險與注意事項

### 技術風險

1. **API 版本差異**: 不同 API 端點可能使用不同版本號
   - **應對**: 統一使用 `v20250601`（已實測確認）

2. **Token 過期**: Access Token 可能在使用過程中過期
   - **應對**: 已實作 Token 檢查機制（Sprint 1），會自動檢查並提示重新授權

3. **API 限制**: Shopline API 可能有速率限制
   - **應對**: 實作請求佇列或重試機制（未來優化）

4. **資料格式差異**: 不同 API 的回應格式可能不同
   - **應對**: 統一處理函數，適配不同格式

5. **Product Handle 重複**: 建立產品時 `handle` 必須唯一
   - **應對**: 實作動態隨機機制生成唯一 `handle`

6. **Location ID 未知**: Create Order 需要 `location_id`，但目前沒有文件
   - **應對**: 先實作其他功能，`location_id` 待用戶提供資訊後補充
   - **狀態**: ⚠️ 待決策

### 待決策問題

#### 問題 1: Location ID 如何取得？

**背景**:
- Create Order 需要 `location_id`
- 每個商店的 `location_id` 不同
- 目前沒有相關文件說明如何取得

**選項**:
- **選項 A**: 從 Store Info API (`/merchants/shop.json`) 回應中取得
- **選項 B**: 需要額外的 API 端點查詢（例如：`/locations.json`）
- **選項 C**: 需要用戶手動提供（透過前端輸入）
- **選項 D**: 儲存在資料庫中（首次授權時取得並儲存）

**建議**:
- 先實作其他功能（Store Info, Products）
- 在 Store Info API 回應中檢查是否有 `location_id`
- 如果沒有，暫時使用前端輸入或待用戶提供資訊

**狀態**: ⚠️ 待用戶提供文件或資訊

---

#### 問題 2: Create Order 的完整流程

**已確認**:
- ✅ 需要先 `getProducts()` 取得產品列表
- ✅ 隨機選擇一個產品
- ✅ 取得 `variants[0].id` 作為 `variant_id`
- ✅ 需要 `location_id`（待決策）

**待確認**:
- ❓ `location_id` 如何取得
- ❓ 是否需要其他必填欄位
- ❓ 價格和數量是否有特殊限制

**狀態**: ⚠️ 待用戶提供文件或資訊

---

#### 問題 3: 其他必填欄位

**Create Product**:
- ✅ 已確認所有必填欄位（從實測請求格式）
- ✅ `handle` 必須唯一（已設計動態生成機制）

**Create Order**:
- ✅ 已確認基本欄位（從實測請求格式）
- ⚠️ `location_id` 來源待確認
- ❓ 是否需要其他必填欄位（待測試）

**狀態**: ⚠️ 待實作時測試確認

### 業務風險

1. **權限不足**: 商店授權時可能沒有足夠的 Scope
   - **應對**: 檢查 Scope，提供清晰的錯誤訊息

2. **測試資料**: 測試環境可能沒有足夠的測試資料
   - **應對**: 提供建立測試資料的功能（Create Product, Create Order）

3. **測試資料污染**: 建立測試資料可能污染真實商店資料
   - **應對**: 使用明確的測試標記（例如：`handle` 包含 `shopline-test-` 前綴）

---

## 📚 參考文件

### Shopline 官方文件（實測確認）

- [Get Store Information](https://developer.shopline.com/docs/admin-rest-api/store/query-store-information?version=v20250601)
  - `GET /admin/openapi/v20250601/merchants/shop.json`

- [Get Products](https://developer.shopline.com/docs/admin-rest-api/product/product/get-products?version=v20250601)
  - `GET /admin/openapi/v20250601/products/products.json`

- [Get a Product](https://developer.shopline.com/docs/admin-rest-api/product/product/get-a-product?version=v20250601)
  - `GET /admin/openapi/v20250601/products/products.json?ids={{product_id}}`

- [Create a Product](https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product?version=v20250601)
  - `POST /admin/openapi/v20250601/products/products.json`

- [Get Orders](https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20250601)
  - `GET /admin/openapi/v20250601/orders.json`

- [Create an Order](https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20250601)
  - `POST /admin/openapi/v20250601/orders.json`

### 其他參考文件

- [Admin REST API 概述](https://developer.shopline.com/docs/admin-rest-api)
- [Customers API](https://developer.shopline.com/docs/admin-rest-api/customer) - Phase 2

### 專案文件

- [Sprint 總覽](./SPRINT_INDEX.md)
- [Sprint 0: 基礎架構與 OAuth 授權](./00-foundation.md)
- [Sprint 1: Bug 修復與架構優化](./01-bug-fix-and-architecture.md)
- [系統架構](../ARCHITECTURE.md)
- [專案結構與部署架構](../PROJECT_STRUCTURE.md)
- [Shopline API 文檔](../../SHOPLINE_API_DOCS.md)
- [Webhook 指南](../WEBHOOK_GUIDE.md)

### 設計文件

- [Admin API 測試介面設計](../ADMIN_API_TEST_UI_DESIGN.md) - Admin API 測試頁面 Layout 設計文件
- [Webhook 測試介面設計](../WEBHOOK_TEST_UI_DESIGN.md) - 前端測試介面架構規劃（參考的 UI 設計模式）

**可參考的設計模式**：
- 商店選擇器（下拉選單）
- API 功能分類標籤（Store Info / Products / Orders）
- 請求/回應顯示區域（JSON 格式）
- 錯誤訊息顯示（清晰的錯誤提示）
- 載入狀態顯示（Spinner 動畫）

**設計建議**：
- 使用與 Webhook 測試介面一致的 UI/UX 風格
- 參考其左側功能選擇、右側內容顯示的佈局
- 使用相同的錯誤處理和提示機制
- 保持一致的響應式設計

**差異點**：
- Admin API 測試需要更多表單輸入（建立產品、訂單等）
- 需要支援分頁顯示（產品列表、訂單列表）
- 需要支援搜尋和篩選功能

---

## ✅ 完成標準

### 後端完成標準

- [ ] Store Info API 實作完成（Service + Routes）
- [ ] Products API 實作完成
  - [ ] Get Products
  - [ ] Get Product By Id
  - [ ] Create Product（含動態隨機機制）
- [ ] Orders API 實作完成
  - [ ] Get Orders
  - [ ] Create Order（含隨機產品選擇機制）
- [ ] 錯誤處理機制完善（使用 Sprint 1 的機制）
- [ ] 型別定義完整
- [ ] 本地測試通過（使用資料庫中的 Token）

### 前端完成標準

- [ ] 測試頁面功能完整
- [ ] Store Info 測試介面
- [ ] Products 測試介面（列表、詳情、建立）
- [ ] Orders 測試介面（列表、建立）
- [ ] 所有 API 功能可正常測試
- [ ] 錯誤訊息顯示清晰（使用 Sprint 1 的錯誤處理）
- [ ] UI/UX 符合專案風格（參考 Webhook 測試介面）
- [ ] 響應式設計支援

### 整體完成標準

- [ ] 本地測試通過（前後端都能正常運作）
- [ ] 所有手動測試項目通過
- [ ] 待決策問題已記錄（Location ID 等）
- [ ] 文件更新完成
- [ ] 程式碼 Review 通過
- [ ] 無已知嚴重 Bug
- [ ] **等待用戶 Review 後才能 push 上線**

### 待用戶 Review 事項

- [ ] Location ID 取得方式確認
- [ ] Create Order 流程確認
- [ ] 測試資料格式確認
- [ ] 其他必填欄位確認

---

## 🔄 後續規劃

### 短期優化（下一個 Sprint）

- Location ID 處理機制（待用戶提供資訊後補充）
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

### 實作注意事項

1. **API 端點已實測確認**: 所有 API 端點和請求格式都已經過 Postman 實測確認
2. **動態隨機機制**: Create Product 必須實作動態隨機機制，確保 `handle` 不重複
3. **Create Order 流程**: 需要先設計，包含隨機產品選擇和 `location_id` 處理
4. **待決策問題**: Location ID 如何取得，目前沒有文件，需要後續補充
5. **本地測試**: 使用資料庫中未過期的 Token 進行測試
6. **等待 Review**: 所有功能實作完成後，等待用戶 Review 才能 push 上線

### 實作順序建議

1. **優先實作**: Store Info API（最簡單，可用於驗證 Token）
2. **其次實作**: Products API（Get Products, Get Product By Id, Create Product）
3. **最後實作**: Orders API（Get Orders, Create Order）
4. **待決策**: Location ID 處理（先記錄問題，待用戶提供資訊）

### 開發流程

1. **實作階段**: 根據規劃文件實作功能
2. **本地測試**: 使用資料庫中的 Token 進行測試
3. **記錄問題**: 遇到需要決策的問題先記錄，不卡住開發
4. **等待 Review**: 完成後等待用戶 Review
5. **Push 上線**: Review 通過後才能 push 上線

---

---

## ✅ 完成狀態

### 已完成功能

1. **後端 API 封裝** ✅
   - Store Info API
   - Products API (Get, Get By Id, Create)
   - Orders API (Get, Create)
   - Locations API (Get)
   - 動態隨機 handle 生成機制
   - 多步驟操作 handle/token 一致性保證

2. **前端測試介面** ✅
   - Admin API 測試頁面
   - Toggle Menu 功能選單
   - Request/Response 顯示面板
   - 錯誤處理與提示
   - Handle/Token 鎖定機制（方案 B）

3. **架構優化** ✅
   - Handle/Token 一致性保證（方案 B：最小改動）
   - 多步驟操作 handle 鎖定機制
   - Header 統一化（由另一個 agent 完成）

4. **文件完善** ✅
   - Admin API 測試介面設計文件
   - Handle/Token 狀態管理架構分析文件

### 待後續 Sprint 處理

- **狀態管理重構**（方案 A）：下個 Sprint 規劃完整 Context 架構

---

**Sprint 狀態**: ✅ 已完成  
**建立日期**: 2025-01-XX  
**完成日期**: 2025-01-XX  
**最後更新**: 2025-01-XX
