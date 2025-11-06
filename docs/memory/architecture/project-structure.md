# 專案結構與部署架構

## 📋 專案架構概述

本專案採用**前後端分離架構**，前端和後端**獨立部署**到不同的平台：

- **前端 (Frontend)**: 部署到 **Vercel**，Root Directory: `frontend/`
- **後端 (Backend)**: 部署到 **Render**，Root Directory: `backend/`

## 🗂️ 專案目錄結構

```
lab/
├── frontend/              # Next.js 前端應用（獨立部署）
│   ├── pages/
│   ├── components/
│   │   └── Header.tsx    # 統一 Header 組件（所有頁面共用）
│   ├── hooks/
│   ├── lib/
│   └── types.ts          # 前端型別定義
│
├── backend/               # Fastify 後端服務（獨立部署）
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types.ts      # 後端型別定義
│   └── prisma/
│
└── docs/                  # 專案文件
```

## 📝 型別定義說明

### 型別定義策略

本專案採用**完全獨立**的型別定義策略：

- **前端**：使用 `frontend/types.ts`
- **後端**：使用 `backend/src/types.ts`
- **各自獨立維護**，不共享型別定義

### 為什麼採用獨立策略？

1. **符合分離部署架構**：前端和後端是獨立部署的
2. **簡單可靠**：開發和部署環境一致
3. **認知負擔低**：不需要理解額外的同步機制
4. **靈活性高**：前後端可以根據需要定義不同的型別

### 型別定義位置

**前端型別**：
- 檔案：`frontend/types.ts`
- 引用：`import { ... } from '@/types'`

**後端型別**：
- 檔案：`backend/src/types.ts`
- 引用：`import { ... } from '../types'`

### 型別一致性

雖然前後端型別定義是獨立的，但通常會保持一致：

- **API 合約**：透過 API 文件（OpenAPI/Swagger）確保一致性
- **API 測試**：透過測試確保 API 合約一致
- **Code Review**：在 Code Review 時檢查型別一致性

---

## 🚀 部署架構

### 前端部署（Vercel）

- **Root Directory**: `frontend/`
- **Build Command**: `npm run build`
- **型別定義**: 使用 `frontend/types.ts`（獨立，不依賴外部檔案）

### 後端部署（Render）

- **Root Directory**: `backend/`
- **Build Command**: `npm install && npm run build`
- **型別定義**: 使用 `backend/src/types.ts`（獨立，不依賴外部檔案）

---

## 📚 相關文件

- [系統架構](./ARCHITECTURE.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

**最後更新**: 2025-01-XX  
**維護者**: 專案團隊
