# Next Engine 平台整合規格（Phase 1.3）

> 📑 參考：`docs/reference/guides/NE-OVERVIEW.md`（實驗專案導入指南）  
> 📌 對應 Epic：`docs/backlog/epics/epic-5-next-engine-mvp.md`  
> 📚 API 詳細參考：`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`  
> 🔧 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，可直接複製到其他專案使用）

---

## 1. 整體目標

- 在既有 Connection 架構下，導入 Next Engine 作為第二個平台，驗證多平台 OAuth、資料讀取與狀態同步能力。
- 將 Platform Adapter 介面收斂為工廠模式（`PlatformServiceFactory` + adapter interface），確保平台差異封裝於 adapter 內。
- 完成最小可行的 API 讀取流程（店鋪 / 訂單），並沿用 Epic 4 的權限與審計流程。

---

## 2. OAuth 與 Token 流程

### 2.1 端點配置
- 授權導向：`https://api.next-engine.org/apis/oauth2/authorize`
- Token 交換：`https://api.next-engine.org/apis/oauth2/token`
- Refresh：沿用 token 端點，grant_type=`refresh_token`

### 2.2 Adapter 介面要求
- Adapter 需實作以下方法：
  - `getAuthorizeUrl(state)`：組合平台授權網址
  - `exchangeToken(code, state)`：取得 access / refresh token，封裝為標準化 payload
  - `refreshToken(refreshToken)`：回傳新的 access token 與 expiresAt
  - `getIdentity(token)`：取得 Next Engine company 資訊（供 Connection displayName）
- Adapter 需回傳統一的錯誤物件：`{ type: 'TOKEN_EXPIRED' | 'TOKEN_REVOKED' | 'PLATFORM_ERROR', message, raw }`

### 2.3 錯誤碼映射策略
- 初期對照表：
  - `002002`（token expired）→ `TOKEN_EXPIRED`
  - `002003`（refresh failed）→ `TOKEN_REFRESH_FAILED`
  - 其他未知錯誤 → `PLATFORM_UNKNOWN`（保留原始訊息，供日後補齊）
- 後續實測時若遇到新代碼，於 adapter 流程中補上映射，並在本文件與 `docs/reference/guides/NE-OVERVIEW.md` 互相更新。

---

## 3. 資料模型與欄位對應

| Connection 層 (`integration_accounts`) | Next Engine 欄位 | 說明 |
| --- | --- | --- |
| `externalAccountId` | `companyId` | 作為 Next Engine 公司識別，對應 Company 畫面 |
| `displayName` | `companyName`（登入後查詢） | 顯示在 Context Bar 的名稱 |
| `authPayload` | access token, refresh token, expires_at, scope | 保持 JSON 字串化 |

| Connection Item 層 (`connection_items`) | Next Engine 欄位 | 說明 |
| --- | --- | --- |
| `externalResourceId` | `shopId` | Next Engine 店舖 ID |
| `displayName` | `shopName` | 顯示名稱 |
| `metadata` | `mallId`, `mallName`, `warehouseIds`... | JSON 格式存放平台特有欄位 |

> ✅ 上述對應與命名策略已記錄於 `docs/memory/decisions/connection-data-model.md`。

---

## 4. 前端整合重點

- Connection Dashboard 需顯示 Next Engine 平台徽章與授權狀態，沿用 Epic 4 的 Layout。
- `useConnection` store 初始化邏輯：URL 參數 `platform=next-engine`、`connectionId`、`itemId` 需同步至 Zustand 狀態。
- 重新授權流程：共用 Modal，但依平台顯示自訂文案（例如「前往 Next Engine 授權頁」）。
- 平台差異文案集中於 `frontend/content/platforms/next-engine.ts`（新檔），避免散落多處。

---

## 5. 環境變數

| 變數 | 說明 | 儲存位置 |
| --- | --- | --- |
| `NEXTENGINE_CLIENT_ID` | Next Engine App client id | 後端 `.env` / Render 環境變數 |
| `NEXTENGINE_CLIENT_SECRET` | Next Engine App client secret | 同上 |
| `NEXTENGINE_REDIRECT_URI` | OAuth 回呼網址（`https://{backend}/api/auth/next-engine/callback`） | 同上 |
| `NEXTENGINE_AUTH_KEY` | 在庫連攜簽名 key | 同上 |

### Sandbox（ne-test）憑證

| 變數 | 目前值 | 備註 |
| --- | --- | --- |
| `NEXTENGINE_CLIENT_ID` | `v6MP5RkVZD9sEo` | 由 NextEngine Developer 後台建立的測試 App（請勿公開） |
| `NEXTENGINE_CLIENT_SECRET` | `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF` | 與上方 Client ID 配對，妥善保管 |
| `NEXTENGINE_REDIRECT_URI` | `https://627af16aeb02.ngrok-free.app/auth/callback` | 每次 ngrok / 部署網域變更需同步 `.env` 與 NextEngine 後台 |
| `NEXTENGINE_AUTH_KEY` | `test-auth-key-12345`（預設） | 正式環境請改用專用金鑰 |

> ⚠️ 若更換 ngrok 或部署域名，請即時更新 `.env`、Render/Vercel 設定以及 NextEngine Developer 後台的 Redirect URI。

### Auth Key 配置說明
- `NEXTENGINE_AUTH_KEY` 是我們自訂的預共享金鑰，用於驗證 Next Engine 在庫連攜回呼（`UpdateStock.php`）。
- 管理員需在 NextEngine Developer 後台的在庫連接設定中填入相同的金鑰，才能讓 Next Engine 產生正確簽章。
- OAuth 流程僅使用 Client ID / Secret / Redirect URI；Auth Key 不會透過 API 下發，須雙方手動同步。
- 正式環境請另行生成高強度金鑰並安全保存。

---

## 6. API 讀取與權限

- 詳細端點參數與範例：見 `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`。  
- MVP 先支援：
  - 店舖列表：`/api_v1_master_shop/search`
  - 訂單摘要：`/api_v1_receiveorder_base/search`
- 後端透過 adapter 進行 API 呼叫，並記錄 requestId / response 於審計 log。
- 需檢查回傳結果 `code` 是否 `000000` 成功，否則轉換為 `PLATFORM_ERROR`。
- 權限檢查沿用 Story 4.3 的 middleware（必須驗證 connection owner）。

---

## 7. 測試與驗收指引

1. OAuth happy path：完成授權、顯示新的 Connection、Activity Dock 記錄成功。
2. Refresh token：手動讓 access token 過期，確認 `002002` 被映射並自動刷新。
3. API 呼叫：
   - 取得店舖列表並顯示於 Connection Dashboard。
   - 當 API 返回錯誤代碼時，Activity Dock 與 Toast 顯示友善訊息。
4. 在庫連攜：暫不納入 Epic 5 MVP，但保留 webhook endpoint 與簽名驗證程式碼接口。

---

## 8. 雙向連結

- 來源指南：`docs/reference/guides/NE-OVERVIEW.md`
- Run / Story：`docs/backlog/epics/epic-5-next-engine-mvp.md`、`docs/backlog/stories/story-5-1-next-engine-oauth.md`（建立後自動引用）
- 環境設定：`docs/reference/guides/ENV_SETUP_GUIDE.md`

---

## 9. 待後續追蹤

- Sandbox 憑證提供後，更新本文件的環境變數區段與測試清單。
- 錯誤碼映射隨實際測試補齊（需同步更新 `NE-OVERVIEW.md` 與 `NEXTENGINE_API_REFERENCE.md`）。
- 若官方文件不足或實測仍失敗，請記錄細節並於 Run 中提出支援需求。
- Phase 2 才進一步討論 Connection 共享、Webhook 路由等議題（見 `docs/backlog/inbox/note-2025-11-11-001-admin-connection-isolation.md`）。
