# Shopline API 整合專案

一個現代化的 Shopline API 整合應用程式，支援 OAuth 2.0 授權、Webhook 處理和多商店管理。

## 📊 專案狀態

**當前版本**: v0.1.0 - Auth 完成  
**最後更新**: 2025-11-03  
**狀態**: ✅ OAuth 授權流程已完整實作並測試通過

> 📋 詳細的專案狀態請參考 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

### 已完成功能

- ✅ **OAuth 2.0 授權流程**
  - 安裝請求驗證
  - 授權碼交換 Access Token
  - JWT Token 解析
  - 自動重導向回前端
  
- ✅ **資料庫整合**
  - Neon Serverless PostgreSQL
  - Prisma ORM
  - 商店資訊儲存與管理
  
- ✅ **安全機制**
  - HMAC-SHA256 簽名驗證
  - 時間戳驗證（5分鐘容差）
  - HTTPS 支援（透過 ngrok）
  - Iframe 嵌入支援

- ✅ **前端介面**
  - 商店列表展示
  - 授權對話框
  - 多商店管理準備

### 待開發功能

- ⏳ Webhook 事件處理
- ⏳ Shopline API 呼叫
- ⏳ Token 自動刷新
- ⏳ 使用者認證系統

## 🛠 技術棧

**後端**
- Fastify - 高效能 Node.js 框架
- TypeScript - 型別安全
- Prisma - 現代 ORM
- Neon - Serverless PostgreSQL

**前端**
- Next.js 14 - React 框架
- SWR - 資料獲取
- Tailwind CSS - 樣式框架

**開發工具**
- ngrok - 本地 HTTPS 隧道
- Vite - 前端建置工具

## 📁 專案結構

```
├── backend/              # 後端服務
│   ├── src/
│   │   ├── index.ts     # Fastify 應用程式入口
│   │   ├── routes/      # API 路由
│   │   ├── services/    # 業務邏輯
│   │   └── utils/       # 工具函數
│   ├── prisma/
│   │   └── schema.prisma # 資料庫 schema
│   └── env.example      # 環境變數範例
│
├── frontend/            # 前端應用
│   ├── pages/           # Next.js 頁面
│   ├── components/      # React 元件
│   ├── hooks/           # 自訂 Hooks
│   └── lib/             # 工具庫
│
├── shared/              # 共享資源
│   └── types.ts         # TypeScript 型別定義
│
├── docs/                # 文件
│   ├── ARCHITECTURE.md  # 系統架構
│   ├── LESSONS_LEARNED.md # 重要學習點
│   └── COMPLIANCE_CHECK.md # 合規性檢查
│
└── scripts/             # 工具腳本
    └── start-dev.sh     # 開發環境啟動腳本
```

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- npm 或 yarn
- ngrok (用於本地 HTTPS)

### 安裝

```bash
# 1. 複製專案
git clone https://github.com/morris-shopline/connector.git
cd connector

# 2. 安裝後端依賴
cd backend && npm install

# 3. 安裝前端依賴
cd ../frontend && npm install

# 4. 回到專案根目錄
cd ..
```

### 設定環境變數

```bash
# 後端環境變數
cd backend
cp env.example .env
# 編輯 .env 填入 Neon 資料庫連線字串

# 前端環境變數 (可選)
cd ../frontend
cp env.example .env.local
# 如需自訂 API URL，編輯 .env.local
```

### 初始化資料庫

```bash
cd backend
npx prisma db push
```

### 啟動開發環境

**選項 1: 一鍵啟動** (推薦)

```bash
./scripts/start-dev.sh
```

**選項 2: 手動啟動**

```bash
# 終端 1: 啟動 ngrok
ngrok http 3001

# 終端 2: 啟動後端
cd backend && npm run dev

# 終端 3: 啟動前端
cd frontend && npm run dev
```

### 配置 Shopline 應用

1. 登入 [Shopline Console](https://console.shoplineapp.com)
2. 前往「應用程式管理」
3. 設定以下 URL（使用 ngrok URL）：
   - **App URL**: `https://YOUR_NGROK_URL/api/auth/shopline/install`
   - **App Callback URL**: `https://YOUR_NGROK_URL/api/auth/shopline/callback`
   - **Webhook URL**: `https://YOUR_NGROK_URL/webhook/shopline`

## 🧪 測試授權流程

1. 開啟前端頁面: http://localhost:3000
2. 點擊「新增商店授權」
3. 輸入商店 Handle (例如: `paykepoc`)
4. 點擊「確認授權」
5. 在 Shopline 授權頁面完成授權
6. 自動重導回前端，商店資料已儲存

## 📚 文件

- [專案狀態](PROJECT_STATUS.md) - 詳細的專案狀態與里程碑
- [系統架構](docs/ARCHITECTURE.md) - 完整的系統設計說明
- [重要學習點](docs/LESSONS_LEARNED.md) - 開發過程中的重要發現
- [合規性檢查](docs/COMPLIANCE_CHECK.md) - Shopline API 合規性評估
- [部署指南](docs/DEPLOYMENT_GUIDE.md) - Vercel（前端）和 Render（後端）部署說明
- [測試資訊](TESTING_INFO.md) - 測試流程與注意事項
- [工具腳本](docs/SCRIPTS.md) - 自動化腳本說明
- [Shopline API 文檔](SHOPLINE_API_DOCS.md) - API 參考文檔
- [App Bridge 指南](docs/APP_BRIDGE.md) - App Bridge 開發指南
- [Webhook 使用指南](docs/WEBHOOK_GUIDE.md) - SHOPLINE Webhook 完整實作指南
- [Webhook Topics 列表](docs/SHOPLINE_WEBHOOK_TOPICS.md) - 所有可用的 Webhook Topics 及版本對應
- [Webhook 測試介面設計](docs/WEBHOOK_TEST_UI_DESIGN.md) - 前端測試介面架構規劃

## 🔑 配置說明

### 當前測試配置

```
App Key: 4c951e966557c8374d9a61753dfe3c52441aba3b
App Secret: dd46269d6920f49b07e810862d3093062b0fb858
商店 Handle: paykepoc
資料庫: Neon PostgreSQL
```

### 服務端點

- 後端: http://localhost:3001
- 前端: http://localhost:3000
- ngrok 管理介面: http://localhost:4040

## 🔒 安全考量

- 所有 API 請求都需要 HMAC-SHA256 簽名驗證
- 時間戳檢查（5分鐘容差）防止重放攻擊
- 使用 `crypto.timingSafeEqual()` 防止時序攻擊
- 支援 HTTPS（透過 ngrok）
- Token 資訊以 JWT 形式安全儲存

## 📈 後續規劃

1. **Webhook 處理** - 實現訂單、商品等事件處理
2. **API 整合** - 實作 Shopline API 呼叫封裝
3. **Token 管理** - 自動刷新過期 Token
4. **多租戶** - 完整的使用者與商店管理
5. **生產部署** - 容器化與 CI/CD

## 🤝 貢獻

此專案為內部開發專案，如需貢獻請聯繫專案維護者。

## 📄 授權

版權所有 © 2025

---

**最後更新**: 2025-11-03  
**維護者**: Mo Studio
