# Admin API 測試介面設計文件

前端 Admin API 測試介面架構規劃文件，供使用者測試和管理 Shopline Admin API 功能。

## 📋 目錄

- [概述](#概述)
- [功能需求](#功能需求)
- [Layout 設計](#layout-設計)
- [元件設計](#元件設計)
- [技術實作](#技術實作)
- [API 整合](#api-整合)
- [使用者流程](#使用者流程)

---

## 概述

### 目標

建立一個使用者友善的前端介面，讓使用者能夠：

1. **測試 Shopline Admin API 功能**
2. **查看 API 請求與回應**
3. **快速建立測試資料（產品、訂單）**
4. **驗證 API 整合是否正常**

### 設計原則

- **簡單直觀**：操作流程清晰，減少學習成本
- **即時反饋**：操作結果立即顯示
- **錯誤處理**：友好的錯誤提示和處理
- **測試友善**：方便快速測試各種場景
- **一致性**：與 Webhook 測試介面保持一致的 UI/UX

---

## 功能需求

### 1. Store Info API 測試

#### 1.1 取得商店資訊
- **功能**：取得商店基本資訊
- **用途**：驗證 Token 是否有效、查看商店資訊
- **API**: `GET /api/stores/:handle/info`

### 2. Products API 測試

#### 2.1 取得產品列表
- **功能**：取得指定商店的所有產品
- **顯示內容**：產品 ID、標題、Handle、狀態等
- **API**: `GET /api/stores/:handle/products`

#### 2.2 取得單一產品
- **功能**：點擊產品列表中的產品，查看詳情
- **顯示內容**：完整產品資訊（包含 variants、images 等）
- **API**: `GET /api/stores/:handle/products/:productId`

#### 2.3 建立產品
- **功能**：建立新產品（含動態隨機機制）
- **自動生成**：`handle` 使用時間戳和隨機字串確保唯一性
- **API**: `POST /api/stores/:handle/products`

### 3. Orders API 測試

#### 3.1 取得訂單列表
- **功能**：取得指定商店的所有訂單
- **顯示內容**：訂單 ID、狀態、時間等
- **API**: `GET /api/stores/:handle/orders`

#### 3.2 建立訂單
- **功能**：建立新訂單（含隨機產品選擇機制）
- **自動流程**：
  1. 取得產品列表
  2. 隨機選擇一個產品
  3. 取得該產品的 `variant_id`
  4. 取得商店的 `location_id`（從 Locations API）
  5. 建立訂單
- **API**: `POST /api/stores/:handle/orders`

### 4. Locations API 測試（後續擴展）

#### 4.1 取得 Locations 列表
- **功能**：取得商店的所有 Locations
- **用途**：查看可用的 location_id
- **API**: `GET /api/stores/:handle/locations`

---

## Layout 設計

### 頁面結構（雙欄式布局）

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Admin API 測試                                              │
│  [商店列表] [Webhook 管理] [Admin API 測試] ← 當前頁面               │
├──────────────┬──────────────────────────────────────────────────────┤
│  左側欄      │  右側欄（測試功能介面）                                │
│  (1/3)       │  (2/3)                                               │
│              │                                                       │
│  ┌──────────┐│  ┌────────────────────────────────────────────────┐ │
│  │ Store    ││  │  測試功能: Get Store Info                      │ │
│  │ Selector ││  │                                                 │ │
│  │          ││  │  ┌──────────────────────────────────────────┐ │ │
│  │ [選擇商店││  │  │  Request                                 │ │ │
│  │  ▼]      ││  │  │  ┌────────────────────────────────────┐│ │ │
│  └──────────┘│  │  │  │  Endpoint: GET /api/stores/:handle/││ │ │
│              │  │  │  │            info                      ││ │ │
│  ┌──────────┐│  │  │  │  Body: [Toggle ▼]                    ││ │ │
│  │ Toggle   ││  │  │  │  { ... } (collapsed)                 ││ │ │
│  │ Menu     ││  │  │  └────────────────────────────────────┘│ │ │
│  │          ││  │  │  [送出測試]                               │ │ │
│  │ ▼ 商家   ││  │  │                                                 │ │
│  │   • Get  ││  │  └──────────────────────────────────────────┘ │ │
│  │     Store││  │                                                 │ │
│  │     Info ││  │  ┌──────────────────────────────────────────┐ │ │
│  │          ││  │  │  Response                                 │ │ │
│  │          ││  │  │  ┌────────────────────────────────────┐│ │ │
│  │ ▼ 商品   ││  │  │  │  錯誤訊息: [Toggle ▼]              ││ │ │
│  │   • Get  ││  │  │  │  (collapsed)                       ││ │ │
│  │     Products││  │  │  └────────────────────────────────────┘│ │ │
│  │   • Get  ││  │  │  ┌────────────────────────────────────┐│ │ │
│  │     Product││  │  │  │  回應內容 (固定框, 溢出 scroll)    ││ │ │
│  │     by ID││  │  │  │  {                                  ││ │ │
│  │   • Create││  │  │  │    "success": true,               ││ │ │
│  │     Product││  │  │  │    "data": { ... }                ││ │ │
│  │          ││  │  │  │  }                                  ││ │ │
│  │          ││  │  │  │  ...                                 ││ │ │
│  │ ▼ 訂單   ││  │  │  └────────────────────────────────────┘│ │ │
│  │   • Get  ││  │  │                                          │ │ │
│  │     Orders││  │  │                                          │ │ │
│  │   • Create││  │  │                                          │ │ │
│  │     Order ││  │  │                                          │ │ │
│  │          ││  │  │                                          │ │ │
│  │ ▼ 庫存   ││  │  │                                          │ │ │
│  │   • Get  ││  │  │                                          │ │ │
│  │     Locations││  │  │                                          │ │ │
│  │          ││  │  │                                          │ │ │
│  └──────────┘│  └────────────────────────────────────────────────┘ │
│              │                                                       │
└──────────────┴───────────────────────────────────────────────────────┘
```

### 布局說明

#### Header（頁首）
- **固定位置**：頁面頂部
- **高度**：64px (h-16)
- **內容**：
  - 左側：頁面標題「Admin API 測試」
  - 右側：導航連結（商店列表、Webhook 管理、Admin API 測試）
- **樣式**：白色背景、陰影、底部邊框

#### 左側欄（功能選單區）
- **寬度**：1/3 (lg:col-span-1)
- **位置**：頁面左側
- **內容區域（由上至下）**：
  1. **Store Selector（商店選擇器）**：
     - 位置：最上方
     - 樣式：白色卡片，圓角，陰影
     - 內容：下拉選單選擇商店
     - 行為：選擇後清空回應和錯誤訊息
  2. **Toggle Menu（功能選單）**：
     - 可摺疊的選單，列出所有可測試的 API 功能
     - 功能分群：商家、商品、訂單、庫存
     - 點擊功能項目，在右側欄顯示對應的測試介面

#### 右側欄（測試功能介面）
- **寬度**：2/3 (lg:col-span-2)
- **位置**：頁面右側
- **內容區域（由上至下）**：
  1. **Request 區域（上方）**：
     - 顯示當前測試功能的標題
     - 顯示 Endpoint 資訊
     - Body 內容（Toggle 可收合）
     - 「送出測試」按鈕
  2. **Response 區域（下方）**：
     - 錯誤訊息（Toggle 可收合）
     - 回應內容（固定框，溢出 scroll）
     - 空狀態提示

### 響應式設計

#### Desktop（≥ 1024px）
- 三欄式布局：Store Selector 全寬 + 左側欄 1/3 + 右側欄 2/3
- 左側欄和右側欄並排顯示

#### Tablet（768px - 1023px）
- 兩欄式布局：Store Selector 全寬 + 左側欄和右側欄並排（1:1 比例）

#### Mobile（< 768px）
- 單欄式布局：Store Selector 全寬 + 左側欄全寬 + 右側欄全寬（堆疊顯示）

---

## 元件設計

### 1. Header（頁首元件）

#### 用途
- 頁面標題顯示
- 導航連結
- 保持各頁面一致性

#### 實作狀態
✅ **已完成統一整合** - 所有頁面使用統一的 `Header` 組件（`frontend/components/Header.tsx`）

#### 設計規格
```tsx
<Header />
```

所有頁面統一使用 `Header` 組件，確保導航結構一致。

#### 導航連結
- **商店列表**：`/` - 當前頁面時為藍色背景，白色文字；否則灰色文字，hover 時變深
- **Webhook 事件**：`/#events` - 支援 hash 路由，當前頁面時為藍色背景，白色文字
- **Webhook 管理**：`/webhook-test` - 當前頁面時為藍色背景，白色文字；否則灰色文字，hover 時變深
- **Admin API 測試**：`/admin-api-test` - 當前頁面時為藍色背景，白色文字；否則灰色文字，hover 時變深

#### 特性
- ✅ 統一的高亮樣式（藍色 `bg-blue-600`）
- ✅ 支援 hash 路由（`/#events`）
- ✅ 自動偵測當前頁面並高亮對應連結
- ✅ 頁面標題根據當前路徑動態顯示

---

### 2. StoreSelector（商店選擇器）

#### 用途
- 選擇要測試的商店
- 觸發 API 測試的基礎

#### 設計規格
```tsx
<div className="mb-6 bg-white p-4 rounded-lg shadow">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    選擇商店
  </label>
  <select
    value={selectedHandle}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">請選擇商店</option>
    {/* 商店選項 */}
  </select>
</div>
```

#### 行為
- 選擇商店後清空回應和錯誤訊息
- 未選擇商店時顯示提示訊息

---

### 3. ToggleMenu（功能選單）

#### 用途
- 列出所有可測試的 API 功能
- 功能分群收合（商家、商品、訂單、庫存）
- 點擊功能項目，在右側欄顯示對應的測試介面

#### 設計規格
```tsx
<div className="bg-white rounded-lg shadow p-4 space-y-2">
  {/* 商家群組 */}
  <div>
    <button
      onClick={() => toggleGroup('store')}
      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span>商家</span>
      <span>{isGroupOpen('store') ? '▼' : '▶'}</span>
    </button>
    {isGroupOpen('store') && (
      <div className="pl-4 space-y-1">
        <button
          onClick={() => selectFunction('getStoreInfo')}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
        >
          • Get Store Info
        </button>
      </div>
    )}
  </div>

  {/* 商品群組 */}
  <div>
    <button
      onClick={() => toggleGroup('products')}
      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span>商品</span>
      <span>{isGroupOpen('products') ? '▼' : '▶'}</span>
    </button>
    {isGroupOpen('products') && (
      <div className="pl-4 space-y-1">
        <button onClick={() => selectFunction('getProducts')}>• Get Products</button>
        <button onClick={() => selectFunction('getProduct')}>• Get Product by ID</button>
        <button onClick={() => selectFunction('createProduct')}>• Create Product</button>
      </div>
    )}
  </div>

  {/* 訂單群組 */}
  <div>
    <button
      onClick={() => toggleGroup('orders')}
      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span>訂單</span>
      <span>{isGroupOpen('orders') ? '▼' : '▶'}</span>
    </button>
    {isGroupOpen('orders') && (
      <div className="pl-4 space-y-1">
        <button onClick={() => selectFunction('getOrders')}>• Get Orders</button>
        <button onClick={() => selectFunction('createOrder')}>• Create Order</button>
      </div>
    )}
  </div>

  {/* 庫存群組 */}
  <div>
    <button
      onClick={() => toggleGroup('inventory')}
      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <span>庫存</span>
      <span>{isGroupOpen('inventory') ? '▼' : '▶'}</span>
    </button>
    {isGroupOpen('inventory') && (
      <div className="pl-4 space-y-1">
        <button onClick={() => selectFunction('getLocations')}>• Get Locations</button>
      </div>
    )}
  </div>
</div>
```

#### 功能分群
- **商家**：Get Store Info
- **商品**：Get Products, Get Product by ID, Create Product
- **訂單**：Get Orders, Create Order
- **庫存**：Get Locations

---

### 4. RequestPanel（請求面板）

#### 用途
- 顯示當前測試功能的請求資訊
- 顯示 Endpoint 和 Body
- 提供「送出測試」按鈕

#### 設計規格
```tsx
<div className="bg-white rounded-lg shadow p-4 mb-4">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    測試功能: {currentFunctionName}
  </h2>

  <div className="space-y-4">
    {/* Endpoint */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Endpoint
      </label>
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm">
        {endpoint}
      </div>
    </div>

    {/* Body (Toggle) */}
    {hasBody && (
      <div>
        <button
          onClick={() => toggleBody()}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md"
        >
          <span>Body</span>
          <span>{isBodyOpen ? '▼' : '▶'}</span>
        </button>
        {isBodyOpen && (
          <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )}

    {/* 送出測試按鈕 */}
    <button
      onClick={handleSubmit}
      disabled={!selectedHandle || isLoading}
      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? '執行中...' : '送出測試'}
    </button>
  </div>
</div>
```

#### 功能說明
- **Endpoint**：顯示完整的 API 端點（包含當前選擇的 handle）
- **Body**：可收合的 Body 內容（僅 POST/PUT 請求顯示）
- **送出測試**：執行 API 測試，顯示載入狀態

---

### 5. ResponsePanel（回應面板）

#### 用途
- 顯示 API 回應內容
- 顯示錯誤訊息
- 格式化 JSON 顯示

#### 設計規格
```tsx
<div className="bg-white rounded-lg shadow p-4">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Response
  </h2>

  <div className="space-y-4">
    {/* 錯誤訊息 (Toggle) */}
    {error && (
      <div>
        <button
          onClick={() => toggleError()}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
        >
          <span>錯誤訊息</span>
          <span>{isErrorOpen ? '▼' : '▶'}</span>
        </button>
        {isErrorOpen && (
          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    )}

    {/* 回應內容 (固定框, 溢出 scroll) */}
    {response && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          回應內容
        </label>
        <div className="h-96 border border-gray-200 rounded-md bg-gray-50 overflow-auto">
          <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      </div>
    )}

    {/* 空狀態 */}
    {!response && !error && (
      <div className="text-center py-12 text-gray-500">
        <p>點擊「送出測試」查看回應內容</p>
      </div>
    )}
  </div>
</div>
```

#### 功能說明
- **錯誤訊息**：可收合的錯誤訊息區域（僅在有錯誤時顯示）
- **回應內容**：固定高度的容器（`h-96`），內容溢出時可滾動
- **空狀態**：無回應時顯示提示訊息

---

### 6. ResponseViewer（回應查看器）

#### 用途
- 顯示 API 回應內容
- 顯示錯誤訊息
- 格式化 JSON 顯示

#### 設計規格
```tsx
<div className="bg-white rounded-lg shadow p-4">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-900">回應</h2>
    <button
      onClick={handleClear}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      清除
    </button>
  </div>

  {/* 錯誤訊息 */}
  {error && (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <p className="text-sm text-red-800">{error}</p>
    </div>
  )}

  {/* JSON 回應 */}
  {response && (
    <div className="bg-gray-50 rounded-md p-4 overflow-auto">
      <pre className="text-xs text-gray-800 whitespace-pre-wrap">
        {JSON.stringify(response, null, 2)}
      </pre>
    </div>
  )}

  {/* 空狀態 */}
  {!response && !error && (
    <div className="text-center py-12 text-gray-500">
      <p>選擇功能並點擊按鈕執行 API 測試</p>
    </div>
  )}
</div>
```

#### 顯示內容
- **成功回應**：格式化 JSON（縮排、換行）
- **錯誤訊息**：紅色警告框，清楚顯示錯誤訊息
- **空狀態**：提示使用者選擇功能並執行測試

---

## 互動邏輯

### 1. 商店選擇流程

1. **選擇商店**：
   - 使用者從下拉選單選擇商店
   - 清空回應和錯誤訊息
   - 啟用 API 操作按鈕

2. **未選擇商店**：
   - 顯示提示訊息「請先選擇商店」
   - 禁用所有 API 操作按鈕

### 2. 功能選單互動

1. **Toggle 群組**：
   - 點擊群組標題（商家、商品、訂單、庫存）收合/展開
   - 使用 `▼` 表示展開，`▶` 表示收合
   - 群組狀態獨立管理

2. **選擇功能**：
   - 點擊功能項目（如「Get Store Info」）
   - 更新 `selectedFunction` 狀態
   - 在右側欄顯示對應的測試介面
   - 清空之前的回應和錯誤訊息

3. **功能狀態**：
   - **選中**：高亮顯示（背景色變化）
   - **未選中**：正常顯示，hover 時變深

### 3. API 測試流程

1. **選擇功能**：
   - 從左側選單選擇要測試的 API 功能
   - 右側欄顯示該功能的 Request 面板

2. **查看 Request**：
   - 查看 Endpoint 資訊
   - 如需要，展開 Body 查看請求內容
   - 確認請求資訊無誤

3. **送出測試**：
   - 點擊「送出測試」按鈕
   - 顯示載入狀態（按鈕顯示「執行中...」，禁用）
   - 呼叫對應的 API 方法

4. **查看回應**：
   - 如有錯誤，在 Response 區域顯示錯誤訊息（可收合）
   - 顯示 API 回應內容（固定框，溢出可滾動）
   - 回應內容格式化顯示（JSON 縮排）

### 4. Request/Response 顯示流程

1. **Request 顯示**：
   - 根據選擇的功能顯示對應的 Endpoint
   - GET 請求：不顯示 Body
   - POST/PUT 請求：顯示 Body（可收合）
   - Body 內容根據功能自動生成（如 Create Product 的隨機 handle）

2. **Response 顯示**：
   - **成功回應**：
     - 清除錯誤訊息
     - 在 Response 區域顯示格式化的 JSON 回應
     - 回應內容在固定高度的容器中，溢出可滾動
   - **錯誤回應**：
     - 清除回應內容
     - 在 Response 區域顯示錯誤訊息（可收合）
     - 錯誤訊息預設收合，點擊展開查看
     - 如有 Token 過期錯誤，提供重新授權選項（未來擴展）

3. **切換功能**：
   - 選擇新功能時，清空之前的回應和錯誤訊息
   - 顯示新功能的 Request 面板

---

## 技術實作

### 檔案結構

```
frontend/
├── pages/
│   └── admin-api-test.tsx          # 主頁面元件
├── hooks/
│   └── useAdminAPI.ts              # API 操作 Hook
├── components/
│   ├── AdminAPITestPanel.tsx      # 測試面板元件（未來擴展）
│   ├── ProductList.tsx             # 產品列表元件（未來擴展）
│   ├── OrderList.tsx               # 訂單列表元件（未來擴展）
│   └── APIResponseViewer.tsx       # 回應查看器元件（未來擴展）
└── lib/
    └── api.ts                      # API Client（已實作）
```

### 狀態管理

#### 頁面狀態
```typescript
const [selectedHandle, setSelectedHandle] = useState<string>('')
const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['store', 'products', 'orders', 'inventory']))
const [response, setResponse] = useState<any>(null)
const [error, setError] = useState<string | null>(null)
const [isBodyOpen, setIsBodyOpen] = useState<boolean>(false)
const [isErrorOpen, setIsErrorOpen] = useState<boolean>(false)
```

#### Hook 狀態
```typescript
const adminAPI = useAdminAPI(selectedHandle || null)
// 返回：{ getStoreInfo, getProducts, getProduct, createProduct, getOrders, createOrder, isLoading, error }
```

### 樣式系統

#### Tailwind CSS 配置
- **顏色系統**：使用 Tailwind 預設顏色
- **間距系統**：使用 Tailwind 預設間距
- **響應式斷點**：
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

#### 元件樣式類別
- **卡片**：`bg-white rounded-lg shadow p-4`
- **按鈕（主要）**：`bg-blue-600 text-white hover:bg-blue-700`
- **按鈕（成功）**：`bg-green-600 text-white hover:bg-green-700`
- **按鈕（禁用）**：`disabled:opacity-50 disabled:cursor-not-allowed`
- **錯誤訊息**：`bg-red-50 border border-red-200 text-red-800`
- **輸入框**：`border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500`

---

## API 整合

### API 呼叫流程

```
使用者操作
    ↓
檢查 selectedHandle 是否存在
    ↓
呼叫 useAdminAPI Hook 對應方法
    ↓
Hook 內部呼叫 apiClient 方法
    ↓
apiClient 發送 HTTP 請求到後端
    ↓
後端處理請求並呼叫 Shopline API
    ↓
返回回應或錯誤
    ↓
更新頁面狀態（response 或 error）
    ↓
顯示回應或錯誤訊息
```

### 錯誤處理

#### Token 過期錯誤
- **檢測**：檢查 `error.message` 是否包含 `TOKEN_EXPIRED` 或 `ACCESS_TOKEN_EXPIRED`
- **顯示**：顯示錯誤訊息，提示重新授權
- **未來擴展**：提供「重新授權」按鈕，導向授權頁面

#### 其他錯誤
- **顯示**：顯示錯誤訊息
- **記錄**：在 console 記錄詳細錯誤（開發模式）

---

## 使用者流程

### 流程 1: 測試 Store Info API

1. 選擇商店
2. 切換到「商店資訊」標籤
3. 點擊「取得商店資訊」按鈕
4. 查看回應區域的 JSON 回應

### 流程 2: 測試 Products API

1. 選擇商店
2. 切換到「產品」標籤
3. 點擊「取得產品列表」按鈕
4. 查看產品列表（左側欄）
5. 點擊產品卡片查看詳情（右側回應區域）
6. 點擊「建立產品（隨機）」按鈕
7. 查看建立結果，產品列表自動刷新

### 流程 3: 測試 Orders API

1. 選擇商店
2. 切換到「訂單」標籤
3. 點擊「取得訂單列表」按鈕
4. 查看訂單列表（左側欄）
5. 點擊「建立訂單（隨機產品）」按鈕
6. 系統自動：
   - 取得產品列表
   - 隨機選擇產品
   - 取得 location_id
   - 建立訂單
7. 查看建立結果，訂單列表自動刷新

---

## 設計規範

### 顏色規範

#### 主要顏色
- **主色調**：藍色 (`blue-600`, `blue-700`)
- **成功色**：綠色 (`green-600`, `green-700`)
- **錯誤色**：紅色 (`red-50`, `red-200`, `red-800`)
- **中性色**：灰色系列 (`gray-50`, `gray-100`, `gray-500`, `gray-700`, `gray-900`)

#### 背景顏色
- **頁面背景**：`bg-gray-50`
- **卡片背景**：`bg-white`
- **回應背景**：`bg-gray-50`

### 間距規範

- **頁面內邊距**：`px-4 sm:px-6 lg:px-8 py-8`
- **元件間距**：`space-y-4`, `space-y-2`, `gap-6`
- **按鈕內邊距**：`px-4 py-2`
- **卡片內邊距**：`p-4`

### 字體規範

- **頁面標題**：`text-xl font-semibold`
- **區塊標題**：`text-lg font-semibold`
- **按鈕文字**：`text-sm font-medium`
- **內文文字**：`text-sm`
- **輔助文字**：`text-xs text-gray-500`

### 圓角規範

- **卡片圓角**：`rounded-lg` (8px)
- **按鈕圓角**：`rounded-md` (6px)
- **輸入框圓角**：`rounded-md` (6px)

### 陰影規範

- **卡片陰影**：`shadow` (預設陰影)
- **頁首陰影**：`shadow-sm` (小陰影)

---

## 未來擴展

### 短期優化

1. **元件拆分**：
   - 將 `AdminAPITestPanel`、`ProductList`、`OrderList`、`APIResponseViewer` 拆分成獨立元件

2. **錯誤處理增強**：
   - Token 過期時提供重新授權按鈕
   - 更詳細的錯誤分類和提示

3. **功能擴展**：
   - 支援 Locations API 測試
   - 支援手動輸入產品/訂單資料（不只用隨機）

### 長期規劃

1. **進階功能**：
   - API 請求歷史記錄
   - 請求/回應對比
   - API 效能監控

2. **使用者體驗**：
   - 支援多個商店同時測試
   - 測試場景儲存和載入
   - 批次操作支援

3. **文件整合**：
   - API 文檔連結
   - 範例請求/回應
   - 常見問題解答

---

## 相關文件

### 專案文件
- [Sprint 2: Admin API 測試功能](../sprints/02-admin-api-testing.md) - Sprint 規劃文件
- [Webhook 測試介面設計](./WEBHOOK_TEST_UI_DESIGN.md) - 參考的 UI 設計模式
- [系統架構](./ARCHITECTURE.md) - 整體系統架構

### 技術文件
- [Next.js 文件](https://nextjs.org/docs)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [Shopline Admin API 文件](https://developer.shopline.com/docs/admin-rest-api)

---

**文件狀態**: 📝 設計中  
**建立日期**: 2025-01-XX  
**最後更新**: 2025-01-XX

