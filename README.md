# Shopline API 整合專案

一個現代化的 Shopline API 整合應用程式，支援 OAuth 2.0 授權、Webhook 處理和多商店管理。

---

## 📊 專案狀態

**當前版本**: v0.1.0 - 基礎功能完成  
**狀態**: ✅ 基礎架構與 OAuth 授權流程已完成

> 📋 **詳細狀態**：[PROJECT_STATUS.md](./PROJECT_STATUS.md)  
> 🚨 **Agent 必讀**：[docs/00-AGENT-ONBOARDING.md](./docs/00-AGENT-ONBOARDING.md)

---

## 🚀 快速開始

### 前置需求
- Node.js 18+
- npm 或 yarn
- ngrok（本地 HTTPS）

### 安裝與啟動

```bash
# 1. 安裝依賴
cd backend && npm install
cd ../frontend && npm install

# 2. 設定環境變數（見 docs/reference/guides/ENV_SETUP_GUIDE.md）
# 3. 初始化資料庫
cd backend && npx prisma db push

# 4. 啟動開發環境
./scripts/start-dev.sh
```

**詳細安裝步驟**：見 [環境設定指南](docs/reference/guides/ENV_SETUP_GUIDE.md)

---

## 📚 關鍵文件

### 🚨 Agent 必讀
- **[Agent 協作方法論](docs/00-AGENT-ONBOARDING.md)** - 新 Agent 必讀 ⭐

### 專案資訊
- **[專案狀態](PROJECT_STATUS.md)** - 當前狀態摘要
- **[專案願景](docs/memory/vision.md)** - 專案願景與發展方向
- **[專案 Roadmap](docs/memory/roadmap.md)** - 長期發展規劃 ⭐

### 任務管理
- **[Backlog 索引](docs/backlog/index.md)** - 所有任務總覽
- **[當前 Run](docs/context/current-run.md)** - 當前正在進行的 Run

### 開發指南
- **[環境設定](docs/reference/guides/ENV_SETUP_GUIDE.md)** - 環境變數設定
- **[開發配置](docs/reference/guides/DEVELOPMENT_CONFIG.md)** - 測試配置、服務端點、安全機制
- **[部署指南](docs/reference/guides/DEPLOYMENT_GUIDE.md)** - 部署說明
- **[系統架構](docs/memory/architecture/current.md)** - 完整的系統設計

### API 與整合
- **[Shopline API 文檔](docs/reference/platform-apis/shopline-api-docs.md)**
- **[Webhook 指南](docs/reference/guides/WEBHOOK_GUIDE.md)**

**完整文件索引**：見 [docs/README.md](docs/README.md)

---

## 🛠 技術棧

**後端**: Fastify + TypeScript + Prisma + Neon PostgreSQL  
**前端**: Next.js 14 + TypeScript + SWR + Tailwind CSS  
**開發工具**: ngrok

**詳細架構**：見 [docs/memory/architecture/current.md](docs/memory/architecture/current.md)

---

## 🗺️ 後續規劃

**詳細規劃**：見 [docs/memory/roadmap.md](docs/memory/roadmap.md)

**短期重點**：
- 多租戶管理系統
- 多商店管理
- 多平台整合

---

## 📖 文件體系

本專案採用結構化的文件體系，適合 AI Agent 協作：

```
docs/
├── 00-AGENT-ONBOARDING.md    # Agent 入門（必讀）
├── memory/                    # 核心記憶（願景、路線圖、架構、決策）
├── backlog/                   # 任務管理（Epic、Story）
├── context/                   # 當前上下文（當前 Run）
├── archive/                   # 歷史記錄
└── reference/                 # 參考資料（API、指南）
```

**文件體系說明**：見 [docs/README.md](docs/README.md)

---

**最後更新**: 2025-11-05  
**維護者**: Mo Studio
