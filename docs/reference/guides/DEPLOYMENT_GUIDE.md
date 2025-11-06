# 部署指南

本指南說明如何將 connector 專案部署到 Vercel（前端）和 Render（後端）。

> 📋 **正式環境資訊**：正式部署 URL 和服務資訊請參考 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

## 📋 專案架構

- **前端**：Next.js 應用（部署到 Vercel，Root Directory: `frontend/`)
- **後端**：Fastify API 服務（部署到 Render，Root Directory: `backend/`)

> 📋 **型別定義**：前端和後端各自獨立維護型別定義，不共享。  
> 詳細說明請參考：[專案結構與部署架構](./PROJECT_STRUCTURE.md)

## 🚀 部署步驟

### 第一部分：Vercel 部署（前端）

#### 1. 登入 Vercel

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 使用 GitHub 帳號登入
3. 授權 Vercel 存取 GitHub repository

#### 2. 匯入專案

1. 點擊 **"Add New..."** → **"Project"**
2. 選擇 GitHub repository：`morris-shopline/connector`
3. 在 **"Root Directory"** 設定中，選擇 `frontend`
4. 專案名稱：**`connector`**

#### 3. 設定環境變數

在 Vercel 專案設定中，前往 **Settings** → **Environment Variables**，新增以下變數：

```
NEXT_PUBLIC_APP_TYPE=public
NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_KEY=c6e5110e6e06b928920af61b322e1db0ca446c16
NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_SECRET=62589f36ba6e496ae37b00fc75c434a5fece4fb9
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com
NEXT_PUBLIC_NGROK_URL=你的_ngrok_url（僅本地開發需要）
```

#### 4. 設定建置設定

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`（預設）
- **Output Directory**: `.next`（預設）
- **Install Command**: `npm install`

#### 5. 部署

1. 點擊 **"Deploy"**
2. 等待部署完成
3. 取得前端 URL（正式環境：`https://connector-theta.vercel.app/`）

---

### 第二部分：Render 部署（後端）

#### 1. 登入 Render

1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 使用 GitHub 帳號登入
3. 授權 Render 存取 GitHub repository

#### 2. 建立新的 Web Service

1. 點擊 **"New +"** → **"Web Service"**
2. 選擇 GitHub repository：`morris-shopline/connector`
3. 專案名稱：**`connector`**

#### 3. 設定服務配置

- **Name**: `connector`
- **Environment**: `Node`
- **Region**: 選擇接近你的區域（例如：Singapore）
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 4. 設定環境變數

在 Render 專案設定中，前往 **Environment**，新增以下變數：

```bash
# 資料庫
DATABASE_URL=postgresql://neondb_owner:npg_dKPFQw8M7vXg@ep-morning-morning-a1mx5s0x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# 伺服器設定
PORT=10000
NODE_ENV=production

# Shopline API 設定
APP_TYPE=public
SHOPLINE_CUSTOM_APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
SHOPLINE_CUSTOM_APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
SHOPLINE_PUBLIC_APP_KEY=c6e5110e6e06b928920af61b322e1db0ca446c16
SHOPLINE_PUBLIC_APP_SECRET=62589f36ba6e496ae37b00fc75c434a5fece4fb9

# 重要：使用 Render 提供的 URL（正式環境）
SHOPLINE_REDIRECT_URI=https://connector-o5hx.onrender.com/api/auth/shopline/callback

# 前端 URL（用於 OAuth 回調重導向）（正式環境）
FRONTEND_URL=https://connector-theta.vercel.app

# JWT 設定
JWT_SECRET=你的_jwt_secret_請在生產環境更換

# ngrok（僅本地開發需要，生產環境不需要）
# NGROK_URL=
```

**⚠️ 重要注意事項：**
- `SHOPLINE_REDIRECT_URI` 必須使用 Render 提供的 URL（正式環境：`https://connector-o5hx.onrender.com/api/auth/shopline/callback`）
- 部署完成後，需要到 SHOPLINE App 設定中更新 Callback URL
- **正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

#### 5. 部署

1. 點擊 **"Create Web Service"**
2. 等待首次部署完成（約 5-10 分鐘）
3. 取得後端 URL（正式環境：`https://connector-o5hx.onrender.com/`）

---

## 🔧 部署後設定

### 1. 更新 SHOPLINE App 設定

部署完成後，需要到 [SHOPLINE Console](https://console.shopline.com/) 更新 App 設定：

#### 基本資訊設定（Basic Information Settings）
- **App URL**: `https://connector-o5hx.onrender.com/api/auth/shopline/install`
- **Callback URL**: `https://connector-o5hx.onrender.com/api/auth/shopline/callback`

#### Webhook 設定
- **Webhook URL**: `https://connector-o5hx.onrender.com/webhook/shopline`

### 2. 更新前端環境變數

回到 Vercel，更新 `NEXT_PUBLIC_BACKEND_URL`：
```
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com
```

### 3. 驗證部署

1. 檢查後端健康狀態：
   ```
   curl https://connector-o5hx.onrender.com/api/health
   ```

2. 檢查前端是否正常載入：
   ```
   https://connector-theta.vercel.app/
   ```

**正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

---

## 🔐 安全建議

### 生產環境環境變數

⚠️ **重要：** 以下敏感資訊請在生產環境中更新：

1. **JWT_SECRET**：使用強隨機字串（至少 32 字元）
2. **SHOPLINE_APP_SECRET**：確認使用正確的 secret
3. **DATABASE_URL**：確認資料庫連線字串的安全性

### 環境變數保護

- ✅ 所有 `.env` 檔案已加入 `.gitignore`
- ✅ 敏感資訊不應 commit 到 Git
- ✅ 使用各平台的環境變數管理功能

---

## 📝 後續維護

### 自動部署

- **Vercel**：每次 push 到 `main` 分支會自動部署
- **Render**：每次 push 到 `main` 分支會自動部署

### 手動部署

如需手動觸發部署：
- **Vercel**：Dashboard → Deployments → Redeploy
- **Render**：Dashboard → Manual Deploy

### 監控

- **Vercel**：Dashboard 提供即時監控和日誌
- **Render**：Dashboard 提供服務狀態和日誌

---

## 🐛 常見問題

### Q1: 後端部署後出現 404？

**A:** 確認 Render 的 `Start Command` 設定為 `npm start`（而非 `npm run dev`）

### Q2: 前端無法連接到後端？

**A:** 檢查：
1. `NEXT_PUBLIC_BACKEND_URL` 是否正確設定
2. Render 服務是否正常運行
3. CORS 設定是否正確

### Q3: OAuth 回調失敗？

**A:** 確認：
1. `SHOPLINE_REDIRECT_URI` 是否正確設定為 Render URL
2. SHOPLINE App 設定中的 Callback URL 是否已更新

### Q4: 環境變數未生效？

**A:** 
- Vercel：需要重新部署才能載入新的環境變數
- Render：環境變數更新後會自動重新部署


---

## 📞 支援

如有問題，請參考：
- [Vercel 文件](https://vercel.com/docs)
- [Render 文件](https://render.com/docs)
- 專案 README.md

## 📋 後續規劃

> 📋 **部署策略分析**: 關於未來遷移到大型 CSP（如 AWS）的策略與複雜度評估，請參考 [部署策略分析](./DEPLOYMENT_STRATEGY.md)

