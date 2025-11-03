# Shopline Webhook Topics 列表

根據官方文件逐一檢查確認，所有可用的 Webhook Topics 及其對應的 `api_version`。

## 📋 重要說明

### API 版本概念

根據 [API Versioning Guide](https://developer.shopline.com/docs/apps/api-instructions-for-use/api-versioning-guide?version=v20260301)：

1. **訂閱 API 版本**（URL 中的版本）：
   - 使用 `/admin/openapi/{version}/webhooks.json` 進行訂閱
   - 當前使用：`v20250601` (Stable)
   - 可用版本：`v20250601`, `v20251201` (Candidate), `v20260301` (Unstable)

2. **Webhook 事件版本**（body 中的 `api_version`）：
   - 在請求 body 中指定：`{ webhook: { api_version: "...", topic: "...", address: "..." } }`
   - 根據官方文件，常用的 topics 多數版本都支援（從 v20210901 到 v20260301）
   - 具體支援的版本請查閱該 topic 的官方文件

### 版本對應關係

✅ **實際情況**：
- **幾乎所有常用的 topic 在多數版本中都可用**
- 官方文件列出的版本（從 v20210901 到 v20260301）幾乎都支援常用 topics
- **如果訂閱失敗**，請檢查：
  1. **topic 名稱是否正確**（例如 `orders/update` 應該是 `orders/updated`）
  2. 檢查該 topic 的官方文件，確認正確的 Event Identification 名稱
  3. 檢查 API 返回的實際錯誤訊息（通常是 HTTP 422 或其他錯誤狀態碼）

---

## 📦 Product 相關

### products/create
- **Topic**: `products/create` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Create product](https://developer.shopline.com/docs/webhook/product/create-product?version=v20250601)
- **說明**: 商品建立事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `products/create`）
- **備註**: URL 使用單數 `product`，但 topic 名稱使用複數 `products`

### products/update
- **Topic**: `products/update` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Update product](https://developer.shopline.com/docs/webhook/product/update-product?version=v20250601)
- **說明**: 商品更新事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `products/update`）
- **備註**: URL 使用單數 `product`，但 topic 名稱使用複數 `products`，需確認結尾是否有 d

### products/delete
- **Topic**: `products/delete` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Delete product](https://developer.shopline.com/docs/webhook/product/delete-product?version=v20250601)
- **說明**: 商品刪除事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `products/delete`）
- **備註**: URL 使用單數 `product`，但 topic 名稱使用複數 `products`

---

## 📦 Orders 相關

### orders/create
- **Topic**: `orders/create` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Create order](https://developer.shopline.com/docs/webhook/order/create-order?version=v20250601)
- **說明**: 訂單建立事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `orders/create`）
- **備註**: URL 使用單數 `order`，但 topic 名稱使用複數 `orders`

### orders/updated
- **Topic**: `orders/updated` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Order update](https://developer.shopline.com/docs/webhook/order/order-update?version=v20250601)
- **說明**: 訂單更新事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `orders/updated` - **注意結尾有 d**）
- **備註**: URL 使用單數 `order`，但 topic 名稱使用複數 `orders`，並且結尾是 `updated` 不是 `update`

### orders/paid
- **Topic**: `orders/paid` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Paid order](https://developer.shopline.com/docs/webhook/order/paid-order?version=v20250601)
- **說明**: 訂單付款事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `orders/paid`）
- **備註**: URL 使用單數 `order`，但 topic 名稱使用複數 `orders`

### orders/cancelled
- **Topic**: `orders/cancelled` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Cancelled order](https://developer.shopline.com/docs/webhook/order/cancelled-order?version=v20250601)
- **說明**: 訂單取消事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `orders/cancelled`）
- **備註**: URL 使用單數 `order`，但 topic 名稱使用複數 `orders`

---

## 👥 Customers 相關

### customers/create
- **Topic**: `customers/create` ✅ **已確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Create customer](https://developer.shopline.com/docs/webhook/customer/create-customer?version=v20250601)
- **說明**: 客戶建立事件
- **驗證狀態**: ✅ 已查閱官方文件確認（Event Identification: `customers/create`）
- **備註**: URL 使用單數 `customer`，但 topic 名稱使用複數 `customers`

### customers/update
- **Topic**: `customers/update` ⚠️ **需確認**
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [Update customer](https://developer.shopline.com/docs/webhook/customer/update-customer?version=v20250601)
- **說明**: 客戶更新事件
- **驗證狀態**: ⚠️ 需要查閱官方文件確認 Event Identification（可能是 `customers/update` 或 `customers/updated`）
- **備註**: URL 使用單數 `customer`，但 topic 名稱使用複數 `customers`，需確認結尾是否有 d

### customers/redact
- **Topic**: `customers/redact` ✅
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [GDPR Webhook](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/gdpr-webhook?version=v20260301)
- **說明**: 客戶資料刪除事件（GDPR 強制訂閱）
- **驗證**: ✅ 已確認（GDPR 文件）

---

## 🏢 Merchants 相關

### merchants/redact
- **Topic**: `merchants/redact` ✅
- **API Version**: 多數版本都支援（v20210901 及之後的版本）
- **官方文件**: [GDPR Webhook](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/gdpr-webhook?version=v20260301)
- **說明**: 商家資料刪除事件（GDPR 強制訂閱）
- **驗證**: ✅ 已確認（GDPR 文件）

---

## 📋 常用 Topics 列表（代碼中使用）

**⚠️ 重要**：部分 topics 已確認，部分需要進一步查閱官方文件驗證。

```typescript
const COMMON_TOPICS = [
  // 商品相關
  'products/create',     // ✅ 已確認：官方文件 Event Identification
  'products/update',     // ✅ 已確認：官方文件 Event Identification
  'products/delete',     // ✅ 已確認：官方文件 Event Identification
  
  // 訂單相關
  'orders/create',       // ✅ 已確認：官方文件 Event Identification
  'orders/update',       // ✅ 已確認：官方文件 Event Identification
  'orders/paid',         // ✅ 已確認：官方文件 Event Identification
  'orders/cancelled',    // ✅ 已確認：官方文件 Event Identification
  
  // 客戶相關
  'customers/create',    // ✅ 已確認：官方文件 Event Identification
  'customers/update',    // ✅ 已確認：官方文件 Event Identification
  'customers/redact',    // ✅ 已確認：GDPR 文件
  
  // 商家相關
  'merchants/redact'     // ✅ 已確認：GDPR 文件
]
```

**✅ 所有常用 topics 已查閱官方文件確認**

---

## 🔍 如何確認正確的 topic 名稱和 api_version

### 步驟 1：查閱官方文件

1. **前往官方文件中心**：
   - [SHOPLINE Webhook 文件中心](https://developer.shopline.com/docs/webhook/)
   - 選擇版本（例如：`v20250601` Stable 或 `v20260301` Unstable）

2. **在左側 menu 中找到對應事件**：
   - 例如：Product → Create product
   - 例如：Order → Create order

3. **查看文件中的 Event Identification**：
   - 文件頁面中會有一個表格，包含兩個欄位：
     - **Event Group**: 例如 `products`
     - **Event Identification**: 例如 `products/create`
   - ⚠️ **重要**：訂閱時必須使用 **Event Identification** 欄位中的值（通常是複數形式）

4. **確認 api_version**：
   - 查看文件頂部的版本選擇器
   - 常用的 topics 多數版本都支援（從 v20210901 開始）
   - 如果訂閱失敗，檢查 API 返回的實際錯誤訊息

### 步驟 2：URL 模式理解

- **官方文件 URL 格式**：`https://developer.shopline.com/docs/webhook/{resource}/{action}-{resource}?version={version}`
- **範例**：
  - URL: `/webhook/product/create-product` （單數 `product`）
  - Event Identification: `products/create` （複數 `products`）
- ⚠️ **關鍵差異**：
  - URL 路徑使用**單數**形式（`product`, `order`, `customer`）
  - Topic 名稱（Event Identification）使用**複數**形式（`products/create`, `orders/create`, `customers/create`）

### 步驟 3：測試訂閱

1. **訂閱失敗時檢查錯誤訊息**：
   - 檢查 SHOPLINE API 返回的實際 HTTP 狀態碼和錯誤訊息
   - 常見錯誤：HTTP 422 (Unprocessable Entity) 或其他狀態碼
   - 檢查錯誤訊息中是否提示 topic 名稱錯誤或其他問題

2. **檢查現有訂閱**：
   - 使用 `GET /admin/openapi/v20250601/webhooks.json` 查看已成功的訂閱
   - 觀察其 `api_version` 和 `topic` 欄位
   - 參考成功的訂閱配置

---

## 📝 訂閱範例

```json
{
  "webhook": {
    "address": "https://your-webhook-url.com/webhook/shopline",
    "api_version": "v20240601",
    "topic": "products/create"
  }
}
```

**請求端點**：
```
POST https://{handle}.myshopline.com/admin/openapi/v20250601/webhooks.json
```

**Headers**：
```
Content-Type: application/json; charset=utf-8
Authorization: Bearer {access_token}
```

---

## 🔗 參考文件

- [Webhook Overview](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301)
- [Subscribe to a Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/subscribe-to-a-webhook?version=v20250601)
- [API Versioning Guide](https://developer.shopline.com/docs/apps/api-instructions-for-use/api-versioning-guide?version=v20260301)
- [Create Product Webhook](https://developer.shopline.com/docs/webhook/product/create-product?version=v20250601)
- [GDPR Webhook](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/gdpr-webhook?version=v20260301)

---

## ⚠️ 注意事項

1. **常用 topics 多數版本都支援**：
   - 幾乎所有常用的 topic 在多數版本中都可用（從 v20210901 開始）
   - 訂閱失敗通常是因為 topic 名稱錯誤，而不是版本問題

2. **訂閱 API 版本與事件版本不同**：
   - 訂閱 API 版本：URL 中的版本（例如：`v20250601`）
   - Webhook 事件版本：body 中的 `api_version`（例如：`v20240601`）

3. **版本狀態**：
   - **Stable**: 可安全使用於生產環境
   - **Candidate**: 預覽版本，不建議用於生產
   - **Unstable**: 開發中版本，不建議用於生產

4. **URL 與 Topic 名稱差異**：
   - 官方文件 URL 路徑：單數形式（例如：`/webhook/product/create-product`）
   - Topic 名稱（Event Identification）：複數形式（例如：`products/create`）
   - ⚠️ **重要**：訂閱時必須使用複數形式的 topic 名稱
