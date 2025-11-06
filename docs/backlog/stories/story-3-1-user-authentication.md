# Story 3.1: 使用者認證系統

**所屬 Epic**: [Epic 3: Admin 管理系統（Phase 1.1）](../epics/epic-3-admin-management-system.md)  
**狀態**: ⏳ planned  
**建立日期**: 2025-11-06  
**對應 Roadmap**: Phase 1.1

---

## Story 描述

實作使用者認證系統，支援使用者註冊、登入、登出功能。建立基礎的使用者管理機制，為多租戶系統提供認證基礎。

**核心功能**：
- 使用者註冊（建立新帳號）
- 使用者登入（驗證身份）
- 使用者登出（清除 Session）
- Session 管理（使用 Redis 儲存）
- JWT Token 生成與驗證

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（使用者認證、Session 管理）

---

## 前情提要

### 架構基礎
- ✅ **Refactor 1 完成**：Redis 基礎設施已整合（`backend/src/utils/redis.ts`）
- ✅ **資料庫基礎**：Prisma + Neon PostgreSQL 已設定完成
- ✅ **後端框架**：Fastify + TypeScript 已建立
- ✅ **Session 基礎設施**：Redis 已整合，可直接使用 `getRedisClient()`

### 設計決策
- **Session 儲存**：使用 Redis（高效能、支援 TTL、多伺服器部署）
- **認證機制**：JWT + Redis Session（JWT 用於 Token，Redis 用於 Session 管理）
- **密碼加密**：使用 bcrypt（業界標準）
- **Session 格式**：`session:${sessionId}`，內容包含 `userId`、`loginTime`、`expiresAt`

---

## 🚨 前置條件（需要 Human 先處理）

### 1. Redis 環境確認
- [x] Redis 已整合（Refactor 1 Story R1.0 完成）
- [x] Redis 環境變數已設定（`REDIS_URL`）
- [x] Redis 客戶端已可用（`backend/src/utils/redis.ts`）

### 2. 環境變數需求

**後端環境變數**（需要確認已設定）：
```bash
DATABASE_URL=postgresql://...  # Neon PostgreSQL（已設定）
REDIS_URL=redis://...          # Redis 連線（已設定）
JWT_SECRET=...                 # JWT 簽名密鑰（已設定，共用）
```

**前端環境變數**（需要確認已設定）：
```bash
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com  # 後端 API URL（已設定）
```

---

## 技術需求

### 1. 資料庫設計（Prisma Schema）

#### User 模型

**檔案位置**：`backend/prisma/schema.prisma`

**需要新增的模型**：

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 加密後的密碼
  name      String?  // 使用者名稱（可選）
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 關聯（未來擴展）
  stores    Store[]  // 一個使用者可以管理多個商店（Phase 1.2）

  @@map("users")
}
```

**Schema 變更**：
- 新增 `User` 模型
- `Store` 模型新增 `userId` 欄位（Phase 1.2 使用，本 Story 可選）

#### Migration 指令

```bash
cd backend
npx prisma migrate dev --name add_user_model
npx prisma generate
```

### 2. Session 管理設計（Redis）

#### Session 結構

**Redis Key 格式**：`session:${sessionId}`

**Session Value 結構**（JSON）：
```typescript
interface Session {
  userId: string      // 使用者 ID
  email: string       // 使用者 Email（方便查詢）
  loginTime: number   // 登入時間戳（毫秒）
  expiresAt: number   // 過期時間戳（毫秒）
}
```

**Session ID 生成**：
- 使用 `crypto.randomBytes(32).toString('hex')` 生成 64 字元的隨機字串
- 或使用 `uuid` 函式庫生成 UUID

#### Session TTL 設定

- **預設過期時間**：7 天（604800 秒）
- **Redis TTL**：使用 `SETEX` 設定自動過期
- **過期處理**：Redis 自動清除，無需手動清理

#### Session 操作函數

**檔案位置**：`backend/src/utils/session.ts`（新建）

**需要實作的函數**：
```typescript
// 建立 Session
async function createSession(userId: string, email: string): Promise<string>

// 取得 Session
async function getSession(sessionId: string): Promise<Session | null>

// 刪除 Session
async function deleteSession(sessionId: string): Promise<void>

// 驗證 Session（檢查是否存在且未過期）
async function verifySession(sessionId: string): Promise<Session | null>
```

**重要**：使用 `getRedisClient()` 函數（Refactor 1 成果），支援降級處理（Redis 不可用時返回 null）。

### 3. JWT Token 設計

#### JWT Payload 結構

```typescript
interface JWTPayload {
  userId: string      // 使用者 ID
  email: string       // 使用者 Email
  iat: number        // 發行時間
  exp: number        // 過期時間
}
```

#### JWT 設定

- **簽名算法**：HS256（使用 `JWT_SECRET`）
- **過期時間**：7 天（與 Session 一致）
- **用途**：前端儲存 Token，用於 API 請求驗證

#### JWT 操作函數

**檔案位置**：`backend/src/utils/jwt.ts`（新建）

**需要實作的函數**：
```typescript
// 生成 JWT Token
function generateToken(userId: string, email: string): string

// 驗證 JWT Token
function verifyToken(token: string): JWTPayload | null

// 解析 JWT Token（不驗證）
function decodeToken(token: string): JWTPayload | null
```

### 4. 密碼加密與驗證

#### bcrypt 設定

**依賴安裝**：
```bash
cd backend
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**加密設定**：
- **Salt Rounds**：10（安全與效能平衡）
- **密碼長度要求**：至少 8 字元（前端驗證）

**密碼操作函數**：

**檔案位置**：`backend/src/utils/password.ts`（新建）

**需要實作的函數**：
```typescript
// 加密密碼
async function hashPassword(password: string): Promise<string>

// 驗證密碼
async function verifyPassword(password: string, hash: string): Promise<boolean>
```

### 5. API 端點設計

#### 註冊 API

**POST /api/auth/register**

**Request Body**：
```typescript
{
  email: string      // 必填，Email 格式驗證
  password: string   // 必填，至少 8 字元
  name?: string      // 選填，使用者名稱
}
```

**Response**：
```typescript
{
  success: boolean
  user?: {
    id: string
    email: string
    name: string | null
  }
  error?: string
  message?: string
}
```

#### 登入 API

**POST /api/auth/login**

**Request Body**：
```typescript
{
  email: string      // 必填
  password: string   // 必填
}
```

**Response**：
```typescript
{
  success: boolean
  token?: string      // JWT Token
  sessionId?: string  // Session ID（用於 Cookie）
  user?: {
    id: string
    email: string
    name: string | null
  }
  error?: string
  message?: string
}
```

#### 登出 API

**POST /api/auth/logout**

**Request Headers**：
- `Authorization: Bearer ${token}` 或 `Cookie: sessionId=${sessionId}`

**Response**：
```typescript
{
  success: boolean
  message?: string
  error?: string
}
```

#### 驗證 Session API

**GET /api/auth/me**

**Request Headers**：
- `Authorization: Bearer ${token}` 或 `Cookie: sessionId=${sessionId}`

**Response**：
```typescript
{
  success: boolean
  user?: {
    id: string
    email: string
    name: string | null
  }
  error?: string
}
```

### 6. 後端路由實作

**檔案位置**：`backend/src/routes/auth.ts`（擴展現有檔案）

**需要新增的路由**：
- `POST /api/auth/register` - 使用者註冊
- `POST /api/auth/login` - 使用者登入
- `POST /api/auth/logout` - 使用者登出
- `GET /api/auth/me` - 取得當前使用者資訊

**注意**：現有的 `/api/auth/shopline/*` 路由保持不變（Shopline OAuth 流程）

### 7. 認證中間件

**檔案位置**：`backend/src/middleware/auth.ts`（新建）

**功能**：
- 驗證 JWT Token 或 Session ID
- 將使用者資訊附加到 `request.user`
- 用於保護需要登入的 API 端點

**TypeScript 類型擴展**：

**檔案位置**：`backend/src/types/fastify.d.ts`（新建，如果不存在）

**需要定義的類型**：
```typescript
import { FastifyRequest } from 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
    }
    sessionId?: string
  }
}
```

**使用方式**：
```typescript
fastify.get('/api/protected', { preHandler: [authMiddleware] }, async (request, reply) => {
  const user = request.user // 已通過認證的使用者（TypeScript 類型安全）
  // ...
})
```

### 8. 前端整合（由 Story 3.4 統一實作）

**本 Story 範圍**：
- **不實作前端介面**（Story 3.4 會統一實作）
- **不建立前端 API 函數**（Story 3.4 會統一實作）

**重要**：前端 API 函數和認證狀態管理由 Story 3.4 統一實作，遵循現行 Zustand 狀態管理策略。

---

## 實作步驟

### Phase 1: 資料庫設計

1. **更新 Prisma Schema**
   - 新增 `User` 模型
   - 執行 Migration
   - 生成 Prisma Client

2. **驗證資料庫變更**
   - 確認 `users` 表已建立
   - 確認欄位正確

### Phase 2: 工具函數實作

1. **密碼加密與驗證**
   - 建立 `backend/src/utils/password.ts`
   - 實作 `hashPassword` 和 `verifyPassword`

2. **JWT Token 操作**
   - 建立 `backend/src/utils/jwt.ts`
   - 實作 `generateToken`、`verifyToken`、`decodeToken`

3. **Session 管理**
   - 建立 `backend/src/utils/session.ts`
   - 實作 `createSession`、`getSession`、`deleteSession`、`verifySession`

### Phase 3: API 端點實作

1. **擴展現有 Auth Routes**
   - 在 `backend/src/routes/auth.ts` 新增註冊、登入、登出、驗證 API

2. **實作認證中間件**
   - 建立 `backend/src/middleware/auth.ts`
   - 實作 JWT 和 Session 驗證邏輯

### Phase 4: 測試與驗證

1. **後端 API 測試**
   - 測試註冊 API
   - 測試登入 API
   - 測試登出 API
   - 測試 Session 驗證 API

2. **驗證 Redis Session 儲存**
   - 確認 Session 正確儲存到 Redis
   - 確認 TTL 設定正確
   - 確認過期自動清除

3. **驗證密碼加密**
   - 確認密碼正確加密
   - 確認密碼驗證正確

---

## 驗收標準

### Agent 功能測試

#### 資料庫測試
- [ ] Prisma Schema 更新完成（`User` 模型）
- [ ] Migration 執行成功
- [ ] `users` 表已建立，欄位正確

#### 工具函數測試
- [ ] 密碼加密函數正常運作
- [ ] 密碼驗證函數正常運作
- [ ] JWT Token 生成正常運作
- [ ] JWT Token 驗證正常運作
- [ ] Session 建立正常運作
- [ ] Session 讀取正常運作
- [ ] Session 刪除正常運作

#### API 端點測試
- [ ] 註冊 API 正常運作
  - [ ] 成功註冊新使用者
  - [ ] Email 重複檢查
  - [ ] 密碼長度驗證
  - [ ] Email 格式驗證
- [ ] 登入 API 正常運作
  - [ ] 成功登入並返回 Token/Session
  - [ ] 錯誤密碼驗證
  - [ ] 不存在的使用者驗證
- [ ] 登出 API 正常運作
  - [ ] Session 正確清除
- [ ] 驗證 Session API 正常運作
  - [ ] 有效 Token 返回使用者資訊
  - [ ] 無效 Token 返回錯誤

#### Redis Session 測試
- [ ] Session 正確儲存到 Redis
- [ ] Session TTL 設定正確（7 天）
- [ ] Session 過期自動清除
- [ ] Session 讀取正常

#### TypeScript 類型檢查
- [ ] 所有 TypeScript 類型定義正確
- [ ] 編譯無錯誤
- [ ] ESLint 檢查通過

### User Test 驗收標準

**測試步驟**：

1. **註冊功能測試**
   - 使用 API 工具（如 Postman）測試註冊 API
   - 註冊新使用者（Email: `test@example.com`, Password: `test123456`）
   - **驗證**：返回成功訊息和使用者資訊
   - **驗證**：資料庫中 `users` 表有對應記錄
   - **驗證**：密碼已加密（不是明文）

2. **重複註冊測試**
   - 使用相同 Email 再次註冊
   - **驗證**：返回錯誤訊息（Email 已存在）

3. **登入功能測試**
   - 使用註冊的帳號登入
   - **驗證**：返回成功訊息、JWT Token、Session ID
   - **驗證**：Redis 中有對應的 Session 記錄
   - **驗證**：Session Key 格式：`session:${sessionId}`

4. **錯誤密碼登入測試**
   - 使用錯誤密碼登入
   - **驗證**：返回錯誤訊息（密碼錯誤）

5. **不存在的使用者登入測試**
   - 使用不存在的 Email 登入
   - **驗證**：返回錯誤訊息（使用者不存在）

6. **Session 驗證測試**
   - 使用登入返回的 Token 呼叫 `/api/auth/me`
   - **驗證**：返回當前使用者資訊
   - 使用無效 Token 呼叫 `/api/auth/me`
   - **驗證**：返回錯誤訊息（未授權）

7. **登出功能測試**
   - 使用有效的 Token/Session 登出
   - **驗證**：返回成功訊息
   - **驗證**：Redis 中的 Session 已清除
   - 再次使用相同的 Token 呼叫 `/api/auth/me`
   - **驗證**：返回錯誤訊息（Session 無效）

8. **Session 過期測試**
   - 登入後，手動修改 Redis 中的 Session TTL 為 1 秒
   - 等待 2 秒後，使用 Token 呼叫 `/api/auth/me`
   - **驗證**：返回錯誤訊息（Session 已過期）

---

## 程式碼範例

### Session 管理範例

```typescript
// backend/src/utils/session.ts
import { getRedisClient } from './redis'
import crypto from 'crypto'

interface Session {
  userId: string
  email: string
  loginTime: number
  expiresAt: number
}

const SESSION_TTL = 7 * 24 * 60 * 60 // 7 天（秒）

export async function createSession(userId: string, email: string): Promise<string> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，可以降級到資料庫儲存（未來擴展）
    // 目前先拋出錯誤，確保 Session 管理的一致性
    throw new Error('Redis not available')
  }

  const sessionId = crypto.randomBytes(32).toString('hex')
  const now = Date.now()
  const expiresAt = now + SESSION_TTL * 1000

  const session: Session = {
    userId,
    email,
    loginTime: now,
    expiresAt,
  }

  await redis.setex(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(session)
  )

  return sessionId
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，返回 null（降級處理）
    return null
  }

  const data = await redis.get(`session:${sessionId}`)
  if (!data) {
    return null
  }

  return JSON.parse(data) as Session
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，靜默失敗（降級處理）
    return
  }

  await redis.del(`session:${sessionId}`)
}

// 驗證 Session（檢查是否存在且未過期）
export async function verifySession(sessionId: string): Promise<Session | null> {
  const session = await getSession(sessionId)
  if (!session) {
    return null
  }
  
  // 檢查是否過期
  if (session.expiresAt < Date.now()) {
    await deleteSession(sessionId)
    return null
  }
  
  return session
}
```

### JWT Token 範例

```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_EXPIRES_IN = '7d'

export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}
```

### 密碼加密範例

```typescript
// backend/src/utils/password.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### API 端點範例

```typescript
// backend/src/routes/auth.ts
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { createSession, deleteSession } from '../utils/session'
import { authMiddleware } from '../middleware/auth'

export async function authRoutes(fastify: FastifyInstance) {
  // 註冊
  fastify.post('/api/auth/register', async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string
      password: string
      name?: string
    }

    // 驗證 Email 格式
    // 驗證密碼長度
    // 檢查 Email 是否已存在
    // 加密密碼
    // 建立使用者
    // 返回使用者資訊
  })

  // 登入
  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body as {
      email: string
      password: string
    }

    // 查詢使用者
    // 驗證密碼
    // 建立 Session
    // 生成 JWT Token
    // 返回 Token 和 Session ID
  })

  // 登出
  fastify.post('/api/auth/logout', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required'
      })
    }
    
    const sessionId = request.sessionId // 從 middleware 取得（TypeScript 類型安全）
    // 刪除 Session
    if (sessionId) {
      await deleteSession(sessionId)
    }
    // 返回成功訊息
    return reply.send({
      success: true,
      message: 'Logged out successfully'
    })
  })

  // 取得當前使用者
  fastify.get('/api/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required'
      })
    }
    
    const user = request.user // 從 middleware 取得（TypeScript 類型安全）
    // 返回使用者資訊
    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    })
  })

  // 現有的 Shopline OAuth 路由保持不變
  // ...
}
```

---

## 參考資料

- **bcrypt 文件**：https://github.com/kelektiv/node.bcrypt.js
- **jsonwebtoken 文件**：https://github.com/auth0/node-jsonwebtoken
- **Prisma Auth 文件**：https://www.prisma.io/docs/guides/security/authentication
- **Redis Session 管理**：參考現有的 Token 快取實作（`backend/src/services/shopline.ts`）

---

## 相關決策

- 見 `docs/memory/decisions/state-management.md` - Session 管理決策
- 見 `docs/backlog/epics/epic-3-admin-management-system.md` - Epic 3 範圍說明

---

## 注意事項

1. **密碼安全**
   - 密碼必須使用 bcrypt 加密，不得儲存明文
   - 密碼長度至少 8 字元（前端驗證）

2. **Session 安全**
   - Session ID 必須使用安全的隨機字串生成
   - Session 必須設定 TTL，避免永久儲存
   - Session 應該儲存在 Redis，不使用 Cookie（前端使用 Token）

3. **JWT Token 安全**
   - JWT Secret 必須使用環境變數
   - Token 過期時間必須設定
   - Token 應該儲存在前端（localStorage 或 memory）

4. **錯誤處理**
   - 所有 API 必須有適當的錯誤處理
   - 錯誤訊息不應洩露敏感資訊（如密碼錯誤時不提示是否為 Email 錯誤）

5. **與現有系統的整合**
   - 不影響現有的 Shopline OAuth 流程
   - 新增的認證 API 與現有路由分離
   - 為未來的多租戶資料隔離做準備（Story 3.3）

---

**最後更新**: 2025-11-06

