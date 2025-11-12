# Next Engine 設定檢查清單

## 📋 快速檢查清單

### ✅ Render（後端）環境變數

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Environment**

| 變數名稱 | 變數值 | 說明 |
|---------|--------|------|
| `NEXTENGINE_CLIENT_ID` | `v6MP5RkVZD9sEo` | Next Engine App 的 Client ID |
| `NEXTENGINE_CLIENT_SECRET` | `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF` | Next Engine App 的 Client Secret |
| `NEXTENGINE_REDIRECT_URI` | `https://connector-o5hx.onrender.com/api/auth/next-engine/callback` | ⚠️ **必須使用 Render 的實際 URL** |
| `NEXTENGINE_AUTH_KEY` | `test-auth-key-12345` | 在庫連接簽章用金鑰（可選，Phase 2） |
| `REDIS_URL` | `redis://red-d406i56uk2gs739qn8ig:6379` | ⚠️ **必須使用 Internal URL**（`redis://` 開頭） |

⚠️ **重要**：
- `NEXTENGINE_REDIRECT_URI` 必須使用 Render 提供的實際後端 URL
- 如果 Render URL 不是 `connector-o5hx.onrender.com`，請替換為實際 URL
- `REDIS_URL` 必須使用 Internal URL（`redis://` 開頭），不要使用 External URL（`rediss://` 開頭）

### ✅ Vercel（前端）環境變數

前往 [Vercel Dashboard](https://vercel.com/dashboard) → **connector** 專案 → **Settings** → **Environment Variables**

| 變數名稱 | 變數值 | 說明 |
|---------|--------|------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://connector-o5hx.onrender.com` | 後端 API URL（必須與 Render URL 一致） |

### ✅ Next Engine Developer 後台設定

前往 [Next Engine Developer Console](https://developer.next-engine.com/)

#### 1. App 基本資訊

| 欄位 | 值 | 說明 |
|------|-----|------|
| **Client ID** | `v6MP5RkVZD9sEo` | 必須與 Render 環境變數 `NEXTENGINE_CLIENT_ID` 一致 |
| **Client Secret** | `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF` | 必須與 Render 環境變數 `NEXTENGINE_CLIENT_SECRET` 一致 |

#### 2. Callback URL（重要！）

在 App 設定中找到 **「リダイレクト URI」** 或 **「Callback URL」** 欄位

**設定值**：
```
https://connector-o5hx.onrender.com/api/auth/next-engine/callback
```

⚠️ **必須遵守的規則**：
- ✅ 必須與 Render 環境變數 `NEXTENGINE_REDIRECT_URI` **完全一致**
- ✅ URL 必須是 **HTTPS**
- ✅ 路徑必須完全匹配：`/api/auth/next-engine/callback`
- ✅ 不要有多餘的斜線或參數

#### 3. 在庫連携設定（可選，Phase 2）

如果需要在庫連携功能，在 Next Engine 後台設定：
- **在庫連携 Auth Key**：與 Render 環境變數 `NEXTENGINE_AUTH_KEY` 一致

---

## 🔍 驗證步驟

### 1. 檢查 Render 環境變數

1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 進入 **connector** 專案
3. 點擊左側選單 **"Environment"**
4. 確認以下環境變數已設定：
   - [ ] `NEXTENGINE_CLIENT_ID` = `v6MP5RkVZD9sEo`
   - [ ] `NEXTENGINE_CLIENT_SECRET` = `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`
   - [ ] `NEXTENGINE_REDIRECT_URI` = `https://connector-o5hx.onrender.com/api/auth/next-engine/callback`
   - [ ] `REDIS_URL` = `redis://red-d406i56uk2gs739qn8ig:6379`（Internal URL）

### 2. 檢查 Next Engine Developer 後台

1. 前往 [Next Engine Developer Console](https://developer.next-engine.com/)
2. 選擇您的 App
3. 確認以下設定：
   - [ ] **Client ID** = `v6MP5RkVZD9sEo`
   - [ ] **Client Secret** = `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`
   - [ ] **Callback URL** = `https://connector-o5hx.onrender.com/api/auth/next-engine/callback`

### 3. 驗證一致性

**必須完全一致的三個地方**：

1. **Render 環境變數** `NEXTENGINE_REDIRECT_URI`
2. **Next Engine Developer 後台** Callback URL
3. **實際的後端 URL**（Render 提供的 URL）

**範例（正確）**：
```
Render 環境變數：https://connector-o5hx.onrender.com/api/auth/next-engine/callback
Next Engine 後台：https://connector-o5hx.onrender.com/api/auth/next-engine/callback
✅ 完全一致
```

**範例（錯誤）**：
```
Render 環境變數：https://connector-o5hx.onrender.com/api/auth/next-engine/callback
Next Engine 後台：https://connector-o5hx.onrender.com/api/auth/next-engine/callback/
❌ 多了一個斜線
```

---

## 🚨 常見錯誤

### 錯誤 1：Callback URL 不一致

**症狀**：
- 授權後無法返回
- Next Engine 回調時出現 404 或錯誤

**解決方法**：
1. 確認 Render 環境變數 `NEXTENGINE_REDIRECT_URI` 的值
2. 確認 Next Engine Developer 後台的 Callback URL
3. 確保兩者**完全一致**（包括協議、域名、路徑）

### 錯誤 2：環境變數未設定

**症狀**：
- 點擊「前往 Next Engine 授權」出現 500 錯誤
- 錯誤訊息：`Cannot read properties of undefined`

**解決方法**：
1. 檢查 Render 環境變數是否已設定
2. 確認環境變數名稱拼寫正確（注意大小寫）
3. 確認環境變數值沒有多餘的空格或引號
4. Render 環境變數變更後，服務會自動重新部署

### 錯誤 3：Redis URL 錯誤

**症狀**：
- 授權後無法識別用戶
- 錯誤訊息：`Unable to identify user`

**解決方法**：
1. 確認 `REDIS_URL` 使用 **Internal URL**（`redis://` 開頭）
2. 不要使用 External URL（`rediss://` 開頭）
3. 詳細排除步驟見：`docs/reference/guides/NEXT_ENGINE_REDIS_TROUBLESHOOTING.md`

---

## 📝 設定範例

### Render 環境變數設定範例

```
NEXTENGINE_CLIENT_ID=v6MP5RkVZD9sEo
NEXTENGINE_CLIENT_SECRET=TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF
NEXTENGINE_REDIRECT_URI=https://connector-o5hx.onrender.com/api/auth/next-engine/callback
NEXTENGINE_AUTH_KEY=test-auth-key-12345
REDIS_URL=redis://red-d406i56uk2gs739qn8ig:6379
```

### Next Engine Developer 後台設定範例

**App 資訊頁面**：
- Client ID: `v6MP5RkVZD9sEo`
- Client Secret: `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`

**Callback URL 設定**：
- リダイレクト URI: `https://connector-o5hx.onrender.com/api/auth/next-engine/callback`

---

## 🔗 相關文件

- 完整部署檢查清單：`docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`
- 環境變數設定：`docs/reference/guides/ENV_SETUP_GUIDE.md`
- Next Engine OAuth 流程指南：`docs/reference/guides/NEXT_ENGINE_OAUTH_GUIDE.md`
- Redis 故障排除：`docs/reference/guides/NEXT_ENGINE_REDIS_TROUBLESHOOTING.md`

