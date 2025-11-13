# 方案 2：通用 Middleware 錯誤處理器 - 設計文件

**建立日期**: 2025-11-12  
**狀態**: 📋 設計階段  
**優先級**: 中  
**相關 Issue**: Issue 2025-11-11-001

---

## 📋 目標

建立一個通用的 middleware 錯誤處理機制，統一處理所有 middleware 的錯誤，防止未處理的異常導致 CORS 錯誤或其他問題。

---

## ⚠️ 風險分析

### 1. **覆蓋現有錯誤處理邏輯**（高風險）

**風險描述**：
- 現有的 middleware（如 `authMiddleware`）都是直接回傳錯誤，而不是拋出異常
- 如果錯誤處理器過於積極，可能會覆蓋現有的錯誤回應格式
- 可能會影響現有的認證流程和錯誤碼

**影響範圍**：
- 所有使用 middleware 的端點
- 認證流程
- 錯誤回應格式

**緩解措施**：
- 只處理**未捕捉的異常**，不處理已回傳的錯誤
- 保持向後相容，不改變現有 middleware 的行為
- 提供選擇性應用的機制

---

### 2. **影響 CORS Preflight 處理**（中風險）

**風險描述**：
- OPTIONS 請求（CORS preflight）不應該執行業務邏輯
- 錯誤處理器可能會在 OPTIONS 請求時執行不必要的處理
- 可能會影響 CORS headers 的設定

**影響範圍**：
- 所有跨域請求
- CORS preflight 請求

**緩解措施**：
- 在錯誤處理器中優先檢查 OPTIONS 請求
- 確保 OPTIONS 請求不會觸發錯誤處理邏輯
- 與方案 3（CORS preflight 優化）配合使用

---

### 3. **隱藏重要錯誤資訊**（中風險）

**風險描述**：
- 如果錯誤處理器統一將所有錯誤轉換為 500，可能會隱藏重要的錯誤資訊
- 前端可能無法根據錯誤碼進行適當的處理
- 除錯會變得困難

**影響範圍**：
- 錯誤日誌
- 前端錯誤處理
- 除錯流程

**緩解措施**：
- 保留錯誤的原始資訊（錯誤碼、錯誤訊息）
- 記錄完整的錯誤堆疊
- 提供錯誤分類機制

---

### 4. **效能影響**（低風險）

**風險描述**：
- 錯誤處理器會增加每個請求的開銷
- 可能會影響高併發場景的效能

**影響範圍**：
- 所有請求
- 高併發場景

**緩解措施**：
- 錯誤處理器應該盡可能輕量
- 只在發生錯誤時才執行額外邏輯
- 使用非同步錯誤處理，不阻塞主流程

---

### 5. **與現有架構的整合**（低風險）

**風險描述**：
- Fastify 的 middleware 機制與 Express 不同
- 需要確保與現有的 preHandler 機制相容
- 可能需要調整現有的 middleware 結構

**影響範圍**：
- Middleware 架構
- 路由定義

**緩解措施**：
- 使用 Fastify 的原生機制（addHook）
- 確保與現有的 preHandler 陣列相容
- 提供清晰的整合指南

---

## 🏗️ 設計方案

### 架構設計

```
┌─────────────────────────────────────────────────────────┐
│                    Fastify Request                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Global Error Handler Hook (onRequest)           │
│  - 檢查 OPTIONS 請求（跳過）                            │
│  - 設定錯誤處理上下文                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PreHandler Middleware Chain                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  authMiddleware                              │       │
│  │  (直接回傳錯誤，不拋出異常)                   │       │
│  └──────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────┐       │
│  │  requireConnectionOwner                       │       │
│  │  (可能拋出異常)                               │       │
│  └──────────────────────────────────────────────┘       │
│  ┌──────────────────────────────────────────────┐       │
│  │  自定義 Middleware                            │       │
│  │  (可能拋出異常)                               │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         Global Error Handler Hook (onError)             │
│  - 捕捉未處理的異常                                     │
│  - 記錄錯誤日誌                                         │
│  - 回傳統一的錯誤格式                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Route Handler                        │
│  (現有的業務邏輯)                                        │
└─────────────────────────────────────────────────────────┘
```

---

### 實作方案

#### 方案 A：使用 Fastify Hook（推薦）

**優點**：
- 使用 Fastify 原生機制
- 不需要修改現有的 middleware
- 可以選擇性地應用

**缺點**：
- 需要了解 Fastify 的 hook 機制
- 可能需要調整 hook 的執行順序

**實作方式**：

```typescript
// backend/src/middleware/middlewareErrorHandler.ts

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'

/**
 * Middleware 錯誤處理器
 * 
 * 功能：
 * 1. 捕捉 preHandler middleware 中未處理的異常
 * 2. 確保錯誤回應格式一致
 * 3. 記錄錯誤日誌
 * 4. 處理 CORS preflight 請求
 */
export function registerMiddlewareErrorHandler(fastify: FastifyInstance) {
  // Hook 1: 在請求開始時設定錯誤處理上下文
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // 跳過 OPTIONS 請求（CORS preflight）
    if (request.method === 'OPTIONS') {
      return
    }

    // 設定錯誤處理標記
    ;(request as any).__middlewareErrorHandled = false
  })

  // Hook 2: 捕捉 preHandler 中的錯誤
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // 如果已經有回應，跳過
    if (reply.sent) {
      return
    }

    // 檢查是否有未處理的錯誤
    // 注意：這個 hook 會在 preHandler 陣列執行後執行
    // 所以我們需要在 preHandler 中手動處理錯誤
  })

  // Hook 3: 捕捉所有未處理的錯誤
  fastify.setErrorHandler(async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    // 記錄錯誤
    fastify.log.error('Unhandled error in middleware:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    })

    // 如果已經有回應，跳過
    if (reply.sent) {
      return
    }

    // 回傳統一的錯誤格式
    return reply.status(500).send({
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'Internal server error',
      // 開發環境顯示詳細錯誤
      ...(process.env.NODE_ENV !== 'production' && {
        details: error.message,
        stack: error.stack,
      }),
    })
  })
}
```

**問題**：Fastify 的 `setErrorHandler` 主要處理 route handler 的錯誤，不直接處理 preHandler 的錯誤。

---

#### 方案 B：Wrapper Middleware（實際可行）

**優點**：
- 可以直接包裝現有的 middleware
- 不需要修改 Fastify 的 hook 機制
- 可以選擇性地應用

**缺點**：
- 需要修改現有的 middleware 使用方式
- 可能會增加程式碼複雜度

**實作方式**：

```typescript
// backend/src/middleware/middlewareErrorHandler.ts

import { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Middleware 錯誤處理器 Wrapper
 * 
 * 包裝 middleware 函數，自動處理錯誤
 */
export function wrapMiddlewareWithErrorHandler(
  middleware: (request: FastifyRequest, reply: FastifyReply) => Promise<void>,
  options?: {
    skipOptions?: boolean // 是否跳過 OPTIONS 請求
    logErrors?: boolean  // 是否記錄錯誤
  }
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // 跳過 OPTIONS 請求
    if (options?.skipOptions !== false && request.method === 'OPTIONS') {
      return
    }

    try {
      await middleware(request, reply)
    } catch (error: any) {
      // 如果已經有回應，跳過
      if (reply.sent) {
        return
      }

      // 記錄錯誤
      if (options?.logErrors !== false) {
        console.error('Middleware error:', {
          error: error.message,
          stack: error.stack,
          url: request.url,
          method: request.method,
        })
      }

      // 回傳統一的錯誤格式
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error',
        // 開發環境顯示詳細錯誤
        ...(process.env.NODE_ENV !== 'production' && {
          details: error.message,
        }),
      })
    }
  }
}
```

**使用方式**：

```typescript
// backend/src/routes/api.ts

import { wrapMiddlewareWithErrorHandler } from '../middleware/middlewareErrorHandler'
import { requireConnectionOwner } from '../middleware/requireConnectionOwner'

// 包裝 middleware
const safeRequireConnectionOwner = wrapMiddlewareWithErrorHandler(
  requireConnectionOwner,
  { skipOptions: true, logErrors: true }
)

// 使用包裝後的 middleware
fastify.patch('/api/connection-items/:id', {
  preHandler: [
    authMiddleware, // 這個不需要包裝（已經有錯誤處理）
    async (request, reply) => {
      // 包裝這個 middleware
      const itemId = (request.params as any).id
      const item = await connectionRepository.findConnectionItemById(itemId)
      if (!item) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_ITEM_NOT_FOUND',
          error: 'Connection Item not found'
        })
      }
      ;(request.params as any).connectionId = item.integrationAccountId
      await safeRequireConnectionOwner(request as any, reply)
    }
  ]
}, async (request, reply) => {
  // ... 現有的處理邏輯
})
```

---

#### 方案 C：修改 requireConnectionOwner（最簡單）

**優點**：
- 最簡單直接
- 不需要額外的抽象層
- 可以直接修復問題

**缺點**：
- 只修復單一 middleware
- 其他 middleware 仍可能有類似問題

**實作方式**：

```typescript
// backend/src/middleware/requireConnectionOwner.ts

export async function requireConnectionOwner(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // 跳過 OPTIONS 請求
    if (request.method === 'OPTIONS') {
      return
    }

    // 1. 驗證 request.user 是否存在
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        error: 'Authentication required',
      })
    }

    const userId = request.user.id

    // 2. 從 URL 參數取得 connectionId
    const connectionId = (request.params as any).connectionId || (request.params as any).id

    if (!connectionId) {
      return
    }

    // 3. 查詢 Connection 並驗證擁有權
    const connection = await connectionRepository.findConnectionById(connectionId)

    if (!connection) {
      return reply.status(404).send({
        success: false,
        code: 'CONNECTION_NOT_FOUND',
        error: 'Connection not found',
      })
    }

    // 4. 驗證 userId 是否匹配
    if (connection.userId !== userId) {
      return reply.status(403).send({
        success: false,
        code: 'CONNECTION_FORBIDDEN',
        error: 'You do not have permission to access this connection',
        connectionId,
      })
    }

    // 5. 驗證 platform scope
    const platformParam = (request.params as any).platform
    if (platformParam && connection.platform !== platformParam) {
      return reply.status(403).send({
        success: false,
        code: 'PLATFORM_MISMATCH',
        error: `Platform mismatch: expected ${platformParam}, but connection is ${connection.platform}`,
        connectionId,
      })
    }
  } catch (error: any) {
    // 記錄錯誤
    console.error('requireConnectionOwner error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    })

    // 如果已經有回應，跳過
    if (reply.sent) {
      return
    }

    // 回傳統一的錯誤格式
    return reply.status(500).send({
      success: false,
      code: 'INTERNAL_ERROR',
      error: 'Internal server error',
    })
  }
}
```

---

## 📊 方案比較

| 方案 | 優點 | 缺點 | 實作難度 | 推薦度 |
|------|------|------|----------|--------|
| **方案 A：Fastify Hook** | 原生機制、不需要修改 middleware | 無法直接處理 preHandler 錯誤 | 中 | ⭐⭐⭐ |
| **方案 B：Wrapper Middleware** | 靈活、可選擇性應用 | 需要修改使用方式 | 中 | ⭐⭐⭐⭐ |
| **方案 C：修改單一 Middleware** | 最簡單、直接修復問題 | 只修復單一 middleware | 低 | ⭐⭐⭐⭐⭐ |

---

## 💡 推薦方案：混合方案

結合方案 B 和方案 C：

1. **短期**：修改 `requireConnectionOwner` 加入錯誤處理（方案 C）
2. **中期**：建立 `wrapMiddlewareWithErrorHandler` 工具函數（方案 B）
3. **長期**：逐步將其他 middleware 包裝起來

---

## 📝 實作步驟

### 階段 1：建立錯誤處理工具（方案 B）

1. 建立 `backend/src/middleware/middlewareErrorHandler.ts`
2. 實作 `wrapMiddlewareWithErrorHandler` 函數
3. 加入單元測試

### 階段 2：修改現有 Middleware（方案 C）

1. 修改 `requireConnectionOwner` 加入錯誤處理
2. 修改 `PATCH /api/connection-items/:id` 端點的 middleware
3. 測試修復後的端點

### 階段 3：逐步推廣（可選）

1. 識別其他可能有類似問題的 middleware
2. 使用 `wrapMiddlewareWithErrorHandler` 包裝它們
3. 更新文件

---

## 🧪 測試策略

### 單元測試

```typescript
// backend/src/middleware/__tests__/middlewareErrorHandler.test.ts

describe('wrapMiddlewareWithErrorHandler', () => {
  it('應該處理 middleware 拋出的異常', async () => {
    const errorMiddleware = async () => {
      throw new Error('Test error')
    }
    
    const wrapped = wrapMiddlewareWithErrorHandler(errorMiddleware)
    // ... 測試邏輯
  })

  it('應該跳過 OPTIONS 請求', async () => {
    // ... 測試邏輯
  })

  it('不應該覆蓋已回傳的錯誤', async () => {
    // ... 測試邏輯
  })
})
```

### 整合測試

1. 測試 `PATCH /api/connection-items/:id` 端點
2. 測試錯誤情況（資料庫連線失敗、Prisma 錯誤等）
3. 測試 CORS preflight 請求

---

## 📚 相關文件

- `docs/backlog/issues/issue-2025-11-11-001-disable-connection-item-network-error.md` - 原始 Issue
- `backend/src/middleware/requireConnectionOwner.ts` - 需要修改的 middleware
- `backend/src/routes/api.ts` - 需要修改的端點

---

## ✅ 驗收標準

1. ✅ `PATCH /api/connection-items/:id` 端點不再出現 CORS 錯誤
2. ✅ Middleware 錯誤被正確捕捉和記錄
3. ✅ 錯誤回應格式一致
4. ✅ OPTIONS 請求不會觸發錯誤處理邏輯
5. ✅ 現有功能不受影響（向後相容）
6. ✅ 有完整的測試覆蓋

---

## 📅 時程估算

- **階段 1**：2-3 小時（建立工具函數）
- **階段 2**：1-2 小時（修改現有 middleware）
- **階段 3**：4-6 小時（逐步推廣，可選）

**總計**：3-5 小時（不含階段 3）

---

## 🔄 後續優化

1. 考慮使用 Fastify 的 `setErrorHandler` 處理全域錯誤
2. 建立錯誤分類機制（資料庫錯誤、認證錯誤等）
3. 整合錯誤監控服務（Sentry、Datadog 等）

