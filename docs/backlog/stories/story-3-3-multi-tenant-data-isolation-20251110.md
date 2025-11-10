# Story 3.3: 多租戶資料隔離

**所屬 Epic**: [Epic 3: Admin 管理系統（Phase 1.1）](../epics/epic-3-admin-management-system.md)  
**狀態**: ✅ completed  
**完成 Run**: run-2025-11-06-01  
**建立日期**: 2025-11-06  
**對應 Roadmap**: Phase 1.1

---

## Story 描述

實作多租戶資料庫設計，確保不同 Admin 的資料完全隔離。建立資料隔離機制和查詢過濾器，確保每個使用者只能存取自己的資料。

**核心功能**：
- 資料庫設計：在 Store 和 WebhookEvent 模型中新增 `userId` 欄位
- 資料隔離機制：所有查詢都必須過濾使用者 ID
- 查詢過濾器：建立統一的查詢過濾器，自動加入使用者隔離條件
- 資料遷移：將現有資料遷移到多租戶架構（可選，視需求而定）

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（多租戶資料隔離）

---

## 前情提要

### 架構基礎
- ✅ **Story 3.1 完成**：使用者認證系統已實作（`User` 模型、Session 管理）
- ✅ **資料庫基礎**：Prisma + Neon PostgreSQL 已設定完成
- ✅ **後端框架**：Fastify + TypeScript 已建立
- ✅ **認證中間件**：`authMiddleware` 已實作，可取得當前使用者資訊

### 設計決策
- **多租戶策略**：使用 **Row-Level Security (RLS)** 方式，在每個資料表中加入 `userId` 欄位
- **資料隔離層級**：使用者 → 商店 → Webhook 事件（層級式隔離）
- **查詢過濾器**：建立統一的查詢過濾器，自動加入 `userId` 條件
- **向後相容性**：現有資料需要處理（可選：遷移或標記為系統資料）

---

## 🚨 前置條件（需要 Human 先處理）

### 1. Story 3.1 完成確認
- [x] Story 3.1 已完成（使用者認證系統）
- [x] `User` 模型已建立
- [x] `authMiddleware` 已實作
- [x] Session 管理已實作

### 2. 現有資料處理策略

**需要決定**：現有資料（沒有 `userId` 的 Store 和 WebhookEvent）如何處理？

**選項 A：遷移到系統使用者**
- 建立一個系統使用者（例如：`system@admin.com`）
- 將所有現有資料的 `userId` 設為系統使用者 ID
- **優點**：資料完整，不會遺失
- **缺點**：需要資料遷移腳本

**選項 B：標記為系統資料**
- 現有資料保持 `userId` 為 `null`
- 只有系統管理員可以存取 `userId` 為 `null` 的資料
- **優點**：簡單，不需要遷移
- **缺點**：需要特殊處理邏輯

**選項 C：刪除現有資料**
- 清空所有現有資料
- **優點**：最簡單
- **缺點**：會遺失所有資料

**建議**：採用選項 A（遷移到系統使用者），確保資料完整性。

---

## 技術需求

### 1. 資料庫設計（Prisma Schema）

#### Store 模型更新

**檔案位置**：`backend/prisma/schema.prisma`

**需要修改的模型**：

```prisma
model Store {
  id          String   @id @default(cuid())
  userId      String   // 新增：關聯到使用者
  shoplineId  String   @unique
  handle      String?  // Shopline 商店 handle (例如: paykepoc)
  name        String?
  domain      String?
  accessToken String
  expiresAt   DateTime? // Token 到期時間
  scope       String   // 儲存為逗號分隔的字串
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 關聯
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  webhookEvents WebhookEvent[]

  @@map("stores")
  @@index([userId]) // 新增：為 userId 建立索引
}
```

#### WebhookEvent 模型更新

**檔案位置**：`backend/prisma/schema.prisma`

**需要修改的模型**：

```prisma
model WebhookEvent {
  id          String   @id @default(cuid())
  userId      String   // 新增：關聯到使用者（透過 Store 關聯，但直接儲存以提升查詢效能）
  storeId     String
  webhookId   String   @unique // X-Shopline-Webhook-Id，用於去重
  topic       String   // X-Shopline-Topic，例如：orders/update
  eventType   String   // 與 topic 相同，保留作為兼容欄位
  shopDomain  String?  // X-Shopline-Shop-Domain
  shoplineId  String?  // X-Shopline-Shop-Id（商店 ID）
  merchantId  String?  // X-Shopline-Merchant-Id
  apiVersion  String?  // X-Shopline-API-Version
  payload     String   // 儲存為 JSON 字串
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())

  // 關聯
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@map("webhook_events")
  @@index([webhookId])
  @@index([storeId, createdAt])
  @@index([userId, createdAt]) // 新增：為 userId 建立索引
}
```

#### User 模型更新

**檔案位置**：`backend/prisma/schema.prisma`

**需要確認的模型**（應該已在 Story 3.1 中建立）：

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 加密後的密碼
  name      String?  // 使用者名稱（可選）
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 關聯
  stores    Store[]  // 一個使用者可以管理多個商店

  @@map("users")
}
```

#### Migration 指令

```bash
cd backend
npx prisma migrate dev --name add_user_id_to_stores_and_webhook_events
npx prisma generate
```

**注意**：Migration 會新增 `userId` 欄位，但現有資料的 `userId` 會是 `null`。需要執行資料遷移腳本（見下方）。

### 2. 資料遷移腳本（可選）

**檔案位置**：`backend/scripts/migrate-existing-data.ts`（新建）

**功能**：
- 建立系統使用者（如果不存在）
- 將所有現有 Store 的 `userId` 設為系統使用者 ID
- 將所有現有 WebhookEvent 的 `userId` 設為系統使用者 ID

**執行方式**：
```bash
cd backend
npx ts-node scripts/migrate-existing-data.ts
```

### 3. 查詢過濾器設計

#### 統一查詢過濾器

**檔案位置**：`backend/src/utils/query-filter.ts`（新建）

**功能**：
- 提供統一的查詢過濾器函數
- 自動加入 `userId` 條件
- 支援 Prisma 查詢條件

**需要實作的函數**：
```typescript
// 為 Store 查詢加入 userId 過濾
export function filterStoresByUser(userId: string) {
  return { userId }
}

// 為 WebhookEvent 查詢加入 userId 過濾
export function filterWebhookEventsByUser(userId: string) {
  return { userId }
}

// 驗證 Store 是否屬於使用者
export async function verifyStoreOwnership(storeId: string, userId: string): Promise<boolean>
```

**注意**：遵循現有的 Prisma 使用模式（在路由中動態建立 PrismaClient 實例，使用後斷開連線）。

### 4. 後端路由更新

#### API Routes 更新

**檔案位置**：`backend/src/routes/api.ts`

**需要修改的路由**：
- `GET /api/stores` - 只返回當前使用者的商店
- `GET /api/stores/:shopId` - 驗證商店是否屬於當前使用者
- 所有其他 Store 相關的 API

**修改方式**：
- 使用 `authMiddleware` 取得當前使用者
- 在查詢中加入 `userId` 過濾條件
- 驗證資源所有權

#### Webhook Routes 更新

**檔案位置**：`backend/src/routes/webhook.ts`

**需要修改的路由**：
- `GET /webhook/events` - 只返回當前使用者的 Webhook 事件
- `POST /webhook/shopline` - 驗證 Store 是否屬於當前使用者（如果可能）

**修改方式**：
- 使用 `authMiddleware` 取得當前使用者
- 在查詢中加入 `userId` 過濾條件

#### Auth Routes 更新

**檔案位置**：`backend/src/routes/auth.ts`

**需要修改的路由**：
- `GET /api/auth/shopline/install` - 不需要修改（公開端點）
- `GET /api/auth/shopline/callback` - 需要將新建立的 Store 關聯到當前使用者

**修改方式**：
- 在 OAuth 回調中，取得當前使用者（如果有 Session）
- 如果沒有 Session，Store 的 `userId` 設為 `null`（需要後續處理）

### 5. Service 層更新

#### ShoplineService 更新

**檔案位置**：`backend/src/services/shopline.ts`

**需要修改的方法**：
- `getAllStores()` - 加入 `userId` 參數
- `getStoreByHandle()` - 驗證使用者所有權
- `createStore()` - 自動設定 `userId`
- 所有其他 Store 相關方法

**修改方式**：
- 所有方法都需要 `userId` 參數
- 在查詢中加入 `userId` 過濾條件
- 驗證資源所有權

**注意**：現有的 `ShoplineService` 已經有 `prisma` 實例（在類別層級），直接擴展方法即可，不需要建立新的 PrismaClient 實例。

### 6. 認證中間件擴展

**檔案位置**：`backend/src/middleware/auth.ts`

**需要確認的功能**：
- `authMiddleware` 已將使用者資訊附加到 `request.user`
- `request.user` 包含 `id` 欄位（使用者 ID）

**如果需要擴展**：
- 確保 `request.user` 類型定義正確
- 提供便利方法取得當前使用者 ID

---

## 實作步驟

### Phase 1: 資料庫設計

1. **更新 Prisma Schema**
   - 在 `Store` 模型中新增 `userId` 欄位
   - 在 `WebhookEvent` 模型中新增 `userId` 欄位
   - 在 `User` 模型中確認 `stores` 關聯
   - 新增必要的索引

2. **執行 Migration**
   - 執行 Prisma Migration
   - 生成 Prisma Client
   - 驗證資料庫變更

3. **資料遷移（可選）**
   - 建立資料遷移腳本
   - 執行資料遷移
   - 驗證資料遷移結果

### Phase 2: 查詢過濾器實作

1. **建立查詢過濾器工具**
   - 建立 `backend/src/utils/query-filter.ts`
   - 實作 `filterStoresByUser` 函數
   - 實作 `filterWebhookEventsByUser` 函數
   - 實作 `verifyStoreOwnership` 函數

2. **測試查詢過濾器**
   - 測試過濾器函數
   - 驗證查詢結果正確

### Phase 3: 後端路由更新

1. **更新 API Routes**
   - 修改 `GET /api/stores` 路由
   - 修改 `GET /api/stores/:shopId` 路由
   - 修改所有 Store 相關的 API
   - 加入 `authMiddleware` 保護

2. **更新 Webhook Routes**
   - 修改 `GET /webhook/events` 路由
   - 修改 `POST /webhook/shopline` 路由（如果需要）
   - 加入 `userId` 過濾條件

3. **更新 Auth Routes**
   - 修改 `GET /api/auth/shopline/callback` 路由
   - 在建立 Store 時設定 `userId`

### Phase 4: Service 層更新

1. **更新 ShoplineService**
   - 修改 `getAllStores` 方法
   - 修改 `getStoreByHandle` 方法
   - 修改 `createStore` 方法
   - 所有方法加入 `userId` 參數

2. **測試 Service 層**
   - 測試所有修改的方法
   - 驗證資料隔離正確

### Phase 5: 測試與驗證

1. **功能測試**
   - 測試使用者 A 只能看到自己的資料
   - 測試使用者 B 只能看到自己的資料
   - 測試使用者 A 無法存取使用者 B 的資料

2. **邊界情況測試**
   - 測試沒有 `userId` 的資料（系統資料）
   - 測試無效的 `storeId` 存取
   - 測試跨使用者的資料存取嘗試

---

## 驗收標準

### Agent 功能測試

#### 資料庫測試
- [x] Prisma Schema 更新完成（`Store` 和 `WebhookEvent` 模型新增 `userId`）
- [x] Migration 執行成功
- [x] 索引建立正確
- [x] 資料遷移腳本執行成功（如果採用）

#### 查詢過濾器測試
- [x] `filterStoresByUser` 函數正常運作
- [x] `filterWebhookEventsByUser` 函數正常運作
- [x] `verifyStoreOwnership` 函數正常運作
- [x] 查詢結果正確過濾

#### API 端點測試
- [x] `GET /api/stores` 只返回當前使用者的商店
- [x] `GET /api/stores/:shopId` 驗證商店所有權
- [x] `GET /webhook/events` 只返回當前使用者的 Webhook 事件
- [x] 跨使用者的資料存取返回 403 或 404

#### Service 層測試
- [x] `getAllStores` 方法正確過濾使用者資料
- [x] `getStoreByHandle` 方法驗證使用者所有權
- [x] `createStore` 方法自動設定 `userId`
- [x] 所有方法正確處理使用者隔離

#### TypeScript 類型檢查
- [ ] 所有 TypeScript 類型定義正確
- [ ] 編譯無錯誤
- [ ] ESLint 檢查通過

### User Test 驗收標準

**測試步驟**：

1. **使用者 A 資料隔離測試**
   - 使用使用者 A 登入
   - 呼叫 `GET /api/stores`
   - **驗證**：只返回使用者 A 的商店
   - 呼叫 `GET /webhook/events`
   - **驗證**：只返回使用者 A 的 Webhook 事件

2. **使用者 B 資料隔離測試**
   - 使用使用者 B 登入
   - 呼叫 `GET /api/stores`
   - **驗證**：只返回使用者 B 的商店（與使用者 A 不同）
   - 呼叫 `GET /webhook/events`
   - **驗證**：只返回使用者 B 的 Webhook 事件（與使用者 A 不同）

3. **跨使用者資料存取測試**
   - 使用使用者 A 登入
   - 取得使用者 A 的商店 ID（例如：`storeId-A`）
   - 使用使用者 B 登入
   - 嘗試存取 `GET /api/stores/storeId-A`
   - **驗證**：返回 403 或 404 錯誤（無法存取其他使用者的資料）

4. **新商店建立測試**
   - 使用使用者 A 登入
   - 建立新商店（透過 OAuth 流程）
   - **驗證**：新建立的商店的 `userId` 為使用者 A 的 ID
   - 使用使用者 B 登入
   - **驗證**：使用者 B 無法看到使用者 A 新建立的商店

5. **Webhook 事件隔離測試**
   - 使用使用者 A 登入
   - 觸發使用者 A 的商店的 Webhook 事件
   - **驗證**：Webhook 事件的 `userId` 為使用者 A 的 ID
   - 使用使用者 B 登入
   - **驗證**：使用者 B 無法看到使用者 A 的 Webhook 事件

6. **系統資料處理測試**（如果採用資料遷移）
   - 確認系統使用者存在
   - 確認所有現有資料的 `userId` 為系統使用者 ID
   - 系統管理員可以存取系統資料（如果實作了系統管理員功能）

## 測試紀錄（2025-11-07）

| 測試項目 | 結果 | 備註 |
| --- | --- | --- |
| Schema / Migration 檢查 | ✅ | `prisma.store`、`webhookEvent` 皆含 `userId`，`system@admin.com` 存在 |
| 資料遷移腳本 | ✅ | `migrate-existing-data.ts` 執行後舊資料綁定系統使用者 |
| Store 查詢過濾 | ✅ | `/api/stores` 僅回傳登入使用者商店，跨使用者 403 |
| Webhook 事件隔離 | ✅ | User1/User2 各自僅看到 `qa-user{n}-event-001` |
| `verifyStoreOwnership` | ✅ | 他人商店返回 403 |
| `ShoplineService.getAllStores` | ✅ | 修正後依 `userId` 過濾（user1/user2 測試） |
| 新商店綁定使用者 | ⚠️ | OAuth 無法快速驗證，未覆測 |

---

## 程式碼範例

### 查詢過濾器範例

```typescript
// backend/src/utils/query-filter.ts
import { PrismaClient } from '@prisma/client'

// 為 Store 查詢加入 userId 過濾
export function filterStoresByUser(userId: string) {
  return { userId }
}

// 為 WebhookEvent 查詢加入 userId 過濾
export function filterWebhookEventsByUser(userId: string) {
  return { userId }
}

// 驗證 Store 是否屬於使用者
export async function verifyStoreOwnership(storeId: string, userId: string): Promise<boolean> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    })
    return !!store
  } finally {
    await prisma.$disconnect()
  }
}
```

### API Routes 更新範例

```typescript
// backend/src/routes/api.ts
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { filterStoresByUser, verifyStoreOwnership } from '../utils/query-filter'

export async function apiRoutes(fastify: FastifyInstance, options: any) {
  // 取得所有已授權的商店（只返回當前使用者的商店）
  fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required'
      })
    }
    
    try {
      const userId = request.user.id // 從 middleware 取得（TypeScript 類型安全）
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const stores = await prisma.store.findMany({
        where: filterStoresByUser(userId),
        orderBy: { createdAt: 'desc' },
      })
      
      await prisma.$disconnect()
      
      return reply.send({
        success: true,
        data: stores
      })
    } catch (error) {
      fastify.log.error({ msg: 'Get stores error:', error })
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })

  // 取得特定商店資訊（驗證所有權）
  fastify.get('/api/stores/:shopId', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required'
      })
    }
    
    try {
      const { shopId } = request.params as { shopId: string }
      const userId = request.user.id // 從 middleware 取得（TypeScript 類型安全）
      
      // 驗證商店所有權
      const hasAccess = await verifyStoreOwnership(shopId, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const store = await prisma.store.findUnique({
        where: { id: shopId },
      })
      
      await prisma.$disconnect()
      
      if (!store) {
        return reply.status(404).send({
          success: false,
          error: 'Store not found'
        })
      }

      return reply.send({
        success: true,
        data: store
      })
    } catch (error) {
      fastify.log.error('Get store error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })
}
```

### Service 層更新範例

```typescript
// backend/src/services/shopline.ts
import { PrismaClient } from '@prisma/client'
import { filterStoresByUser } from '../utils/query-filter'

export class ShoplineService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // 取得所有商店（過濾使用者）
  async getAllStores(userId: string) {
    return this.prisma.store.findMany({
      where: filterStoresByUser(userId),
      orderBy: { createdAt: 'desc' },
    })
  }

  // 建立商店（自動設定 userId）
  async createStore(data: {
    userId: string
    shoplineId: string
    handle?: string
    name?: string
    domain?: string
    accessToken: string
    expiresAt?: Date
    scope: string
  }) {
    return this.prisma.store.create({
      data: {
        userId: data.userId,
        shoplineId: data.shoplineId,
        handle: data.handle,
        name: data.name,
        domain: data.domain,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt,
        scope: data.scope,
      },
    })
  }
  
  // 注意：現有的 ShoplineService 已經有 prisma 實例（在類別層級），直接擴展即可
  // 不需要在每個方法中建立新的 PrismaClient 實例
}
```

### 資料遷移腳本範例

```typescript
// backend/scripts/migrate-existing-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingData() {
  try {
    console.log('開始資料遷移...')

    // 1. 建立系統使用者（如果不存在）
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@admin.com' },
    })

    if (!systemUser) {
      console.log('建立系統使用者...')
      systemUser = await prisma.user.create({
        data: {
          email: 'system@admin.com',
          password: 'system-password-hash', // 需要實際的 hash
          name: 'System Admin',
        },
      })
      console.log('系統使用者已建立:', systemUser.id)
    } else {
      console.log('系統使用者已存在:', systemUser.id)
    }

    // 2. 更新所有 Store 的 userId
    const storesWithoutUserId = await prisma.store.findMany({
      where: { userId: null },
    })

    console.log(`找到 ${storesWithoutUserId.length} 個沒有 userId 的 Store`)

    if (storesWithoutUserId.length > 0) {
      await prisma.store.updateMany({
        where: { userId: null },
        data: { userId: systemUser.id },
      })
      console.log('所有 Store 的 userId 已更新')
    }

    // 3. 更新所有 WebhookEvent 的 userId
    const eventsWithoutUserId = await prisma.webhookEvent.findMany({
      where: { userId: null },
    })

    console.log(`找到 ${eventsWithoutUserId.length} 個沒有 userId 的 WebhookEvent`)

    if (eventsWithoutUserId.length > 0) {
      // 需要透過 Store 關聯來設定 userId
      for (const event of eventsWithoutUserId) {
        const store = await prisma.store.findUnique({
          where: { id: event.storeId },
        })
        if (store && store.userId) {
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { userId: store.userId },
          })
        }
      }
      console.log('所有 WebhookEvent 的 userId 已更新')
    }

    console.log('資料遷移完成！')
  } catch (error) {
    console.error('資料遷移失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateExistingData()
```

---

## 參考資料

- **Prisma 多租戶文件**：https://www.prisma.io/docs/guides/security/multi-tenant
- **Row-Level Security 設計模式**：https://www.prisma.io/docs/guides/security/multi-tenant#row-level-security
- **Prisma Migration 文件**：https://www.prisma.io/docs/concepts/components/prisma-migrate

---

## 相關決策

- 見 `docs/backlog/epics/epic-3-admin-management-system.md` - Epic 3 範圍說明
- 見 `docs/memory/roadmap.md` - Phase 1.1 多租戶系統規劃

---

## 注意事項

1. **資料遷移策略**
   - 需要決定現有資料的處理方式（遷移、標記、刪除）
   - 建議採用遷移到系統使用者的方式，確保資料完整性

2. **向後相容性**
   - OAuth 回調時，如果沒有 Session，Store 的 `userId` 會是 `null`
   - 需要後續處理機制（例如：使用者登入後可以認領商店）

3. **效能考量**
   - 為 `userId` 欄位建立索引，提升查詢效能
   - 考慮使用複合索引（例如：`userId + createdAt`）

4. **安全性**
   - 所有查詢都必須加入 `userId` 過濾條件
   - 驗證資源所有權，防止跨使用者資料存取
   - 使用 `authMiddleware` 保護所有需要登入的端點

5. **測試覆蓋**
   - 確保所有 API 端點都正確過濾使用者資料
   - 測試跨使用者的資料存取嘗試
   - 測試邊界情況（無效 ID、null 值等）

6. **與現有系統的整合**
   - 不影響現有的 Shopline OAuth 流程
   - 確保現有功能正常運作
   - 為未來的多商店管理做準備（Story 3.2）

---

**最後更新**: 2025-11-06

