# 環境變數設定引導

本指南將依序引導您完成 Render 和 Vercel 的環境變數設定。

## 📋 設定順序

1. **Render（後端）** - 先設定，取得後端 URL
2. **Vercel（前端）** - 需要後端 URL
3. **SHOPLINE App 設定** - 需要前端和後端 URL

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
變數名稱：APP_TYPE
變數值：public
```

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

#### 重要：Redirect URI（使用您的 Render URL）
```
變數名稱：SHOPLINE_REDIRECT_URI
變數值：https://connector.onrender.com/api/auth/shopline/callback
```
⚠️ **注意**：請將 `connector.onrender.com` 替換為您實際的 Render URL（例如：`https://YOUR-APP.onrender.com/api/auth/shopline/callback`）

#### 前端 URL（暫時先填，稍後更新）
```
變數名稱：FRONTEND_URL
變數值：https://connector.vercel.app
```
⚠️ **注意**：這會在設定 Vercel 後更新為實際的前端 URL

#### JWT 設定
```
變數名稱：JWT_SECRET
變數值：請使用強隨機字串（至少 32 字元，例如：your_super_secret_jwt_key_change_in_production_2025）
```
⚠️ **重要**：請更換為您的專屬 JWT Secret

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

#### 後端 URL（使用第一步記錄的 Render URL）
```
變數名稱：NEXT_PUBLIC_BACKEND_URL
變數值：https://connector.onrender.com
```
⚠️ **注意**：請將 `connector.onrender.com` 替換為您實際的 Render URL

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

- **後端 URL（Render）**：`https://________________________`
- **前端 URL（Vercel）**：`https://________________________`

### 2. 更新 SHOPLINE App 設定

1. 前往 [SHOPLINE Console](https://console.shopline.com/)
2. 前往 **「應用程式管理」**
3. 選擇您的 App（根據 `APP_TYPE` 選擇對應的 App）
4. 進入 **「基本資訊設定」**

#### App URL
```
https://YOUR-RENDER-URL.onrender.com/api/auth/shopline/install
```

#### Callback URL
```
https://YOUR-RENDER-URL.onrender.com/api/auth/shopline/callback
```

#### Webhook URL（如果使用）
```
https://YOUR-RENDER-URL.onrender.com/webhook/shopline
```

### 3. 儲存設定

確認所有 URL 都已更新並儲存。

---

## 第五步：驗證部署

### 1. 檢查後端健康狀態

打開瀏覽器訪問：
```
https://YOUR-RENDER-URL.onrender.com/api/health
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
https://YOUR-VERCEL-URL.vercel.app
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
- `PORT` 是否設定為 `10000`
- `NODE_ENV` 是否設定為 `production`

### Q2: 前端無法連接後端？
**A:** 檢查：
- `NEXT_PUBLIC_BACKEND_URL` 是否正確設定為 Render URL
- Render 服務是否正常運行
- CORS 設定是否正確

### Q3: OAuth 回調失敗？
**A:** 檢查：
- Render 的 `SHOPLINE_REDIRECT_URI` 是否正確
- SHOPLINE App 設定中的 Callback URL 是否已更新

---

## 📞 支援

如有問題，請參考：
- [Render 文件](https://render.com/docs)
- [Vercel 文件](https://vercel.com/docs)
- 專案 README.md

