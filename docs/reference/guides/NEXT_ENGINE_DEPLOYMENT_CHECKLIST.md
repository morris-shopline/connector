# Next Engine 正式站部署檢查清單

## 📋 判斷說明

**本地測試限制**：
- Next Engine OAuth 需要公開可訪問的 callback URL
- `localhost:3001` 無法被 Next Engine 回調
- 雖然可用 ngrok，但需要額外設定且每次 URL 變更都要更新 Next Engine 後台

**建議**：直接部署到正式站測試會更快、更穩定。

---

## 🚀 部署步驟

### 第一步：Render（後端）環境變數設定

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Environment**

#### ✅ 必須新增的 Next Engine 環境變數

```
變數名稱：NEXTENGINE_CLIENT_ID
變數值：v6MP5RkVZD9sEo
```

```
變數名稱：NEXTENGINE_CLIENT_SECRET
變數值：TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF
```

```
變數名稱：NEXTENGINE_REDIRECT_URI
變數值：https://connector-o5hx.onrender.com/api/auth/next-engine/callback
```
⚠️ **重要**：使用 Render 提供的實際後端 URL（正式環境：`https://connector-o5hx.onrender.com`）

```
變數名稱：NEXTENGINE_AUTH_KEY
變數值：test-auth-key-12345
```
⚠️ **注意**：正式環境請改用專屬金鑰

#### ✅ 確認其他必要環境變數已設定

- [ ] `DATABASE_URL`
- [ ] `PORT` (10000)
- [ ] `NODE_ENV` (production)
- [ ] `FRONTEND_URL` (使用 Vercel URL：`https://connector-theta.vercel.app`)
- [ ] `JWT_SECRET`
- [ ] `REDIS_URL` (Render Internal Redis)
- [ ] Shopline 相關環境變數（如果使用）

#### 📝 記錄 Render 後端 URL

部署完成後，記錄實際的後端 URL：
```
後端 URL：https://________________________
```

---

### 第二步：Vercel（前端）環境變數設定

前往 [Vercel Dashboard](https://vercel.com/dashboard) → **connector** 專案 → **Settings** → **Environment Variables**

#### ✅ 確認必要環境變數已設定

- [ ] `NEXT_PUBLIC_BACKEND_URL` (使用 Render URL：`https://connector-o5hx.onrender.com`)
- [ ] Shopline 相關環境變數（如果使用）

#### 📝 記錄 Vercel 前端 URL

部署完成後，記錄實際的前端 URL：
```
前端 URL：https://________________________
```

---

### 第三步：Next Engine Developer 後台設定

#### 1. 登入 Next Engine Developer 後台

前往 [Next Engine Developer Console](https://developer.next-engine.com/)

#### 2. 選擇或建立 App

- 如果已有 App，選擇現有的 App
- 如果沒有，建立新的 App

#### 3. 設定 Callback URL（重要！）

在 App 設定中找到 **「リダイレクト URI」** 或 **「Callback URL」** 欄位

**設定值**：
```
https://connector-o5hx.onrender.com/api/auth/next-engine/callback
```

⚠️ **重要**：
- 必須使用 Render 提供的實際後端 URL
- URL 必須是 HTTPS
- 路徑必須完全匹配：`/api/auth/next-engine/callback`

#### 4. 確認 App 資訊

確認以下資訊與 Render 環境變數一致：
- **Client ID**：應為 `v6MP5RkVZD9sEo`
- **Client Secret**：應為 `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`

#### 5. 在庫連攜設定（可選，Phase 2）

如果需要在庫連攜功能，在 Next Engine 後台設定：
- **在庫連攜 Auth Key**：與 Render 環境變數 `NEXTENGINE_AUTH_KEY` 一致

---

### 第四步：驗證部署

#### 1. 檢查後端健康狀態

訪問：
```
https://connector-o5hx.onrender.com/api/health
```

應該看到：
```json
{
  "success": true,
  "message": "Service is running",
  "timestamp": "...",
  "database": "connected"
}
```

#### 2. 檢查前端

訪問：
```
https://connector-theta.vercel.app/
```

應該可以看到前端頁面正常載入。

#### 3. 測試 Next Engine OAuth 流程

1. 登入前端系統
2. 進入 Connections 頁面
3. 點擊「新增 Connection」
4. 選擇「Next Engine」平台
5. 點擊「前往 Next Engine 授權」
6. **驗證點**：
   - 應該能正常跳轉到 Next Engine 登入頁面
   - 登入並授權後，應該能正常返回並建立 Connection
   - 不應出現 500 錯誤或環境變數缺失錯誤

---

## 🔄 環境變數更新流程

如果 Render URL 變更，需要同步更新：

1. **Render 環境變數**：
   - `NEXTENGINE_REDIRECT_URI` → 更新為新的 Render URL
   - `FRONTEND_URL` → 更新為新的 Vercel URL（如果變更）

2. **Vercel 環境變數**：
   - `NEXT_PUBLIC_BACKEND_URL` → 更新為新的 Render URL

3. **Next Engine Developer 後台**：
   - Callback URL → 更新為新的 Render URL

4. **重新部署**：
   - Render 會自動重新部署（環境變數變更後）
   - Vercel 需要手動重新部署或等待自動部署

---

## 📋 完整環境變數檢查清單

### Render（後端）

#### 基礎設定
- [ ] `DATABASE_URL`
- [ ] `PORT` (10000)
- [ ] `NODE_ENV` (production)

#### Next Engine 設定
- [ ] `NEXTENGINE_CLIENT_ID` = `v6MP5RkVZD9sEo`
- [ ] `NEXTENGINE_CLIENT_SECRET` = `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`
- [ ] `NEXTENGINE_REDIRECT_URI` = `https://connector-o5hx.onrender.com/api/auth/next-engine/callback`
- [ ] `NEXTENGINE_AUTH_KEY` = `test-auth-key-12345`（正式環境請更換）

#### 其他設定
- [ ] `FRONTEND_URL` = `https://connector-theta.vercel.app`
- [ ] `JWT_SECRET`
- [ ] `REDIS_URL`
- [ ] Shopline 相關環境變數（如果使用）

### Vercel（前端）

#### 基礎設定
- [ ] `NEXT_PUBLIC_BACKEND_URL` = `https://connector-o5hx.onrender.com`
- [ ] Shopline 相關環境變數（如果使用）

### Next Engine Developer 後台

- [ ] Callback URL = `https://connector-o5hx.onrender.com/api/auth/next-engine/callback`
- [ ] Client ID = `v6MP5RkVZD9sEo`
- [ ] Client Secret = `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF`

---

## ⚠️ 常見問題

### Q1: 點擊「前往 Next Engine 授權」出現 500 錯誤？

**A:** 檢查：
- Render 環境變數 `NEXTENGINE_CLIENT_ID`、`NEXTENGINE_CLIENT_SECRET`、`NEXTENGINE_REDIRECT_URI` 是否已設定
- Render 服務是否已重新部署（環境變數變更後需要重新部署）
- 查看 Render Logs 確認錯誤訊息

### Q2: 授權後無法返回？

**A:** 檢查：
- Next Engine Developer 後台的 Callback URL 是否正確設定
- Callback URL 必須與 Render 環境變數 `NEXTENGINE_REDIRECT_URI` 完全一致
- URL 必須是 HTTPS

### Q3: 環境變數設定後仍無法使用？

**A:** 確認：
- Render 服務已重新部署（環境變數變更後需要重新部署）
- 環境變數名稱拼寫正確（注意大小寫）
- 環境變數值沒有多餘的空格或引號

---

## 📝 部署後測試步驟

1. ✅ 後端健康檢查通過
2. ✅ 前端頁面正常載入
3. ✅ Next Engine OAuth 授權流程完整測試
4. ✅ Connection 建立成功
5. ✅ Connection Items 同步成功
6. ✅ 訂單摘要 API 測試成功

---

## 🔗 相關文件

- 環境變數設定：`docs/reference/guides/ENV_SETUP_GUIDE.md`
- Next Engine 平台規格：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
- 正式環境資訊：`docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

