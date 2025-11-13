---
title: NextEngine 串接必備摘要
description: 匯總 ne-test MVP 中的 NextEngine 認證、API、在庫連携與監控要點，供多平台串接器專案快速上手。
---

# NextEngine 串接必備摘要

> 📌 對應規格：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`  
> 📋 對應 Epic：`docs/backlog/epics/epic-5-next-engine-mvp.md`  
> 📚 API 參考：`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`  
> 🔧 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，可直接複製到其他專案使用）

## 1. 專案定位與基礎結構

- **目標**：提供 NextEngine OAuth、商店／商品／庫存 API 及在庫連携的端到端 MVP，作為多平台串接器的基準實作。
- **技術棧**：Node.js + Express，資料儲存採 SQLite；透過 `axios` 發送 NextEngine API 請求。
- **核心檔案**：
  - `server.js`：整合 OAuth 流程、REST 路由、在庫連携接收器。
  - `services/nextengine-*-service.js`：以領域劃分（API、shop、product、stock、order、webhook）。
  - `public/js/app.js` + `views/index.html`：測試操作台，顯示 Request/Response 與輪詢監控資訊。
- **啟動方式**：
  ```bash
  npm install
  npm run dev   # nodemon server.js
  ```

## 2. 環境變數與 ngrok 維運

- `.env` 必填：
  - `NEXTENGINE_CLIENT_ID`
  - `NEXTENGINE_CLIENT_SECRET`
  - `NEXTENGINE_REDIRECT_URI`（指向 `https://{ngrok}.ngrok-free.app/auth/callback`）
  - `NEXTENGINE_AUTH_KEY`（在庫連携簽名用金鑰）
- **ngrok 變更流程**：
  1. 取得新 URL：`curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep public_url`
  2. 更新 `.env` 中的 `NEXTENGINE_REDIRECT_URI`。
  3. 前往 NextEngine Developer 後台同步修改 Redirect URI。
  4. 重啟伺服器（`npm run dev`）。
- 建議為多平台串接器建立自動化腳本，於 ngrok 更新時同時推送設定變更並發 Slack 通知。

## 3. OAuth 與 Token 管理

> 📌 **重要**：前後端分離架構下的 OAuth 流程請參考：[Next Engine OAuth 流程指南](./NEXT_ENGINE_OAUTH_GUIDE.md)

### 3.1 授權流程

**前後端分離架構（本專案）：**
1. 前端呼叫 `GET /api/auth/next-engine/install`（需要登入）
2. 後端返回 Next Engine 授權 URL（只包含 `client_id` 和 `redirect_uri`）
3. 前端跳轉到 Next Engine 登入頁
4. Next Engine 回呼 `GET /api/auth/next-engine/callback`，返回 `uid` 與 `state`
5. 後端交換 token，暫存到 Redis（使用 `uid` 作為 key）
6. 後端重導向到前端 callback 頁面
7. 前端調用 `POST /api/auth/next-engine/complete` 完成 Connection 建立

**單體架構（ne-test 專案）：**
1. 前端呼叫 `/auth/ne` 導向 NextEngine 登入。
2. NextEngine 回呼 `/auth/callback`，返回 `uid` 與 `state`。
3. `NextEngineClient.getAccessToken()` 使用 `client_id/client_secret/uid/state` 交換取得 `access_token` 與 `refresh_token`。

### 3.2 Token 儲存策略

**本專案（前後端分離）：**
- OAuth callback 時將 token 暫存到 Redis（10 分鐘過期，使用 `uid` 作為 key）
- 前端完成 Connection 建立後，token 儲存到資料庫（`integration_accounts.authPayload`）
- Token、`uid`、`state` 只在後端，前端不碰
- 所有 Next Engine API 呼叫由後端代理

**ne-test 專案（單體架構）：**
- 使用 `services/database.js` 將 Token 寫入 SQLite（`tokens` 表），欄位包含有效期限，且維持字串型別避免誤轉數值。
- 啟動時會自動載入已保存的 Token（`NextEngineClient.initialize()`）。
- `apiExecute()` 對 `002002` 過期錯誤觸發自動刷新並重送請求。

### 3.3 Token 到期時間與 Refresh Token 機制

#### Refresh Token 的必要性

**僅使用 access_token 的情況：**
- 僅使用 `access_token` 也可以呼叫 Next Engine API
- 但當 `access_token` 的有效期限到期時，需要使用者重新認證（重新導向）
- 應用程式側需要考慮處理過程中 `access_token` 過期的情況
- 例如：在「受注更新 → 出荷確定」的流程中，如果在受注更新後 `access_token` 過期，需要重新導向到 Next Engine 伺服器，然後從出荷確定處理繼續執行

**併用 refresh_token 的情況：**
- 同時使用 `access_token` 和 `refresh_token` 呼叫 Next Engine API
- 當 `access_token` 的有效期限到期時，如果 `refresh_token` 仍在有效期限內，該次 API 呼叫會**正常完成**，並回傳新的 `access_token` 和 `refresh_token`
- 之後使用新的 `access_token` 和 `refresh_token`，只需初次使用者認證即可持續使用 API
- 處理過程中即使 `access_token` 過期，應用程式的一連串處理也能正常完成，因此不需要考慮處理中途過期的情況
- **建議**：除非有安全性考量，否則建議使用 `refresh_token` 來呼叫 Next Engine API

**安全性注意事項：**
- 如果惡意攻擊者取得使用者的 `access_token` 和 `refresh_token`，使用者的資料可能會持續外洩
- `access_token` 和 `refresh_token` 必須小心保管，避免洩漏

#### Token 有效期限規則

**有效期限長度：**
- `access_token` 的有效期限：**1 天**
- `refresh_token` 的有效期限：**3 天**

**有效期限計算基準：**
- 有效期限是從「**最初發行 `access_token` 的日期時間**」或「**最後 `access_token` 過期並更新 `access_token` 的日期時間**」開始計算的日數
- **重要**：如果 Next Engine API 回傳的 `access_token_end_date` 和 `refresh_token_end_date` 不包含完整的日期時間資訊，我們需要：
  1. **記錄首次授權完成的時間**（`createdAt`）
  2. **記錄每次 token 更新的時間**（`updatedAt`）
  3. **根據這些時間點計算到期時間**（首次授權時間 + 1 天 = access_token 到期時間，首次授權時間 + 3 天 = refresh_token 到期時間）

**批次處理建議：**
- 對於批次處理等無需認證即可定期使用 API 的情況，建議在 2 天內定期執行 API，避免有效期限過期
- 如果 `refresh_token` 的有效期限也過期，會產生與 `access_token` 過期相同的 `002004` 錯誤
- 即使已發行新的 `access_token`，如果仍使用舊的 `access_token` 執行，會產生 `002002` 錯誤

**多執行緒注意事項：**
- 不建議對同一使用者使用多執行緒呼叫 API
- 當 `access_token` 和 `refresh_token` 更新時，需要將同一使用者的所有執行緒的 `access_token` 和 `refresh_token` 都更新為新值
- 這會使應用程式側的 `access_token` 和 `refresh_token` 管理變得困難

**Token 更新時機：**
- `access_token` 和 `refresh_token` 的更新，即使在請求發生錯誤時也會更新
- 在應用程式中保存 `access_token` 和 `refresh_token` 時，**錯誤時也必須保存**（更新後的值）

#### 實作建議

**Token 到期時間計算：**
1. **首次授權時**：
   - 記錄 `createdAt`（Connection 建立時間）
   - 如果 Next Engine API 回傳 `access_token_end_date` 和 `refresh_token_end_date`，記錄原始值
   - 如果回傳值不完整或格式不正確，使用 `createdAt + 1 天` 作為 `access_token` 到期時間，`createdAt + 3 天` 作為 `refresh_token` 到期時間

2. **Token 更新時**：
   - 記錄 `updatedAt`（Connection 更新時間）
   - 如果 Next Engine API 回傳新的 `access_token_end_date` 和 `refresh_token_end_date`，記錄原始值
   - 如果回傳值不完整或格式不正確，使用 `updatedAt + 1 天` 作為 `access_token` 到期時間，`updatedAt + 3 天` 作為 `refresh_token` 到期時間

3. **完整記錄 Response**：
   - **開發階段**：完整記錄 Next Engine API 的原始 response，包括所有欄位
   - 記錄位置：`authPayload.rawResponse` 或 `auditLog.metadata.raw`
   - 目的：方便後續追查和除錯，確認 Next Engine 實際回傳的格式
   - **Production 階段**：視需要移除不必要的 log 機制

### 3.4 重要注意事項

1. **不對 Next Engine 丟 state**
   - Next Engine 授權 URL 只接受 `client_id` 和 `redirect_uri`
   - `state` 是 Next Engine 自己產生的，我們只需要保存它

2. **Token 只在後端**
   - 前端不持有 Next Engine 的 token
   - 所有 Next Engine API 呼叫由後端代理

3. **用戶識別方式**
   - Callback 時無法使用 session cookie（跨域限制）
   - 前端在 callback 時主動調用完成 API（帶上 JWT token）
   - 後端透過 `authMiddleware` 識別當前登入的使用者

### 3.4 建議

- 在多平台架構中，將 Token 流程抽象為共用 `AuthProvider`（支援 SQLite、Postgres、雲端 KMS）。
- 加入集中式審計與告警（含 requestId/timestamp）以便追蹤授權問題。

## 4. NextEngine API 領域摘要

| 領域 | 端點範例 | 核心流程 | MVP 實作亮點 |
| -- | -- | -- | -- |
| 店舖 | `/api_v1_master_shop/search`<br>`/api_v1_master_shop/create` | 查詢既有店舖、以 XML 建立新店舖。 | 預設 `shop_mall_id=90`，並於 XML 中填入在庫連携 URL 與金鑰欄位（`mall_login_id1/2`、`mall_password1`）。 |
| 商品 | `/api_v1_master_goods/search`<br>`/api_v1_master_goods/upload` | 查詢商品清單、以 CSV 上傳新商品。 | `createTestProduct()` 以時間戳產生唯一商品代碼並組裝官方欄位最小集；提供佇列查詢 API。 |
| 庫存 | `/api_v1_master_stock/search`<br>`/api_v1_warehouse_stock/upload` | 查詢主倉／分倉庫存，CSV 方式差額調整。 | 先查問當前庫存，計算差異後決定加算或減算數量；保留查詢 logs 方便除錯。 |
| 訂單 | `/api_v1_receiveorder_base/search`<br>`/api_v1_receiveorder_row/search` | 取得訂單與訂單明細。 | `analyzeStockAllocation()` 統計扣庫狀態並加上中文標記，適合轉為報表模組。 |

## 5. 在庫連携（被動式整合重點）

- NextEngine 以 GET 呼叫 `UpdateStock.php`，必須回傳 **EUC-JP** 編碼 XML：
  ```xml
  <?xml version="1.0" encoding="EUC-JP"?>
  <ShoppingUpdateStock version="1.0">
    <ResultSet TotalResult="1">
      <Result No="1">
        <Processed>0</Processed>
      </Result>
    </ResultSet>
  </ShoppingUpdateStock>
  ```
- Request 參數：`StoreAccount`, `Code`, `Stock`, `ts`, `.sig`（簽名）。
- `generateSignature()` 以排序後的 `key=value` 串 + `NEXTENGINE_AUTH_KEY` 做 MD5；若簽名不符會記錄警告。
- 系統會將每筆請求寫入 `stockUpdates` 與 `inventoryLogs`，並提供：
  - `/api/inventory/updates`：取得更新紀錄。
  - `/api/inventory/logs`：查看原始日誌。
  - `/api/inventory/status`：顯示最新統計與設定指引。
- 建議：
  - 部署於可公開 HTTPS 的服務（自備 SSL 或雲端 Load Balancer）。
  - 增加簽名失敗告警、IP 白名單、存取頻率限制。
  - 改寫持久層為資料庫或訊息佇列，利於與多平台指派同步。

## 6. Webhook 與測試工具

- `services/webhook-event-handler.js` 提供 `/api/webhook/event` / `toggle` / `status` / `events` / `DELETE` 等端點，可開關監聽並保留最近 1000 筆；適合作為共用 Webhook Gateway 範本。
- `webhook-events.html` 提供即時檢視 UI。
- `public/js/app.js` 與 `views/index.html` 封裝測試按鈕，所有 API 呼叫均顯示 Request/Response，利於 QA 與 Demo。

## 7. 多平台串接器導入建議

1. **抽象 API Provider**：將 `NextEngineAPIService` 包裝為 `NeAdapter`，並定義平台共用介面（如 `ShopProvider`、`ProductProvider`、`InventoryCallbackHandler`）。
2. **統一授權管理**：建立中央 Token Service（支援多種儲存後端）並加入審計／告警。
3. **在庫流程強化**：
   - 導入排程任務比對 NextEngine 與內部庫存差異。
   - 針對 `.sig` 驗證失敗或 `Processed` 異常建立告警。
   - 加上重放保護（ts 驗證、nonce）。
4. **監控與報表**：
   - 將 `/api/inventory/status`、扣庫分析結果送往中央監控平台（Prometheus、Datadog 等）。
   - 建立 Dashboard 檢視 OAuth 狀態、API 回應時間、在庫更新頻率。
5. **測試策略**：
   - 保留 CSV/XML 範例作為 fixture，撰寫單元測試模擬端到端流程（OAuth→商品建立→庫存更新→Webhook）。
   - 與其他平台共用測試控制台，確保功能一致性。  
   - 若官方文檔資訊不足或 API 實測失敗，請記錄實際錯誤並回報於當前 Run，避免重複查找。

## 8. 快速檢查清單（導入新環境）

| 項目 | 狀態 | 備註 |
| -- | -- | -- |
| `.env` 已填寫 | [ ] | `CLIENT_ID/SECRET/REDIRECT_URI/AUTH_KEY` |
| ngrok URL 與後台同步 | [ ] | 另行規劃自動化更新腳本 |
| SQLite 欄位確認 | [ ] | `tokens`、`auth_status` 表存在且字串型別正確 |
| OAuth 測試成功 | [ ] | `/auth/ne` → `/auth/callback` → `/api/user-info` |
| 商品／庫存 API 測試 | [ ] | `/api/products`、`/api/stock` |
| 在庫連携接收測試 | [ ] | NextEngine 後台「接続を確認」 or 模擬 GET |
| 監控端點可用 | [ ] | `/api/inventory/status`、`/api/webhook/status` |

---

> **備註**：本文檔來自 `ne-test` MVP 實作，建議在多平台串接器專案中作為 NextEngine 模組的原始藍本，並依據實際部署環境補強安全、監控、彈性擴充等需求。


