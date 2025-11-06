# 正式環境資訊

> 記錄正式部署環境的實際 URL、服務狀態、測試商店資訊等重要資訊

---

## 🌐 正式部署 URL

### 前端（Vercel）
- **URL**: `https://connector-theta.vercel.app/`
- **部署平台**: Vercel
- **專案名稱**: connector
- **Root Directory**: `frontend/`
- **Dashboard**: [Vercel Dashboard](https://vercel.com/dashboard)

### 後端（Render）
- **URL**: `https://connector-o5hx.onrender.com/`
- **部署平台**: Render
- **專案名稱**: connector
- **Root Directory**: `backend/`
- **Dashboard**: [Render Dashboard](https://dashboard.render.com/)

### Redis（Render Internal）
- **Internal URL**: `redis://red-d406i56uk2gs739qn8ig:6379`
  - **用途**: Render 服務內部使用
  - **說明**: 只能在 Render 服務內部使用，不需要密碼
- **External URL**: `rediss://red-d406i56uk2gs739qn8ig:IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC@singapore-keyvalue.render.com:6379`
  - **用途**: 地端開發環境使用（需設定 IP 白名單）
  - **說明**: 支援 TLS 連線，需要密碼認證
  - **IP 白名單**: 需在 Render Dashboard → Redis 服務 → Networking → Inbound IP Rules 設定
- **服務類型**: Render Redis (Valkey)
- **環境變數**: `REDIS_URL`（Internal 或 External，視環境而定）
- **地端設定指南**: 見 `docs/reference/guides/REDIS_LOCAL_SETUP.md`

### 資料庫（Neon PostgreSQL）
- **資料庫名稱**: `neondb`
- **專案 ID**: `restless-brook-68238368`
- **Branch ID**: `br-aged-block-a1vnbyql`
- **Console URL**: https://console.neon.tech/app/projects/restless-brook-68238368?branchId=br-aged-block-a1vnbyql&database=neondb
- **連線字串**: `DATABASE_URL`（見環境變數設定）

---

## 🔑 Shopline API 憑證

**重要說明**：
- ✅ **這是公開給外部使用的 App**，憑證會公開在文件與環境變數中，屬於正常情況
- ✅ 憑證會在前端程式碼中暴露（`NEXT_PUBLIC_*` 環境變數），這是 OAuth 2.0 公開 App 的標準做法
- ✅ 安全性由 App Secret 和 OAuth 流程保證，不依賴憑證保密

### Public App（主要使用）
- **App Key**: `c6e5110e6e06b928920af61b322e1db0ca446c16`
- **App Secret**: `62589f36ba6e496ae37b00fc75c434a5fece4fb9`
- **用途**: 支援多個商店（handle）串接同一個 App

### Custom App（測試用）
- **App Key**: `4c951e966557c8374d9a61753dfe3c52441aba3b`
- **App Secret**: `dd46269d6920f49b07e810862d3093062b0fb858`
- **用途**: 單一商店測試用

**憑證取得方式**：
- 見 [SHOPLINE Console](https://console.shopline.com/)
- 前往「應用程式管理」→ 選擇對應的 App → 查看「基本資訊設定」

---

## 🧪 測試商店資訊

**測試階段說明**：目前所有商店都是我們自己測試用的，沒有真實用戶。

### 測試商店取得方式

**重要說明**：
- ⚠️ **測試階段**：目前所有商店都是我們自己測試用的，沒有真實用戶
- ⚠️ **正式環境**：上線後才會有真實用戶的商店
- ✅ **測試商店資訊**：可以從資料庫查詢取得，用於開發和測試

**從資料庫查詢**：
```sql
-- 查詢所有已授權的商店
SELECT 
  id,
  shopline_id,
  handle,
  name,
  domain,
  is_active,
  created_at
FROM stores
WHERE is_active = true
ORDER BY created_at DESC;
```

**測試商店資訊**（實際值需從資料庫查詢）：
- **Handle**: `paykepoc`（或其他測試商店）
- **商店 ID**: 從資料庫查詢取得
- **狀態**: 已授權並啟用

**使用方式**：
- 開發階段：從資料庫查詢測試商店資訊進行開發和測試
- 正式環境：商店資訊會由真實用戶授權產生

---

## 📋 環境變數設定

### Render（後端）環境變數

**已設定**：
- `DATABASE_URL` - Neon PostgreSQL（見上方資料庫資訊）
- `PORT` - 10000
- `NODE_ENV` - production
- `APP_TYPE` - public
- `SHOPLINE_*` - Shopline API 憑證（見下方）
- `JWT_SECRET` - JWT 簽名密鑰
- `SHOPLINE_REDIRECT_URI` - `https://connector-o5hx.onrender.com/api/auth/shopline/callback`
- `FRONTEND_URL` - `https://connector-theta.vercel.app`
- `REDIS_URL` - `redis://red-d406i56uk2gs739qn8ig:6379`（Render Internal Redis）

**詳細設定**：見 `docs/reference/guides/ENV_SETUP_GUIDE.md`

### Vercel（前端）環境變數

**已設定**：
- `NEXT_PUBLIC_APP_TYPE` - public
- `NEXT_PUBLIC_SHOPLINE_*` - Shopline API 憑證（見下方）
- `NEXT_PUBLIC_BACKEND_URL` - `https://connector-o5hx.onrender.com`

**詳細設定**：見 `docs/reference/guides/ENV_SETUP_GUIDE.md`

---

## 🔗 相關端點

### 後端 API 端點（Render）

**Base URL**: `https://connector-o5hx.onrender.com`

**基礎端點**：
- **健康檢查**: `GET https://connector-o5hx.onrender.com/api/health`
- **商店列表**: `GET https://connector-o5hx.onrender.com/api/stores`
- **商店資訊**: `GET https://connector-o5hx.onrender.com/api/stores/:shopId`

**OAuth 端點**：
- **安裝請求**: `GET https://connector-o5hx.onrender.com/api/auth/shopline/install`
- **授權回調**: `GET https://connector-o5hx.onrender.com/api/auth/shopline/callback`

**Webhook 端點**：
- **接收 Webhook**: `POST https://connector-o5hx.onrender.com/webhook/shopline`

**Admin API 端點**：
- **Store Info**: `GET https://connector-o5hx.onrender.com/api/stores/:handle/info`
- **Products**: `GET https://connector-o5hx.onrender.com/api/stores/:handle/products`
- **Orders**: `GET https://connector-o5hx.onrender.com/api/stores/:handle/orders`
- **Locations**: `GET https://connector-o5hx.onrender.com/api/stores/:handle/locations`

### 前端頁面（Vercel）

**Base URL**: `https://connector-theta.vercel.app`

- **首頁**: `https://connector-theta.vercel.app/` - 商店列表與授權
- **Admin API 測試**: `https://connector-theta.vercel.app/admin-api-test` - Admin API 測試介面
- **Webhook 測試**: `https://connector-theta.vercel.app/webhook-test` - Webhook 訂閱與事件查看

---

## 📝 更新記錄

| 日期 | 更新內容 | 更新者 |
|------|---------|--------|
| 2025-11-05 | 建立文件，記錄正式部署 URL 和資料庫資訊 | System |

---

## 🔗 相關文件

- **環境設定指南**: `docs/reference/guides/ENV_SETUP_GUIDE.md`
- **部署指南**: `docs/reference/guides/DEPLOYMENT_GUIDE.md`
- **開發配置**: `docs/reference/guides/DEVELOPMENT_CONFIG.md`

---

**最後更新**: 2025-11-05

