# 環境變數設定引導

本指南將依序引導您完成 Render 和 Vercel 的環境變數設定。

> 📋 **正式環境資訊**：正式部署 URL 和服務資訊請參考 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

## 📋 設定順序

1. **Render（後端）** - 先設定，取得後端 URL
2. **Vercel（前端）** - 需要後端 URL
3. **SHOPLINE App 設定** - 需要前端和後端 URL

## 🌐 正式部署 URL（參考）

**正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

- **前端（Vercel）**: `https://connector-theta.vercel.app/`
- **後端（Render）**: `https://connector-o5hx.onrender.com/`
- **資料庫 Console**: [Neon Console](https://console.neon.tech/app/projects/restless-brook-68238368?branchId=br-aged-block-a1vnbyql&database=neondb)

---

## 第一步：Render（後端）環境變數設定

### 1. 取得 Render 服務 URL

1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 進入 **connector** 專案
3. 在頂部找到服務 URL（例如：`https://connector.onrender.com`）
4. **記錄這個 URL**：`https://________________________`

### 2. 設定環境變數

在 Render Dashboard 中：
1. 進入 **connector** 專案
2. 點擊左側選單 **"Environment"**
3. 點擊 **"Add Environment Variable"**
4. 依序新增以下環境變數：

#### 資料庫設定
```
變數名稱：DATABASE_URL
變數值：postgresql://neondb_owner:npg_dKPFQw8M7vXg@ep-morning-morning-a1mx5s0x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### 伺服器設定
```
變數名稱：PORT
變數值：10000
```

```
變數名稱：NODE_ENV
變數值：production
```

#### Shopline API 設定
```
變數名稱：SHOPLINE_CUSTOM_APP_KEY
變數值：4c951e966557c8374d9a61753dfe3c52441aba3b
```

```
變數名稱：SHOPLINE_CUSTOM_APP_SECRET
變數值：dd46269d6920f49b07e810862d3093062b0fb858
```

```
變數名稱：SHOPLINE_PUBLIC_APP_KEY
變數值：c6e5110e6e06b928920af61b322e1db0ca446c16
```

```
變數名稱：SHOPLINE_PUBLIC_APP_SECRET
變數值：62589f36ba6e496ae37b00fc75c434a5fece4fb9
```

#### Next Engine 平台設定
> 參考：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`  
> 📋 **完整部署檢查清單**：見 `docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`

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

> ⚠️ **重要**：
> - `NEXTENGINE_REDIRECT_URI` 必須使用 Render 提供的 URL（不是 ngrok）
> - 部署完成後，必須到 Next Engine Developer 後台設定相同的 Callback URL
> - 詳細步驟見 `docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`

#### 重要：Redirect URI（使用您的 Render URL）
```
變數名稱：SHOPLINE_REDIRECT_URI
變數值：https://connector-o5hx.onrender.com/api/auth/shopline/callback
```
⚠️ **注意**：正式環境使用 `https://connector-o5hx.onrender.com`，開發環境請使用實際的 Render URL

#### 前端 URL
```
變數名稱：FRONTEND_URL
變數值：https://connector-theta.vercel.app
```
⚠️ **注意**：正式環境使用 `https://connector-theta.vercel.app`，開發環境請使用實際的 Vercel URL

#### JWT 設定
```
變數名稱：JWT_SECRET
變數值：7c6c4d2e6393a206f3e758949ff3cd822998bd6afb583ea90c8c538a368cab4b0638f3c0d76830a5b2ccef69060c766ac50f1f41db2b6f75b5e35c5884e796a4
```

**JWT_SECRET 說明：**
- **用途**：用於簽署和驗證 JWT token，確保 token 的安全性和完整性
- **上方的值**：這是一個已生成的 128 字元隨機密鑰，可以直接使用
- **安全性**：請妥善保管此密鑰，不要公開分享或 commit 到 Git
- **如果需要重新生成**：可以使用以下命令：
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

#### Redis 設定（狀態管理快取）

**Render 服務（正式環境）**：
```
變數名稱：REDIS_URL
變數值：redis://red-d406i56uk2gs739qn8ig:6379
```

**地端開發環境**：
```
變數名稱：REDIS_URL
變數值：rediss://red-d406i56uk2gs739qn8ig:IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC@singapore-keyvalue.render.com:6379
```

**Redis 設定說明：**
- **用途**：用於 Token 快取、Session 管理、狀態同步（Phase 1 狀態管理重構使用）
- **服務提供者**：Render Redis (Valkey)
- **Internal URL**（Render 服務內部使用）：
  - 格式：`redis://red-{id}:6379`
  - 不需要密碼
  - 只能在 Render 服務內部使用
- **External URL**（地端開發環境使用）：
  - 格式：`rediss://red-{id}:{password}@singapore-keyvalue.render.com:6379`
  - 需要密碼認證
  - 支援 TLS（`rediss://` 表示 TLS）
  - 需要設定 IP 白名單（見下方說明）
- **取得方式**：
  1. 前往 [Render Dashboard](https://dashboard.render.com/)
  2. 進入 **shopline-middleware-redis** 服務
  3. 在 **"Info"** 頁面找到 **"External Key Value URL"** 或 **"Valkey CLI Command"**
- **地端設定步驟**：
  1. 取得地端公網 IP（使用 `curl https://api.ipify.org`）
  2. 在 Render Dashboard → Redis 服務 → Networking → Inbound IP Rules 新增 IP 白名單
  3. 複製 External URL 到地端 `.env` 檔案
  4. 詳細步驟見 `docs/reference/guides/REDIS_LOCAL_SETUP.md`

### 3. 儲存並重新部署

1. 確認所有環境變數都已新增
2. Render 會自動重新部署
3. 等待部署完成
4. **記錄後端 URL**：`https://________________________`

---

## 第二步：Vercel（前端）環境變數設定

### 1. 取得 Vercel 服務 URL（如果已部署）

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 進入 **connector** 專案
3. 在 **"Domains"** 中找到部署 URL（例如：`https://connector.vercel.app`）
4. **記錄這個 URL**：`https://________________________`

⚠️ **如果還沒有部署**：先完成環境變數設定，然後部署，部署後取得 URL

### 2. 設定環境變數

在 Vercel Dashboard 中：
1. 進入 **connector** 專案
2. 點擊 **"Settings"** → **"Environment Variables"**
3. 點擊 **"Add New"**
4. 依序新增以下環境變數：

#### Shopline App 設定
```
變數名稱：NEXT_PUBLIC_APP_TYPE
變數值：public
```

```
變數名稱：NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_KEY
變數值：4c951e966557c8374d9a61753dfe3c52441aba3b
```

```
變數名稱：NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_SECRET
變數值：dd46269d6920f49b07e810862d3093062b0fb858
```

```
變數名稱：NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_KEY
變數值：c6e5110e6e06b928920af61b322e1db0ca446c16
```

```
變數名稱：NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_SECRET
變數值：62589f36ba6e496ae37b00fc75c434a5fece4fb9
```

#### 後端 URL
```
變數名稱：NEXT_PUBLIC_BACKEND_URL
變數值：https://connector-o5hx.onrender.com
```
⚠️ **注意**：正式環境使用 `https://connector-o5hx.onrender.com`，開發環境請使用實際的 Render URL

### 3. 部署（或重新部署）

1. 如果還沒部署：點擊 **"Deploy"**
2. 如果已部署：點擊 **"Deployments"** → **"Redeploy"**
3. 等待部署完成
4. **記錄前端 URL**：`https://________________________`

---

## 第三步：更新環境變數（互相引用）

### 1. 更新 Render 的 FRONTEND_URL

1. 回到 Render Dashboard → **connector** 專案
2. 進入 **"Environment"**
3. 找到 `FRONTEND_URL` 環境變數
4. 點擊編輯，更新為 Vercel 實際 URL（從第二步記錄）
5. 儲存後 Render 會自動重新部署

### 2. 確認所有設定

#### Render 環境變數檢查清單
- [ ] DATABASE_URL
- [ ] PORT (10000)
- [ ] NODE_ENV (production)
- [ ] APP_TYPE (public)
- [ ] SHOPLINE_CUSTOM_APP_KEY
- [ ] SHOPLINE_CUSTOM_APP_SECRET
- [ ] SHOPLINE_PUBLIC_APP_KEY
- [ ] SHOPLINE_PUBLIC_APP_SECRET
- [ ] SHOPLINE_REDIRECT_URI (使用 Render URL)
- [ ] FRONTEND_URL (使用 Vercel URL)
- [ ] JWT_SECRET
- [ ] REDIS_URL (Render Internal Redis)

#### Vercel 環境變數檢查清單
- [ ] NEXT_PUBLIC_APP_TYPE (public)
- [ ] NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_KEY
- [ ] NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_SECRET
- [ ] NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_KEY
- [ ] NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_SECRET
- [ ] NEXT_PUBLIC_BACKEND_URL (使用 Render URL)

---

## 第四步：更新 SHOPLINE App 設定

### 1. 取得所有 URL

**正式環境 URL**（見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`）：
- **後端 URL（Render）**：`https://connector-o5hx.onrender.com/`
- **前端 URL（Vercel）**：`https://connector-theta.vercel.app/`

### 2. 更新 SHOPLINE App 設定

1. 前往 [SHOPLINE Console](https://console.shopline.com/)
2. 前往 **「應用程式管理」**
3. 選擇您的 App（根據 `APP_TYPE` 選擇對應的 App）
4. 進入 **「基本資訊設定」**

#### App URL
```
https://connector-o5hx.onrender.com/api/auth/shopline/install
```

#### Callback URL
```
https://connector-o5hx.onrender.com/api/auth/shopline/callback
```

#### Webhook URL（如果使用）
```
https://connector-o5hx.onrender.com/webhook/shopline
```

### 3. 儲存設定

確認所有 URL 都已更新並儲存。

---

## 第五步：驗證部署

### 1. 檢查後端健康狀態

打開瀏覽器訪問：
```
https://connector-o5hx.onrender.com/api/health
```

應該看到：
```json
{
  "success": true,
  "message": "Service is running",
  "timestamp": "..."
}
```

### 2. 檢查前端

打開瀏覽器訪問：
```
https://connector-theta.vercel.app/
```

應該可以看到前端頁面。

### 3. 測試 OAuth 流程

1. 在前端頁面點擊「新增商店授權」
2. 輸入商店 Handle
3. 確認可以正常重導向到 SHOPLINE 授權頁面

---

## ⚠️ 常見問題

### Q1: Render 服務無法啟動？
**A:** 檢查：
- `DATABASE_URL` 是否正確
- `