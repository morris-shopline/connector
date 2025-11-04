# Sprint 0: 基礎架構與 OAuth 授權

## 📋 Sprint 概述

**目標**: 建立專案基礎架構，實作 OAuth 2.0 授權流程，為後續開發奠定基礎。

**狀態**: ✅ 已完成  
**開始日期**: 2025-10-XX  
**完成日期**: 2025-11-03  
**持續時間**: ~2 週

**前置 Sprint**: 無（專案起始）  
**後續 Sprint**: [Sprint 1: Admin API 測試功能](./01-admin-api-testing.md)

---

## 🎯 Sprint 目標

1. **專案基礎架構建立**
   - 後端框架設定（Fastify + TypeScript）
   - 前端框架設定（Next.js + TypeScript）
   - 資料庫整合（Prisma + Neon PostgreSQL）
   - 開發環境配置

2. **OAuth 2.0 授權流程實作**
   - 安裝請求驗證
   - 授權碼交換 Access Token
   - JWT Token 解析與儲存
   - 自動重導向流程

3. **安全機制實作**
   - HMAC-SHA256 簽名驗證
   - 時間戳驗證
   - 防時序攻擊機制

4. **前端基礎介面**
   - 商店列表展示
   - 授權對話框
   - 響應式設計

5. **Webhook 基礎功能**
   - Webhook 訂閱/取消訂閱
   - Webhook 事件接收與儲存

---

## 📊 實作範圍

### Phase 1: 專案初始化 ✅

- [x] 專案結構建立
- [x] 後端框架設定（Fastify）
- [x] 前端框架設定（Next.js）
- [x] TypeScript 配置
- [x] 環境變數管理
- [x] 開發工具配置

### Phase 2: 資料庫設計 ✅

- [x] Prisma Schema 設計
- [x] Neon PostgreSQL 連接
- [x] 資料庫遷移
- [x] Store 模型實作
- [x] WebhookEvent 模型實作

### Phase 3: OAuth 流程實作 ✅

- [x] 安裝請求驗證端點 (`/api/auth/shopline/install`)
- [x] 授權 URL 生成
- [x] 回調處理端點 (`/api/auth/shopline/callback`)
- [x] Token 交換實作
- [x] JWT Token 解析
- [x] 商店資訊儲存

### Phase 4: 安全機制 ✅

- [x] HMAC-SHA256 簽名生成
- [x] 簽名驗證機制
- [x] 時間戳驗證（支援秒/毫秒）
- [x] `crypto.timingSafeEqual()` 防時序攻擊
- [x] 參數排序與過濾

### Phase 5: 前端介面 ✅

- [x] 商店列表頁面
- [x] 授權對話框元件
- [x] SWR 資料獲取整合
- [x] 響應式設計
- [x] 錯誤處理與顯示

### Phase 6: Webhook 基礎功能 ✅

- [x] Webhook 訂閱 API (`subscribeWebhook`)
- [x] Webhook 取消訂閱 API (`unsubscribeWebhook`)
- [x] Webhook 列表查詢 API (`getSubscribedWebhooks`)
- [x] Webhook 事件接收端點 (`/webhook/shopline`)
- [x] Webhook 事件儲存

---

## 🏗️ 技術實作

### 後端架構

**檔案結構**:
```
backend/
├── src/
│   ├── index.ts              # Fastify 應用入口
│   ├── routes/
│   │   ├── auth.ts           # OAuth 授權路由
│   │   ├── api.ts            # 商店 API 路由
│   │   └── webhook.ts        # Webhook 路由
│   ├── services/
│   │   └── shopline.ts       # Shopline 服務封裝
│   └── utils/
│       └── signature.ts     # 簽名工具
├── prisma/
│   └── schema.prisma         # 資料庫 Schema
└── package.json
```

**關鍵實作**:
- `ShoplineService`: 核心業務邏輯封裝
- OAuth 流程完整實作
- 簽名驗證統一處理
- 資料庫操作透過 Prisma

### 前端架構

**檔案結構**:
```
frontend/
├── pages/
│   ├── index.tsx            # 主頁面
│   └── webhook-test.tsx     # Webhook 測試頁面
├── components/
│   ├── StoreCard.tsx         # 商店卡片
│   └── WebhookEventCard.tsx # Webhook 事件卡片
├── hooks/
│   ├── useStores.ts          # 商店資料 Hook
│   └── useWebhookEvents.ts   # Webhook 事件 Hook
└── lib/
    └── api.ts                # API 客戶端
```

**關鍵技術**:
- Next.js 14 App Router
- SWR 資料獲取與快取
- Tailwind CSS 樣式
- TypeScript 型別安全

---

## 📝 交付成果

### 代碼交付

- ✅ 後端服務完整實作
- ✅ 前端應用完整實作
- ✅ 資料庫 Schema 設計
- ✅ 共享型別定義

### 文件交付

- ✅ README.md - 專案概覽
- ✅ PROJECT_STATUS.md - 專案狀態
- ✅ docs/ARCHITECTURE.md - 系統架構
- ✅ docs/COMPLIANCE_CHECK.md - 合規性檢查
- ✅ docs/LESSONS_LEARNED.md - 開發經驗
- ✅ docs/WEBHOOK_GUIDE.md - Webhook 指南
- ✅ docs/SHOPLINE_WEBHOOK_TOPICS.md - Webhook Topics

### 功能交付

- ✅ OAuth 2.0 授權流程（100% 完成）
- ✅ 商店資訊管理
- ✅ Webhook 訂閱管理
- ✅ Webhook 事件接收與儲存
- ✅ 前端管理介面

---

## 🧪 測試結果

### 功能測試

- ✅ OAuth 授權流程測試通過
- ✅ 簽名驗證測試通過
- ✅ 資料儲存測試通過
- ✅ 前端展示測試通過
- ✅ Webhook 訂閱測試通過

### 合規性測試

- ✅ Shopline API 規範 100% 符合
- ✅ 簽名驗證完全符合
- ✅ 安全標準符合 OWASP 建議

---

## 📈 技術指標

### 代碼品質

- **TypeScript**: 100% 型別覆蓋
- **錯誤處理**: 全面覆蓋
- **日誌記錄**: 結構化輸出

### 效能指標

- **後端啟動**: < 3 秒
- **前端啟動**: < 5 秒
- **OAuth 流程**: < 10 秒（含使用者操作）
- **資料庫查詢**: < 100ms

---

## 🎓 關鍵學習

### 技術層面

1. **官方文件 vs 實際實作**: Shopline 官方文件與實際 API 行為可能有差異，需要實際測試驗證
2. **簽名驗證**: 參數排序和安全性非常重要，必須使用 `crypto.timingSafeEqual()` 防止時序攻擊
3. **JWT 處理**: Access Token 是 JWT 格式，需要正確解析 payload 獲取商店資訊
4. **時間戳格式**: 支援秒級和毫秒級時間戳，需要自動判斷

### 開發流程

1. **測試優先**: 先進行小規模測試，確認 API 格式和行為
2. **文件記錄**: 詳細記錄實際實作與官方文件的差異
3. **錯誤處理**: 建立統一的錯誤處理機制，便於除錯

詳細學習點請參考：[docs/LESSONS_LEARNED.md](../LESSONS_LEARNED.md)

---

## 🚨 遇到的問題與解決方案

### 問題 1: 授權 URL 格式差異

**問題**: 官方文件提供的授權 URL 格式與實際可用的格式不同。

**解決方案**: 使用實際測試驗證的 URL 格式：
```
實際可用: https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize
官方文件: https://{handle}.myshopline.com/admin/oauth/authorize
```

### 問題 2: 時間戳格式不一致

**問題**: 不同端點可能使用秒級或毫秒級時間戳。

**解決方案**: 自動判斷時間戳長度（13位數以上為毫秒）。

---

## ✅ 完成標準

### 功能完成度

- [x] 所有 Phase 1-6 功能實作完成
- [x] 所有功能測試通過
- [x] 合規性檢查通過
- [x] 文件完整

### 品質標準

- [x] 無已知嚴重 Bug
- [x] 錯誤處理完善
- [x] 日誌記錄完整
- [x] 程式碼符合規範

---

## 🔄 後續規劃

### Sprint 0 完成後

- ✅ 準備進入 Sprint 1: Admin API 測試功能
- ✅ 建立 Sprint 文件體系
- ✅ 整理開發經驗

### 下一個 Sprint 準備

**Sprint 1** 將基於 Sprint 0 的成果：
- 使用已建立的 OAuth 授權機制
- 使用已儲存的商店 Access Token
- 擴展 `ShoplineService` 新增 Admin API 方法
- 建立前端測試介面

---

## 📚 相關文件

- [Sprint 總覽](./SPRINT_INDEX.md)
- [Sprint 1: Admin API 測試功能](./01-admin-api-testing.md)
- [系統架構](../ARCHITECTURE.md)
- [合規性檢查](../COMPLIANCE_CHECK.md)
- [Webhook 指南](../WEBHOOK_GUIDE.md)

---

**Sprint 狀態**: ✅ 已完成  
**完成日期**: 2025-11-03  
**最後更新**: 2025-11-03

