# SHOPLINE Webhook 使用指南

完整的 SHOPLINE Webhook 實作指南，包含訂閱管理、事件處理、簽名驗證與合規性要求。

## 📋 目錄

- [概述](#概述)
- [前置需求](#前置需求)
- [Webhook Payload 格式](#webhook-payload-格式)
- [事件通知協議](#事件通知協議)
- [簽名驗證](#簽名驗證)
- [時間格式說明](#時間格式說明)
- [GDPR Webhook（強制訂閱）](#gdpr-webhook強制訂閱)
- [訂閱管理 API](#訂閱管理-api)
- [Access Scope（授權範圍）](#access-scope授權範圍)
- [實作注意事項](#實作注意事項)

---

## 概述

Webhook 是一種機制，讓應用程式能夠在 SHOPLINE 商店發生特定事件（如訂單更新、商品變更等）時，即時接收到 HTTP POST 請求通知。這提供了高效能的方式來持續監控商店數據的變化。

**主要特點：**

- SHOPLINE 會主動發送 HTTP POST 請求到您配置的事件 URL
- 支援多種事件類型（訂單、商品、客戶等）
- 提供完整的簽名驗證機制確保安全性
- 內建重試機制，確保事件成功送達

**參考文件：**

- [Webhook 概述](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301)

---

## 前置需求

要接收 Webhook，必須滿足以下條件：

1. **商店已安裝您的應用程式**
   - 商店必須完成 OAuth 授權流程
   - 應用程式已取得 Access Token

2. **應用程式已訂閱特定版本的事件**
   - 需要在開發者中心完成應用程式設定
   - 使用 API 訂閱特定的事件類型

3. **設定正確的 Webhook URL**
   - URL 必須使用 HTTPS
   - 必須能夠在 5 秒內回應 HTTP 200

**參考文件：**

- [Webhook 概述 - Prerequisites](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301#prerequisites)

---

## Webhook Payload 格式

當商店中的實體（如訂單或商品）發生變化時，SHOPLINE 會透過 HTTP POST 請求將事件通知發送到配置的 URL。

### Request Headers

Webhook 請求包含以下必要的標頭：

| 標頭名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `X-Shopline-Topic` | String | Y | 事件識別符，例如：`orders/update`、`products/create` |
| `X-Shopline-Hmac-Sha256` | String | Y | Payload（body）的簽名，使用 HMAC-SHA256 算法 |
| `X-Shopline-Shop-Domain` | String | Y | 商店域名，例如：`shophub.myshopline.com` |
| `X-Shopline-Shop-Id` | String | Y | 商店 ID，例如：`1610418123456` |
| `X-Shopline-Merchant-Id` | String | Y | 商家 ID，例如：`2000001234` |
| `X-Shopline-API-Version` | String | Y | 事件版本，例如：`v20230901` |
| `X-Shopline-Webhook-Id` | String | Y | Webhook 訊息的唯一 ID，重送時保持不變 |

**範例 Headers：**

```http
X-Shopline-Topic: orders/update
X-Shopline-Hmac-Sha256: e.g. XWmrwMey6OsLMeiZKwP4FppHH3cmAiiJJAweH5Jo4bM=
X-Shopline-Shop-Domain: shophub.myshopline.com
X-Shopline-Shop-Id: 1610418123456
X-Shopline-Merchant-Id: 2000001234
X-Shopline-API-Version: v20230901
X-Shopline-Webhook-Id: b54557e48a5fbf7d70bcd043
Content-Type: application/json
```

### Request Body

請求主體（Body）包含事件的業務數據，格式為 JSON。具體結構取決於事件類型。

**重要：** 您訂閱的事件版本必須與您的應用程式服務使用的 Webhook 定義版本匹配。

**範例 Body（客戶更新事件）：**

```json
{
  "total_spent": "0",
  "addresses": [
    {
      "zip": "",
      "country": "",
      "address2": "",
      "city": "",
      "address1": "",
      "last_name": "",
      "province_code": "",
      "country_code": "",
      "default": true,
      "province": "",
      "phone": "",
      "company": "",
      "id": "SL201UA592875161232815849",
      "customer_id": "421475390",
      "first_name": ""
    }
  ],
  "gender": "others",
  "last_order_id": "1001",
  "created_at": "2023-05-10T17:00:01+08:00",
  "language": "en",
  "verified_email": false,
  "accepts_mobile_marketing": false,
  "accepts_marketing_updated_at": "2023-05-10T17:00:01+08:00",
  "orders_count": 1,
  "updated_at": "2023-05-26T19:25:47+08:00",
  "accepts_marketing": true,
  "email_subscribe_flag": 1,
  "nick_name": "test1",
  "currency": "CLP",
  "id": "421475190",
  "state": 3,
  "first_name": "test1",
  "email": "test1@joyy.com",
  "mobile_subscribe_flag": 2
}
```

**參考文件：**

- [Webhook Payload Format](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301#webhook-payload-format)
- [各事件類型詳細定義](https://developer.shopline.com/docs/webhook/) - Library，需要時依情境查閱

---

## 事件通知協議

### 1. 發送方式

- SHOPLINE 使用 **POST** 方法發送事件
- 業務數據放在請求主體（Body）中
- Content-Type: `application/json`

### 2. 回應要求

每個事件通知都需要確認（ack）回應。訂閱者必須以指定格式回應，告知 SHOPLINE 成功處理，否則 SHOPLINE 會認為通知失敗並啟動重試。

**成功回應範例：**

```http
HTTP/1.1 200 OK
```

**重要：** 必須在 **5 秒內**回應 HTTP 200，否則會被視為失敗。

### 3. 重試機制

**重試策略：**

- 如果初始通知後 **5 秒內沒有收到回應**，SHOPLINE 會認為通知失敗並開始重試
- SHOPLINE 會在 **48 小時內進行最多 19 次重試**
- 如果特定事件訊息在 19 次連續重試後仍未成功處理，且重試期間沒有其他相同類型訊息的成功記錄，平台將：
  - 移除應用程式的訂閱記錄
  - 發送標題為 "Webhook Event Subscription Deletion" 的郵件通知

**重試時間間隔：**

從第一次嘗試開始，每次重試的間隔如下：

```
0 秒 → 5 秒 → 10 秒 → 30 秒 → 45 秒 → 
1 分鐘 → 2 分鐘 → 5 分鐘 → 12 分鐘 → 38 分鐘 → 
1 小時 → 2 小時 → 4 小時 → 4 小時 → 4 小時 → 
4 小時 → 4 小時 → 4 小時 → 4 小時
```

### 4. 冪等性處理

**重要：** SHOPLINE 事件通知不保證不會重複。訂閱者必須能夠正確處理重複通知：

- 如果通知已經處理過，訂閱者應該簡單返回成功回應
- 建議使用 `X-Shopline-Webhook-Id` 來識別是否為重複事件
- 實作時應確保處理邏輯具備冪等性

### 5. 注意事項

**⚠️ 警告：**

- Webhook 事件推送不保證 100% 成功。強烈建議使用查詢 API 作為備份方案主動獲取數據
  - 例如：訂閱訂單建立事件時，也應主動使用 Get orders API 查詢訂單狀態
- 刪除的事件訂閱將不會收到任何通知訊息，直到重新建立訂閱

**參考文件：**

- [Event Notification Protocol](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301#event-notification-protocol)

---

## 簽名驗證

所有 Webhook 請求都必須驗證簽名，確保請求來自 SHOPLINE，防止未經授權的請求。

### 簽名算法

- **算法：** `HMAC-SHA256`
- **簽名內容：** Request Body（整個 JSON 字串）
- **密鑰：** `appSecret`（應用程式密鑰）

### 驗證步驟

1. 取得 Request Body 的原始字串（未解析的 JSON）
2. 使用 `appSecret` 作為密鑰，對 Body 進行 HMAC-SHA256 加密
3. 將結果轉換為十六進制字串（hex）
4. 與 Header 中的 `X-Shopline-Hmac-Sha256` 進行比較
5. 使用 `crypto.timingSafeEqual()` 進行安全比較，防止時序攻擊

### 程式碼範例（Node.js）

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  body: string,
  receivedSignature: string,
  appSecret: string
): boolean {
  // 計算預期簽名
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(body, 'utf8')
    .digest('hex')
  
  // 使用 timingSafeEqual 進行安全比較
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const receivedBuffer = Buffer.from(receivedSignature, 'hex')
    
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }
    
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch (error) {
    return false
  }
}
```

**參考文件：**

- [Signature Verification](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301#signature-verification)
- [Generate and Verify Signatures](https://developer.shopline.com/docs/apps/api-instructions-for-use/generate-and-verify-signatures?version=v20260301)

---

## 時間格式說明

SHOPLINE 平台介面顯示的時間採用 ISO 8601 編碼標準的日期時間字串。

**範例：**

2023 年 1 月 1 日下午 3:50（雪梨時間 AEST）表示為：
```
"2023-01-01T15:50:00+10:00"
```

### 時區格式

#### 新應用程式（2022 年 6 月 2 日之後上線）

除非另有說明，當應用程式訪問平台 Rest API 和 Webhook 時，顯示的時間是商店所在的時區。

**範例：**
- 北京時間（東八區）2022 年 1 月 1 日下午 3:50
- 請求西印尼時區（東七區）的商店數據
- 返回時間：`"2022-01-01T14:50:00+07:00"`

#### 舊應用程式（2022 年 6 月 2 日之前上線）

對於舊應用程式，訪問平台 Rest API 和 Webhook 時，顯示的時間是 0 時區時間。

**範例：**
- 北京時間（東八區）2022 年 1 月 1 日下午 3:50
- 請求西印尼時區（東七區）的商店數據
- 返回時間：`"2022-01-01T07:50:00+00:00"`

**注意：** 如果舊應用程式需要修改為商店時區格式，可以透過開發者服務郵箱 `openapi_v2@shopline.com` 聯繫平台請求修改。

**參考文件：**

- [Time Format Instructions](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/time-format-instructions?version=v20260301)

---

## GDPR Webhook（強制訂閱）

為了符合 GDPR（通用數據保護法規）要求，所有透過 SHOPLINE App Store 分發的應用程式都必須訂閱以下 Webhook 事件（HTTPS），以協助管理應用程式收集的用戶數據。

### 強制訂閱事件

| 事件名稱 | 事件標識符 |
|---------|-----------|
| 客戶數據刪除 | `customers/redact` |
| 商店數據刪除 | `merchants/redact` |

### 客戶數據刪除 Webhook

當商店擁有者對客戶提出刪除請求時，如果您的應用程式已被授予訪問商店「客戶」數據的權限，它將收到包含資源 ID 的刪除請求 Webhook。

**處理要求：**

- 收到 `customers/redact` Webhook 時：
  1. 使用 HTTP 200 狀態碼確認收到請求
  2. 在收到請求後 **30 天內**完成操作
  3. 如果法律要求保留數據，導致無法遵守修改請求，可以忽略操作

### 商店數據刪除 Webhook

如果商店擁有者解除安裝您的應用程式 **48 小時後**，SHOPLINE 將發送關於該操作的刪除請求 Webhook。

**處理要求：**

- 收到 `merchants/redact` Webhook 時：
  - Webhook 提供商店的 `store_id` 和 `store_domain`
  - 應從資料庫中刪除該商店的數據
  1. 使用 HTTP 200 狀態碼確認收到請求
  2. 在收到請求後 **30 天內**完成操作

### 配置方式

**配置路徑：** 開發者中心 > 應用程式列表頁面 > 應用程式概覽頁面 > 應用程式設定頁面

**步驟：**

1. 登入 [開發者中心管理介面](https://console.shoplineapp.com)
2. 選擇要提交的應用程式，進入「應用程式概覽頁面」
3. 點擊「應用程式設定」，進入「應用程式設定頁面」
4. 輸入強制 Webhook 的 URL
5. 點擊「儲存」

**注意：** 公開應用程式（Public Apps）為必填，自訂應用程式（Custom Apps）為選填。

**參考文件：**

- [GDPR Webhook](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/gdpr-webhook?version=v20260301)

---

## 訂閱管理 API

應用程式需要透過 SHOPLINE Admin Rest API 管理 Webhook 訂閱。以下為相關 API 端點：

### 1. 訂閱 Webhook

建立新的 Webhook 訂閱。

**端點：** `POST /admin/openapi/v20260301/webhooks.json`

**請求格式：**
```json
{
  "webhook": {
    "address": "https://www.shopline.com/webhook",
    "api_version": "v20240601",
    "topic": "products/create"
  }
}
```

**重要注意事項：**
- API 版本：`v20260301`（URL 中的版本）
- Webhook 事件版本：`v20240601`（body 中的 `api_version`，必須是 v20240601 或更高）
- `Content-Type`：必須是 `application/json; charset=utf-8`
- 對於 v20240601 及之後的 Webhook 事件，使用此 API 訂閱

**回應格式：**
```json
{
  "webhook": {
    "id": 45852,
    "topic": "products/create",
    "address": "https://www.shopline.com/webhook",
    "api_version": "v20240601",
    "created_at": "2025-02-13T17:01:29+08:00",
    "updated_at": "2025-02-13T17:01:32+08:00"
  }
}
```

**參考文件：**
- [Subscribe to a Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/subscribe-to-a-webhook?version=v20250601)

### 2. 取得訂閱列表

取得商店目前訂閱的所有 Webhook 列表。

**端點：** `GET /admin/openapi/v20260301/webhooks.json`

**重要注意事項：**
- `Content-Type`：必須是 `application/json; charset=utf-8`
- 對於 v20240601 及之後的 Webhook 事件，使用此 API 查詢

**回應格式：**
```json
{
  "webhooks": [
    {
      "id": 11027,
      "topic": "products/create",
      "address": "https://www.shopline.com/webhook",
      "api_version": "v20240601",
      "created_at": "2024-04-26T14:40:19+08:00",
      "updated_at": "2025-02-13T16:43:39+08:00"
    }
  ]
}
```

**用途：**
- 查看目前訂閱的 Webhook 事件類型
- 確認訂閱狀態
- 監控 Webhook 配置

**參考文件：**
- [Get a List of Subscribed Webhooks](https://developer.shopline.com/docs/admin-rest-api/webhook/get-a-list-of-subscribed-webhooks?version=v20260301)

### 3. 更新訂閱

更新已存在的 Webhook 訂閱配置。

**端點：** `PUT /admin/openapi/v20260301/webhooks/{webhook_id}.json`

**注意：** 根據 RESTful 慣例推測端點格式，建議查閱最新官方文件確認。

**參考文件：**
- [Update a Subscribed Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/update-a-subscribed-webhook?version=v20250601)

### 4. 取得單一訂閱

取得特定 Webhook 訂閱的詳細資訊。

**端點：** `GET /admin/openapi/v20260301/webhooks/{webhook_id}.json`

**注意：** 根據 RESTful 慣例推測端點格式，建議查閱最新官方文件確認。

**參考文件：**
- [Get a Subscribed Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/get-a-subscribed-webhook?version=v20250601)

### 5. 取消訂閱

移除 Webhook 訂閱。

**端點：** `DELETE /admin/openapi/v20260301/webhooks/{webhook_id}.json`

**注意：** 根據 RESTful 慣例推測端點格式，建議查閱最新官方文件確認。

**參考文件：**
- [Unsubscribe from a Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/unsubscribe-from-a-webhook?version=v20250601)

### 6. 取得訂閱數量

取得商店目前訂閱的 Webhook 總數。

**注意：** 官方文件中沒有明確的 count 端點，可以從列表 API 計算數量。
使用 `GET /admin/openapi/v20260301/webhooks.json` 然後計算 `webhooks` 陣列長度。

**用途：**
- 監控 Webhook 訂閱數量
- 確認訂閱限制

**參考文件：**
- [Get the Subscribed Webhook Count](https://developer.shopline.com/docs/admin-rest-api/webhook/get-the-subscribed-webhook-count?version=v20260301)

---

## Access Scope（授權範圍）

在實作 Webhook 處理時，需要確保應用程式具有適當的 Access Scope（授權範圍），才能訂閱和處理所需的事件。

### 常用授權範圍

| 範圍 | 說明 |
|------|------|
| `read_products` | 讀取商品資訊 |
| `write_products` | 修改商品資訊 |
| `read_orders` | 讀取訂單資訊 |
| `write_orders` | 修改訂單資訊 |
| `read_customers` | 讀取客戶資訊 |
| `write_customers` | 修改客戶資訊 |

### 擴充授權範圍

當需要擴充 Access Scope 時，需要調整 OAuth 授權流程：

1. **更新授權 URL 的 scope 參數**
   ```typescript
   const scope = 'read_products,write_products,read_orders,write_orders'
   const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${appKey}&responseType=code&scope=${scope}&redirectUri=${redirectUri}`
   ```

2. **在 OAuth 回調後，將新的 scope 儲存到資料庫**

3. **確保 Access Token 包含所需權限**

**參考文件：**

- [Access Scope](https://developer.shopline.com/docs/apps/api-instructions-for-use/access-scope?version=v20260301)

---

## 實作注意事項

### 1. 回應時間

- **必須在 5 秒內回應 HTTP 200**，否則會被視為失敗並觸發重試
- 建議實作方式：
  - 立即回應 HTTP 200
  - 將事件資料存入隊列（如 Redis）
  - 非同步處理事件邏輯

### 2. 冪等性

- 使用 `X-Shopline-Webhook-Id` 識別重複事件
- 實作時確保處理邏輯具備冪等性
- 建議在資料庫中記錄已處理的 Webhook ID

### 3. 錯誤處理

- 實作完整的錯誤處理機制
- 記錄所有 Webhook 事件（成功與失敗）
- 監控失敗率，及時發現問題

### 4. 安全性

- **必須驗證簽名**，確保請求來自 SHOPLINE
- 使用 `crypto.timingSafeEqual()` 防止時序攻擊
- 驗證商店 ID 與域名是否匹配

### 5. 備份方案

- Webhook 不保證 100% 成功
- 建議同時使用查詢 API 主動獲取數據
- 實作定期同步機制作為備份

### 6. 日誌記錄

- 記錄所有 Webhook 接收與處理過程
- 記錄簽名驗證結果
- 記錄處理時間與狀態
- 方便日後除錯與監控

### 7. Redis 整合建議

根據最初架構設計，建議整合 Redis 用於：

- **事件隊列：** 接收 Webhook 後立即存入 Redis 隊列
- **去重機制：** 使用 `X-Shopline-Webhook-Id` 作為 key，防止重複處理
- **重試機制：** 處理失敗的事件存入 Redis，支援手動重試
- **狀態追蹤：** 追蹤事件處理狀態（pending, processing, success, failed）

### 8. 介面需求

根據實作需求，應建立以下介面：

1. **Webhook 訂閱管理**
   - 查看目前訂閱的 Webhook 列表
   - 新增 Webhook 訂閱
   - 更新/刪除訂閱

2. **Webhook 事件監測**
   - 顯示接收到的 Webhook 事件列表
   - 顯示事件狀態（待處理、處理中、成功、失敗）
   - 顯示事件內容與處理結果
   - 支援手動重試失敗事件

---

## 相關文件

### 官方文件

1. [Webhook 概述](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301)
2. [時間格式說明](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/time-format-instructions?version=v20260301)
3. [GDPR Webhook](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/gdpr-webhook?version=v20260301)
4. [訂閱 Webhook](https://developer.shopline.com/docs/admin-rest-api/webhook/subscribe-to-a-webhook?version=v20260301)
5. [取得訂閱列表](https://developer.shopline.com/docs/admin-rest-api/webhook/get-a-list-of-subscribed-webhooks?version=v20260301)
6. [更新訂閱](https://developer.shopline.com/docs/admin-rest-api/webhook/update-a-subscribed-webhook?version=v20260301)
7. [取得單一訂閱](https://developer.shopline.com/docs/admin-rest-api/webhook/get-a-subscribed-webhook?version=v20260301)
8. [取消訂閱](https://developer.shopline.com/docs/admin-rest-api/webhook/unsubscribe-from-a-webhook?version=v20260301)
9. [取得訂閱數量](https://developer.shopline.com/docs/admin-rest-api/webhook/get-the-subscribed-webhook-count?version=v20260301)
10. [Access Scope](https://developer.shopline.com/docs/apps/api-instructions-for-use/access-scope?version=v20260301)
11. [Webhook 事件定義 Library](https://developer.shopline.com/docs/webhook/) - 各事件類型詳細定義，需要時依情境查閱

### 本專案相關文件

- [專案架構](../../memory/architecture/current.md)
- [Shopline API 文檔](../platform-apis/shopline-api-docs.md)

---

**最後更新**: 2025-11-03  
**文件版本**: v20260301  
**維護者**: Mo Studio

