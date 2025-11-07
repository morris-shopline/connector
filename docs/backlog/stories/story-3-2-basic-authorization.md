# Story 3.2: 基礎權限驗證機制

**所屬 Epic**: [Epic 3: Admin 管理系統（Phase 1.1）](../epics/epic-3-admin-management-system.md)  
**狀態**: ✅ completed  
**完成 Run**: run-2025-11-06-01  
**建立日期**: 2025-11-06  
**對應 Roadmap**: Phase 1.1

---

## Story 描述

實作最基礎的權限驗證機制，區分「未登入」和「登入後」的存取權限。建立路由保護和 API 端點保護機制，確保未登入使用者無法訪問系統，登入後可訪問自己的資料。

**核心功能**：
- API 端點保護（驗證登入狀態）
- 權限驗證中間件（後端）
- 資料過濾（基礎，後端）

**範圍說明**：
- ✅ **包含**: 後端認證中間件擴展、API 端點保護、資料過濾（基礎）
- ❌ **不包含**: 前端路由保護、前端認證狀態檢查（由 Story 3.4 統一實作）
- ❌ **不包含**: 複雜的角色管理（Admin、User 等）、細粒度權限控制（這些屬於未來 Story）

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（基礎權限驗證）

---

## 前情提要

### 前置條件
- ✅ **Story 3.1 必須完成**：使用者認證系統（註冊、登入、登出、Session 管理）
- ✅ **Refactor 1 完成**：Redis 基礎設施已整合（`backend/src/utils/redis.ts`）
- ✅ **資料庫基礎**：Prisma + Neon PostgreSQL 已設定完成
- ✅ **後端框架**：Fastify + TypeScript 已建立
- ✅ **前端框架**：Next.js + TypeScript 已建立

### 設計決策
- **認證機制**：JWT Token + Redis Session（Story 3.1 實作）
- **路由保護**：前端使用 HOC 或 Middleware，後端使用認證中間件
- **API 保護**：使用認證中間件驗證 JWT Token 或 Session ID
- **登入狀態檢查**：前端使用 Hook 檢查登入狀態，後端使用中間件驗證

---

## 🚨 前置條件（需要 Human 先處理）

### 1. Story 3.1 必須完成
- [x] Story 3.1: 使用者認證系統已完成
- [x] JWT Token 生成與驗證功能可用（`backend/src/utils/jwt.ts`）
- [x] Session 管理功能可用（`backend/src/utils/session.ts`）
- [x] 認證中間件已建立（`backend/src/middleware/auth.ts`）
- [x] 註冊、登入、登出 API 已實作（`backend/src/routes/auth.ts`）

### 2. 環境變數需求

**後端環境變數**（需要確認已設定）：
```bash
DATABASE_URL=postgresql://...  # Neon PostgreSQL（已設定）
REDIS_URL=redis://...          # Redis 連線（已設定）
JWT_SECRET=...                 # JWT 簽名密鑰（已設定）
```

**前端環境變數**（需要確認已設定）：
```bash
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com  # 後端 API URL（已設定）
```

---

## 技術需求

### 1. 後端認證中間件

#### 認證中間件設計

**檔案位置**：`backend/src/middleware/auth.ts`（Story 3.1 會建立，本 Story 需要擴展）

**功能**：
- 驗證 JWT Token（從 `Authorization: Bearer ${token}` header）
- 驗證 Session ID（從 `Cookie: sessionId=${sessionId}` 或 header）
- 將使用者資訊附加到 `request.user`
- 未通過驗證時返回 401 錯誤

**使用方式**：
```typescript
fastify.get('/api/protected', { preHandler: [authMiddleware] }, async (request, reply) => {
  const user = request.user // 已通過認證的使用者
  // ...
})
```

#### 中間件實作

**需要實作的函數**：
```typescript
// 認證中間件
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>

// 可選的認證檢查（不強制要求登入）
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>
```

**驗證流程**：
1. 從 `Authorization` header 取得 JWT Token
2. 如果沒有 Token，從 `Cookie` 或 header 取得 Session ID
3. 驗證 Token 或 Session
4. 如果驗證通過，將使用者資訊附加到 `request.user`
5. 如果驗證失敗，返回 401 錯誤

### 2. API 端點保護

#### 需要保護的 API 端點

**需要保護的端點**（需要登入才能訪問）：
- `GET /api/stores` - 取得商店列表（需要登入）
- `GET /api/stores/:shopId` - 取得特定商店資訊（需要登入）
- `POST /api/stores` - 建立商店（需要登入）
- `PUT /api/stores/:shopId` - 更新商店資訊（需要登入）
- `DELETE /api/stores/:shopId` - 刪除商店（需要登入）
- `GET /webhook/events` - 取得 Webhook 事件列表（需要登入）
- `POST /webhook/subscribe` - 訂閱 Webhook（需要登入）
- `POST /webhook/unsubscribe` - 取消訂閱 Webhook（需要登入）
- `POST /api/admin/*` - Admin API 測試功能（需要登入）

**不需要保護的端點**（公開訪問）：
- `GET /api/auth/shopline/install` - Shopline OAuth 安裝（公開）
- `GET /api/auth/shopline/callback` - Shopline OAuth 回調（公開）
- `POST /api/auth/register` - 使用者註冊（公開）
- `POST /api/auth/login` - 使用者登入（公開）
- `POST /webhook/shopline` - Shopline Webhook 接收（公開，使用簽名驗證）

#### 實作方式

**檔案位置**：`backend/src/routes/api.ts`、`backend/src/routes/webhook.ts`

**實作方式**：
```typescript
// 使用認證中間件保護路由
fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
  const user = request.user // 已通過認證的使用者
  // 只返回該使用者的商店
  // ...
})
```

### 3. 資料隔離（基礎）

#### 使用者資料隔離

**範圍**：
- 使用者只能訪問自己的商店資料
- 使用者只能訪問自己的 Webhook 事件
- 使用者只能訪問自己的 Webhook 訂閱

**實作方式**：
```typescript
// 在 API 端點中，只返回該使用者的資料
fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
  const user = request.user // 已通過認證的使用者
  const stores = await prisma.store.findMany({
    where: {
      userId: user.id // 只返回該使用者的商店
    }
  })
  return stores
})
```

**注意**：完整的資料隔離需要 Story 3.3 實作多租戶資料模型，本 Story 只實作基礎的資料過濾。

---

## 實作步驟

### Phase 1: 後端認證中間件擴展

1. **擴展現有認證中間件**
   - 確認 `backend/src/middleware/auth.ts` 已建立（Story 3.1）
   - 擴展中間件支援可選認證（`optionalAuthMiddleware`）
   - 確保中間件正確處理 JWT Token 和 Session ID

2. **測試認證中間件**
   - 測試有效 Token 驗證
   - 測試無效 Token 驗證
   - 測試 Session ID 驗證
   - 測試未提供 Token/Session 的情況

### Phase 2: API 端點保護

1. **保護 API 端點**
   - 在 `backend/src/routes/api.ts` 中為需要保護的端點加入認證中間件
   - 在 `backend/src/routes/webhook.ts` 中為需要保護的端點加入認證中間件
   - 確保公開端點不受影響

2. **實作資料過濾**
   - 在 API 端點中，只返回該使用者的資料
   - 確保使用者無法訪問其他使用者的資料

3. **測試 API 保護**
   - 測試未登入時訪問保護端點（應返回 401）
   - 測試登入後訪問保護端點（應返回資料）
   - 測試資料隔離（使用者只能看到自己的資料）

### Phase 3: 整合測試

1. **端到端測試**
   - 測試完整的登入流程
   - 測試登入後訪問保護頁面
   - 測試登入後訪問保護 API
   - 測試登出後無法訪問保護資源

2. **資料隔離測試**
   - 測試使用者只能看到自己的資料
   - 測試使用者無法訪問其他使用者的資料

---

## 驗收標準

### Agent 功能測試

#### 後端認證中間件測試
- [x] 認證中間件正確驗證 JWT Token
- [x] 認證中間件正確驗證 Session ID
- [x] 認證中間件正確處理無效 Token
- [x] 認證中間件正確處理未提供 Token 的情況
- [x] 認證中間件正確將使用者資訊附加到 `request.user`

#### API 端點保護測試
- [x] 需要保護的 API 端點正確使用認證中間件
- [x] 未登入時訪問保護端點返回 401 錯誤
- [x] 登入後訪問保護端點返回正確資料
- [x] 公開端點不受認證中間件影響
- [x] 資料過濾正確（使用者只能看到自己的資料）

**注意**：前端路由保護和 API 請求保護由 Story 3.4 統一實作。

#### TypeScript 類型檢查
- [ ] 所有 TypeScript 類型定義正確
- [ ] 編譯無錯誤
- [ ] ESLint 檢查通過

### User Test 驗收標準

**測試步驟**：

1. **未登入訪問保護 API 測試**
   - 清除瀏覽器的 Token/Session
   - 使用 API 工具（如 Postman）呼叫 `/api/stores`（不提供 Token）
   - **驗證**：應該返回 401 錯誤（未授權）
   - 呼叫 `/api/stores/:shopId`（不提供 Token）
   - **驗證**：應該返回 401 錯誤

2. **登入後訪問保護 API 測試**
   - 使用登入返回的 Token 呼叫 `/api/stores`
   - **驗證**：應該返回該使用者的商店列表
   - 呼叫 `/api/stores/:shopId`（使用該使用者的商店 ID）
   - **驗證**：應該返回該商店的資訊
   - 呼叫 `/api/stores/:shopId`（使用其他使用者的商店 ID）
   - **驗證**：應該返回 403 錯誤（禁止訪問）或 404 錯誤（找不到）

3. **資料隔離測試**
   - 使用使用者 A 的帳號登入
   - 建立商店 A
   - 使用使用者 B 的帳號登入
   - 建立商店 B
   - 使用使用者 A 的帳號登入
   - 呼叫 `/api/stores`
   - **驗證**：應該只返回商店 A，不包含商店 B
   - 嘗試訪問商店 B 的資訊（`/api/stores/:shopIdB`）
   - **驗證**：應該返回 403 或 404 錯誤

4. **登出後無法訪問保護 API 測試**
   - 登入後呼叫保護 API（確認可以訪問）
   - 執行登出
   - 嘗試呼叫保護 API
   - **驗證**：應該返回 401 錯誤

5. **公開端點不受影響測試**
   - 未登入時訪問 `/api/auth/register`
   - **驗證**：應該可以正常註冊
   - 未登入時訪問 `/api/auth/login`
   - **驗證**：應該可以正常登入
   - 未登入時訪問 `/api/auth/shopline/install`
   - **驗證**：應該可以正常訪問（Shopline OAuth 流程）

## 測試紀錄（2025-11-07）

| 測試項目 | 結果 | 備註 |
| --- | --- | --- |
| 未登入訪問 `/api/stores` | ✅ | 401 `Authentication required` |
| 未登入訪問 `/api/stores/:shopId` | ✅ | 401 `Authentication required` |
| 使用者登入後取得自己的商店列表 | ✅ | User1/User2 皆僅看到自身商店（200） |
| 使用者登入後取得自己的商店詳情 | ✅ | `/api/stores/{self}` 返回 200 與商店資訊 |
| 跨使用者存取 | ✅ | `/api/stores/{others}` 返回 403 `Forbidden` |
| 登出後再訪問保護端點 | ✅ | `/api/stores` 返回 401 `Invalid or expired session` |
| 公開端點驗證 | ✅ | 未登入註冊 `qa-story32-public@example.com` 成功（200） |
| Webhook 事件列表 | ✅ | 登入請求返回 200，資料為 `[]` |

---

## 程式碼範例

### 認證中間件範例

```typescript
// backend/src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../utils/jwt'
import { getSession } from '../utils/session'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // 1. 從 Authorization header 取得 JWT Token
  const authHeader = request.headers.authorization
  let token: string | null = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // 2. 如果沒有 Token，從 Cookie 或 header 取得 Session ID
  let sessionId: string | null = null
  if (!token) {
    sessionId = (request.cookies as any)?.sessionId || request.headers['x-session-id'] as string
  }
  
  // 3. 驗證 Token 或 Session
  if (token) {
    const payload = verifyToken(token)
    if (!payload) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired token'
      })
    }
    // 將使用者資訊附加到 request（TypeScript 類型已擴展）
    request.user = {
      id: payload.userId,
      email: payload.email
    }
    return
  }
  
  if (sessionId) {
    const session = await getSession(sessionId)
    if (!session) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired session'
      })
    }
    // 將使用者資訊附加到 request（TypeScript 類型已擴展）
    request.user = {
      id: session.userId,
      email: session.email
    }
    request.sessionId = sessionId
    return
  }
  
  // 4. 如果都沒有，返回 401
  return reply.status(401).send({
    success: false,
    error: 'Authentication required'
  })
}
```

**注意**：需要先建立 TypeScript 類型擴展（見 Story 3.1 的類型擴展說明）。

### API 端點保護範例

```typescript
// backend/src/routes/api.ts
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { filterStoresByUser } from '../utils/query-filter'

export async function apiRoutes(fastify: FastifyInstance) {
  // 保護的端點：需要登入
  fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required'
      })
    }
    
    const userId = request.user.id // 已通過認證的使用者（TypeScript 類型安全）
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      const stores = await prisma.store.findMany({
        where: filterStoresByUser(userId), // 資料隔離
        orderBy: { createdAt: 'desc' },
      })
      
      await prisma.$disconnect()
      
      return reply.send({
        success: true,
        data: stores
      })
    } catch (error) {
      await prisma.$disconnect()
      fastify.log.error({ msg: 'Get stores error:', error })
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
  
  // 公開端點：不需要登入
  fastify.get('/api/health', async (request, reply) => {
    return reply.send({
      success: true,
      status: 'ok'
    })
  })
}
```

**注意**：前端路由保護、API 請求保護相關範例由 Story 3.4 統一實作。

---

## 參考資料

- **Story 3.1**: 使用者認證系統（前置 Story）
- **Fastify 認證文件**: https://www.fastify.io/docs/latest/Guides/Authentication/
- **Next.js 路由保護**: https://nextjs.org/docs/authentication
- **JWT 認證最佳實踐**: https://jwt.io/introduction

---

## 相關決策

- 見 `docs/backlog/epics/epic-3-admin-management-system.md` - Epic 3 範圍說明
- 見 `docs/memory/architecture/current.md` - 系統架構文件

---

## 注意事項

1. **認證流程**
   - 必須先完成 Story 3.1（使用者認證系統）
   - 認證中間件必須正確處理 JWT Token 和 Session ID
   - 必須正確處理 Token 過期和 Session 過期

2. **資料隔離**
   - 本 Story 只實作基礎的資料過濾（使用者只能看到自己的資料）
   - 完整的資料隔離需要 Story 3.3 實作多租戶資料模型
   - 必須確保使用者無法訪問其他使用者的資料

3. **前端部分**
   - 前端路由保護、API 請求保護由 Story 3.4 統一實作
   - 本 Story 只實作後端部分（認證中間件擴展、API 端點保護）

4. **API 保護**
   - 必須正確保護所有需要登入的 API 端點
   - 必須確保公開端點不受影響
   - 必須正確處理 401 錯誤

5. **與現有系統的整合**
   - 不影響現有的 Shopline OAuth 流程
   - 不影響現有的 Webhook 接收（使用簽名驗證）
   - 為未來的多租戶資料隔離做準備（Story 3.3）

---

**最後更新**: 2025-11-06

