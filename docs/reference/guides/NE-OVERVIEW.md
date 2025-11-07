---
title: NextEngine 串接必備摘要
description: 匯總 ne-test MVP 中的 NextEngine 認證、API、在庫連携與監控要點，供多平台串接器專案快速上手。
---

# NextEngine 串接必備摘要

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

### 3.1 授權流程

1. 前端呼叫 `/auth/ne` 導向 NextEngine 登入。
2. NextEngine 回呼 `/auth/callback`，返回 `uid` 與 `state`。
3. `NextEngineClient.getAccessToken()` 使用 `client_id/client_secret/uid/state` 交換取得 `access_token` 與 `refresh_token`。

### 3.2 Token 儲存策略

- 使用 `services/database.js` 將 Token 寫入 SQLite（`tokens` 表），欄位包含有效期限，且維持字串型別避免誤轉數值。
- 啟動時會自動載入已保存的 Token（`NextEngineClient.initialize()`）。
- `apiExecute()` 對 `002002` 過期錯誤觸發自動刷新並重送請求。

### 3.3 建議

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


