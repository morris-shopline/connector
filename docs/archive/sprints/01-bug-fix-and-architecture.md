# Sprint 1: Bug 修復與架構優化

## 📋 Sprint 概述

**目標**: 修復正式部署後的後端連線問題，優化型別定義策略，提升系統穩定性。

**狀態**: ✅ 已完成  
**開始日期**: 2025-01-XX  
**完成日期**: 2025-01-XX  
**持續時間**: 1 天

**前置 Sprint**: [Sprint 0: 基礎架構與 OAuth 授權](./00-foundation.md)  
**後續 Sprint**: [Sprint 2: Admin API 測試功能](./02-admin-api-testing.md)

---

## 🎯 Sprint 目標

1. **修復 Token 過期問題**: 實作 Token 過期檢查機制，改善錯誤處理
2. **優化型別定義策略**: 採用完全獨立策略，前後端各自維護型別
3. **後端健康檢查**: 新增健康檢查功能，支援 Render 免費版冷啟動檢測
4. **改善使用者體驗**: 提供清楚的錯誤訊息和使用者引導

---

## 🔧 實作範圍

### 1. Token 過期處理機制

#### 問題描述
- 正式部署後，Webhook 管理頁面出現 401 錯誤（ACCESS_TOKEN is expired）
- 後端在調用 Shopline API 時未檢查 Token 是否過期
- 錯誤訊息不夠清楚，使用者無法理解問題

#### 解決方案

**後端改進** (`backend/src/services/shopline.ts`):
- ✅ 新增 `isTokenExpired()` 方法：檢查 Token 是否過期（含 5 分鐘緩衝）
- ✅ 新增 `validateStoreToken()` 方法：驗證商店並檢查 Token 是否過期
- ✅ 新增 `handleApiError()` 方法：統一處理 API 錯誤，提供清楚訊息
- ✅ 在 `subscribeWebhook()`, `getSubscribedWebhooks()`, `unsubscribeWebhook()` 中加入 Token 檢查

**錯誤處理改進** (`backend/src/routes/webhook.ts`):
- ✅ 針對 Token 過期錯誤返回 401 狀態碼
- ✅ 提供結構化的錯誤回應（`code: 'TOKEN_EXPIRED'`）
- ✅ 改善錯誤訊息格式

**前端改進**:
- ✅ `useSubscribeWebhook`: 處理 Token 過期錯誤，提供重新授權選項
- ✅ `useUnsubscribeWebhook`: 處理 Token 過期錯誤
- ✅ `useWebhookSubscriptions`: 檢測 Token 過期，顯示提示訊息
- ✅ `webhook-test.tsx`: 顯示 Token 過期警告，提供重新授權按鈕

#### 改進效果
- **之前**: 500 Internal Server Error，技術性錯誤訊息
- **現在**: 401 狀態碼，清楚提示「Access Token 已過期，請重新授權商店」，並提供重新授權選項

---

### 2. 型別定義策略優化

#### 問題描述
- 專案使用 `shared/types.ts` 統一管理型別，但前後端分離部署（Vercel + Render）
- 部署時無法訪問 `shared/` 目錄，導致 TypeScript 編譯錯誤
- 需要同步機制，增加維護成本

#### 解決方案

**採用完全獨立策略**:
- ✅ 建立 `frontend/types.ts`（從 shared 複製）
- ✅ 確認 `backend/src/types.ts` 已存在（更新註解）
- ✅ 更新所有前端引用：`@/shared/types` → `@/types`
- ✅ 更新 `frontend/tsconfig.json`：移除 shared 配置
- ✅ 更新 `frontend/next.config.js`：移除 webpack alias 中的 shared 配置

**刪除同步機制**:
- ✅ 刪除 `scripts/sync-types.js`
- ✅ 刪除 `scripts/check-types.js`
- ✅ 移除 `package.json` 中的同步相關腳本

**文件更新**:
- ✅ 建立 `docs/memory/architecture/project-structure.md`：說明專案結構和部署架構
- ✅ 更新 `docs/memory/architecture/current.md`：移除 shared 相關說明
- ✅ 更新 `docs/reference/guides/DEPLOYMENT_GUIDE.md`：移除 shared 相關說明
- ✅ 更新 `README.md`：移除 shared 目錄說明

**評估文件歸檔**:
- ✅ 將型別策略評估文件移至 `docs/archive/discussions/`
  - `TYPE_SHARING_ANALYSIS.md`
  - `AUTO_SYNC_ANALYSIS.md`
  - `TYPE_STRATEGY_COMPARISON.md`
  - `TYPE_SYNC_WORKFLOW.md`

#### 改進效果
- **簡單可靠**: 開發和部署環境一致，無額外同步機制
- **認知負擔低**: 不需要理解同步機制，直接修改對應檔案
- **符合架構**: 符合分離部署的設計理念

---

### 3. 後端健康檢查功能

#### 問題描述
- Render 免費版有冷啟動問題，服務會進入睡眠狀態
- 無法快速確認後端是否已啟動
- 需要手動測試才能知道後端狀態

#### 解決方案

**後端健康檢查端點** (`backend/src/routes/api.ts`):
- ✅ 新增 `/api/health` 端點
- ✅ 檢查資料庫連線狀態
- ✅ 返回服務運行時間（uptime）
- ✅ 返回回應時間
- ✅ 返回環境資訊
- ✅ 如果資料庫連線失敗，返回 503 狀態碼

**前端健康檢查功能**:
- ✅ 建立 `frontend/hooks/useHealthCheck.ts` Hook
- ✅ 在首頁右上角加入健康檢查按鈕
- ✅ 顯示檢查狀態（成功/失敗/檢查中）
- ✅ 顯示詳細資訊（回應時間、資料庫狀態、運行時間）
- ✅ 針對 Render 冷啟動問題提供清楚提示

**功能特色**:
- 按鈕狀態：藍色（初始）、綠色（成功）、紅色（失敗）、灰色（檢查中）
- 狀態訊息：顯示在按鈕左側，清楚顯示檢查結果
- Tooltip：顯示最後檢查時間
- 錯誤處理：針對 ECONNREFUSED、504、503 提供清楚提示

#### 改進效果
- 可以快速檢查後端連線狀態
- 可以喚醒 Render 免費版的冷啟動服務
- 可以監控後端健康狀態（資料庫連線、運行時間等）

---

## 📊 技術實作細節

### 1. Token 過期檢查實作

```typescript
// backend/src/services/shopline.ts

private isTokenExpired(store: any): boolean {
  if (!store.expiresAt) {
    // 嘗試從 JWT 解析
    try {
      const jwtPayload = JSON.parse(Buffer.from(store.accessToken.split('.')[1], 'base64').toString())
      if (jwtPayload.exp) {
        const expTime = jwtPayload.exp * 1000
        return Date.now() >= expTime
      }
    } catch (error) {
      console.error('Failed to parse JWT:', error)
    }
    return false
  }

  // 檢查過期時間（加入 5 分鐘緩衝）
  const bufferTime = 5 * 60 * 1000
  return Date.now() >= (store.expiresAt.getTime() - bufferTime)
}

private async validateStoreToken(handle: string): Promise<any> {
  const store = await this.getStoreByHandle(handle)
  if (!store) {
    throw new Error(`Store not found for handle: ${handle}`)
  }

  if (this.isTokenExpired(store)) {
    throw new Error('ACCESS_TOKEN_EXPIRED: Access Token 已過期，請重新授權商店')
  }

  return store
}
```

### 2. 錯誤處理改進

```typescript
// backend/src/services/shopline.ts

private handleApiError(response: Response, text: string): Error {
  let errorMessage = text || response.statusText
  
  try {
    const errorData = JSON.parse(text)
    if (errorData.errors) {
      errorMessage = errorData.errors
    } else if (errorData.message) {
      errorMessage = errorData.message
    }
  } catch (parseError) {
    // 使用原始文字
  }

  if (response.status === 401) {
    if (errorMessage.includes('expired') || errorMessage.includes('過期')) {
      return new Error('ACCESS_TOKEN_EXPIRED: Access Token 已過期，請重新授權商店')
    }
    return new Error(`AUTHENTICATION_FAILED: 認證失敗 - ${errorMessage}`)
  }

  // ... 其他狀態碼處理
}
```

### 3. 健康檢查端點

```typescript
// backend/src/routes/api.ts

fastify.get('/api/health', async (request, reply) => {
  const startTime = Date.now()
  
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    
    const responseTime = Date.now() - startTime
    
    return reply.send({
      success: true,
      message: 'Service is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error: any) {
    // ... 錯誤處理
  }
})
```

---

## 📝 檔案變更清單

### 新增檔案
- `frontend/types.ts` - 前端型別定義
- `frontend/hooks/useHealthCheck.ts` - 健康檢查 Hook
- `docs/memory/architecture/project-structure.md` - 專案結構說明文件
- `docs/archive/discussions/TYPE_SHARING_ANALYSIS.md` - 型別策略分析（已歸檔）
- `docs/archive/discussions/AUTO_SYNC_ANALYSIS.md` - 自動化同步分析（已歸檔）
- `docs/archive/discussions/TYPE_STRATEGY_COMPARISON.md` - 型別策略比較（已歸檔）
- `docs/archive/discussions/TYPE_SYNC_WORKFLOW.md` - 型別同步工作流程（已歸檔）

### 修改檔案
- `backend/src/services/shopline.ts` - Token 檢查、錯誤處理
- `backend/src/routes/webhook.ts` - 錯誤處理改進
- `backend/src/routes/api.ts` - 健康檢查端點
- `backend/src/types.ts` - 更新註解
- `frontend/pages/webhook-test.tsx` - Token 過期提示
- `frontend/hooks/useSubscribeWebhook.ts` - 錯誤處理
- `frontend/hooks/useUnsubscribeWebhook.ts` - 錯誤處理
- `frontend/hooks/useWebhookSubscriptions.ts` - Token 過期檢測
- `frontend/pages/index.tsx` - 健康檢查按鈕
- `frontend/components/StoreCard.tsx` - 更新引用路徑
- `frontend/hooks/useStores.ts` - 更新引用路徑
- `frontend/lib/api.ts` - 更新引用路徑
- `frontend/tsconfig.json` - 移除 shared 配置
- `frontend/next.config.js` - 移除 webpack alias
- `docs/memory/architecture/current.md` - 移除 shared 說明
- `docs/reference/guides/DEPLOYMENT_GUIDE.md` - 移除 shared 說明
- `README.md` - 移除 shared 說明

### 刪除檔案
- `scripts/sync-types.js` - 同步腳本（已刪除）
- `scripts/check-types.js` - 檢查腳本（已刪除）

---

## ✅ 完成標準

### 後端完成標準
- ✅ Token 過期檢查機制實作完成
- ✅ 錯誤處理改進完成
- ✅ 健康檢查端點實作完成
- ✅ 所有 API 方法都加入 Token 檢查

### 前端完成標準
- ✅ Token 過期提示顯示正常
- ✅ 健康檢查按鈕功能正常
- ✅ 錯誤訊息清楚易懂
- ✅ 提供重新授權選項

### 架構優化完成標準
- ✅ 型別定義完全獨立
- ✅ 所有引用路徑更新完成
- ✅ 同步機制已移除
- ✅ 文件更新完成

---

## 📚 相關文件

### 專案文件
- [專案結構與部署架構](../memory/architecture/project-structure.md) - 型別定義策略說明
- [系統架構](../memory/architecture/current.md) - 架構說明
- [部署指南](../reference/guides/DEPLOYMENT_GUIDE.md) - 部署說明

### Sprint 文件
- [Sprint 0: 基礎架構與 OAuth 授權](./00-foundation.md) - 前置 Sprint
- [Sprint 2: Admin API 測試功能](./02-admin-api-testing.md) - 後續 Sprint

---

## 🔄 後續規劃

### 下一個 Sprint
- [Sprint 2: Admin API 測試功能](./02-admin-api-testing.md)
  - 實作 Shopline Admin API 常用功能封裝
  - 建立前端測試介面
  - 使用已改進的錯誤處理機制

### 長期優化
- Token 自動刷新機制（避免手動重新授權）
- API 請求快取
- 更詳細的健康檢查資訊（資料庫連線池狀態等）

---

## 📝 備註

- 本 Sprint 主要解決正式部署後的問題
- 型別定義策略的變更確保了開發和部署環境的一致性
- 健康檢查功能對於 Render 免費版的冷啟動問題特別有用
- 所有改進都通過了測試，並已推送到遠端倉庫

---

**Sprint 狀態**: ✅ 已完成  
**完成日期**: 2025-01-XX  
**最後更新**: 2025-01-XX

