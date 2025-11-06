# Story R1.0: Zustand 階段 1 核心實作

**所屬 Refactor**: [Refactor 1: 狀態管理階段 1 基礎架構（Phase 1 準備）](../refactors/refactor-1-state-management-phase1.md)  
**狀態**: ✅ completed  
**建立日期**: 2025-11-04  
**當前 Run**: run-2025-11-05-01  
**對應 Roadmap**: Phase 1 準備  
**已知問題**: [Issue 2025-11-06-001: URL 參數與 Zustand Store 同步機制導致閃跳問題](../issues/issue-2025-11-06-001.md)

---

## 前情提要

### 架構分析與決策（已完成 - Run 4）

**問題背景**：
- Handle/Token 狀態管理分散在多個頁面（`index.tsx`, `admin-api-test.tsx`, `webhook-test.tsx`）
- 沒有統一的狀態管理機制
- 異步操作競態問題：操作進行中切換商店可能導致 token/handle 不一致
- 多步驟操作不一致：如 `createOrder` 需要多個步驟，中途切換商店會混用不同 token

**決策過程**：
- 分析多種狀態管理方案（Context API、Redux、Zustand、React Query）
- 評估 Agent-Based 開發視角（文件維護性、協作成本、重構成本）
- 考慮 Roadmap 的長期需求（Phase 1-3.1 適用階段 1，Phase 3.2 觸發階段 2）

**最終決策**：
- ✅ **採用方案 A（Zustand 漸進式 → Redux）階段 1**
- 技術方案：Zustand + 後端 Session + Redis
- 適用範圍：Phase 1、Phase 2、Phase 3.1
- 觸發階段 2：Phase 3.2 Job 管理系統開始前

**決策記錄**：
- 詳細決策：見 `docs/memory/decisions/state-management.md`
- 討論過程：見 `docs/archive/discussions/state-management-strategy-2025-11-04.md`
- 問題分析：見 `docs/archive/discussions/architecture-handle-token-management.md`

---

## Story 描述

實作 Zustand 階段 1 基礎架構，為 Phase 1（多租戶與多平台管理）提供狀態管理基礎。包含：Zustand 統一狀態管理、後端 Session 管理、Redis 快取整合。

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（使用者 Session、權限管理）
- Phase 1.2: 多商店管理（商店選擇狀態管理）
- Phase 1.3: 多 API 類型支援（API 類型管理）

---

## 🚨 前置條件（需要 Human 先處理）

### 1. Redis 環境設定

**需要 Human 提供**：
- [x] Redis 服務（已使用 Render Internal Redis）
- [x] Redis 連線資訊（已取得）
- [x] Redis 環境變數設定方式（見下方說明）

**環境變數需求**（需要 Human 在 Render 設定）：
```bash
# Render Internal Redis（已設定）
REDIS_URL=redis://red-d406i56uk2gs739qn8ig:6379
```

**設定步驟**（已完成）：
1. ✅ Render Redis 已建立
2. ✅ Redis URL 已取得：`redis://red-d406i56uk2gs739qn8ig:6379`
3. ⏳ 在 Render Dashboard → connector 專案 → Environment 設定 `REDIS_URL` 環境變數
4. ⏳ 重新部署後端服務

**注意**：
- Render Internal Redis 只能在 Render 服務內部使用
- 不需要密碼驗證，直接使用 Internal URL 即可
- 詳細設定見 `docs/reference/guides/ENV_SETUP_GUIDE.md`

### 2. 後端環境變數確認

**需要確認以下環境變數已設定**（見 `docs/reference/guides/ENV_SETUP_GUIDE.md`）：
- [x] `DATABASE_URL` - Neon PostgreSQL 連線（正式環境已設定）
- [x] `JWT_SECRET` - JWT 簽名密鑰（正式環境已設定）
- [x] `SHOPLINE_*` - Shopline API 憑證（正式環境已設定）
- [x] `REDIS_URL` - Redis 連線（已提供：`redis://red-d406i56uk2gs739qn8ig:6379`）

**正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

### 3. 前端環境變數確認

**需要確認以下環境變數已設定**：
- [x] `NEXT_PUBLIC_BACKEND_URL` - 後端 API URL（正式環境：`https://connector-o5hx.onrender.com`）

**正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

---

## 技術需求

### 前端狀態管理（Zustand）

#### 1. Zustand Store 結構

**檔案位置**：`frontend/stores/useStoreStore.ts`

**狀態欄位**：
```typescript
interface StoreState {
  // 當前選中的商店 Handle
  selectedHandle: string | null
  
  // 操作鎖定的 Handle（操作進行中時不允許切換）
  lockedHandle: string | null
  
  // 當前選中的平台（Phase 2 使用，目前可選實作）
  selectedPlatform: string | null
  
  // 當前選中的 API 類型（Phase 1.3 使用，目前可選實作）
  selectedAPI: string | null
  
  // Actions
  setSelectedHandle: (handle: string | null) => void
  lockHandle: (handle: string) => void
  unlockHandle: () => void
  setSelectedPlatform: (platform: string | null) => void
  setSelectedAPI: (api: string | null) => void
}
```

**關鍵功能**：
- `lockHandle(handle)`: 鎖定 handle（操作開始時調用）
- `unlockHandle()`: 解鎖 handle（操作完成時調用）
- `setSelectedHandle(handle)`: 設置選中的 handle，如果 `lockedHandle` 存在則阻止切換

#### 2. 遷移現有頁面

**需要遷移的頁面**：
- `frontend/pages/index.tsx` - 使用 `storeHandle` state
- `frontend/pages/admin-api-test.tsx` - 使用 `selectedHandle` state
- `frontend/pages/webhook-test.tsx` - 使用 `selectedHandle` state

**遷移步驟**：
1. 移除頁面中的 `useState` 狀態
2. 使用 `useStoreStore()` 取代
3. 更新 `useAdminAPI` Hook 使用 Zustand Store

#### 3. 更新 useAdminAPI Hook

**檔案位置**：`frontend/hooks/useAdminAPI.ts`

**修改內容**：
- 移除 Hook 內的 `lockHandle`/`unlockHandle` 邏輯
- 使用 Zustand Store 的 `lockHandle`/`unlockHandle`
- 確保操作開始時鎖定，完成時解鎖

### 後端狀態管理（Session + Redis）

#### 1. Redis 客戶端整合

**依賴安裝**：
```bash
cd backend
npm install ioredis
npm install --save-dev @types/ioredis
```

**檔案位置**：`backend/src/utils/redis.ts`

**功能需求**：
- Redis 客戶端初始化
- 連線錯誤處理
- 環境變數讀取（`REDIS_URL` 或 `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`）

**範例程式碼**：
```typescript
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      redis = new Redis(redisUrl)
    } else {
      // 使用分離的環境變數
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      })
    }
    
    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })
  }
  return redis
}
```

#### 2. Session 管理 API

**檔案位置**：`backend/src/routes/session.ts`

**API 端點**：
- `GET /api/session/:handle` - 取得 Session（包含 token 快取）
- `POST /api/session/:handle/lock` - 鎖定 Session（操作開始）
- `DELETE /api/session/:handle/lock` - 解鎖 Session（操作完成）

**Session 結構**：
```typescript
interface Session {
  handle: string
  token: string
  expiresAt: number
  locked: boolean
  lockedAt?: number
}
```

**Redis 快取策略**：
- Key 格式：`session:${handle}`
- TTL：30 分鐘（與 token 過期時間對齊）
- 內容：`{ token: string, expiresAt: number, locked: boolean }`

#### 3. Token 快取邏輯

**檔案位置**：`backend/src/services/shopline.ts`

**修改內容**：
- 在 `getStoreByHandle` 方法中加入 Redis 快取查詢
- 如果 Redis 中有快取，直接返回
- 如果沒有，查詢資料庫並寫入 Redis
- Token 過期時清除快取

**快取 Key 格式**：
- `token:${handle}` - Token 快取
- TTL：根據 `expiresAt` 計算，或預設 30 分鐘

---

## 實作步驟

### Phase 1: 前端 Zustand 實作

1. **安裝 Zustand**
   ```bash
   cd frontend
   npm install zustand
   ```

2. **建立 Zustand Store**
   - 建立 `frontend/stores/useStoreStore.ts`
   - 實作狀態欄位和 Actions
   - 加入 `lockHandle`/`unlockHandle` 邏輯

3. **遷移頁面狀態**
   - 更新 `frontend/pages/index.tsx`
   - 更新 `frontend/pages/admin-api-test.tsx`
   - 更新 `frontend/pages/webhook-test.tsx`

4. **更新 useAdminAPI Hook**
   - 移除內部的 lock/unlock 邏輯
   - 使用 Zustand Store 的方法

### Phase 2: 後端 Redis 整合

1. **安裝 Redis 客戶端**
   ```bash
   cd backend
   npm install ioredis
   npm install --save-dev @types/ioredis
   ```

2. **建立 Redis 工具**
   - 建立 `backend/src/utils/redis.ts`
   - 實作 Redis 客戶端初始化

3. **實作 Token 快取**
   - 修改 `backend/src/services/shopline.ts`
   - 在 `getStoreByHandle` 中加入快取邏輯

### Phase 3: 後端 Session 管理（可選，Phase 2 使用）

**注意**：Session 管理 API 在階段 1 中可選實作，因為：
- Phase 1 主要解決前端狀態管理問題
- Session 管理主要用於 Phase 2 的多裝置登入

**如果實作**：
1. 建立 `backend/src/routes/session.ts`
2. 實作 Session 管理 API
3. 整合到 Fastify 路由

---

## 驗收標準

### Agent 功能測試

#### 前端測試
- [x] Zustand Store 建立完成
- [x] 所有頁面成功遷移到 Zustand Store
  - [x] `frontend/pages/index.tsx` - 已遷移
  - [x] `frontend/pages/admin-api-test.tsx` - 已遷移並加入鎖定檢查
  - [x] `frontend/pages/webhook-test.tsx` - 已遷移並加入鎖定檢查
- [x] `lockHandle`/`unlockHandle` 功能正常（在 `useAdminAPI` Hook 中實作）
- [x] 切換商店時，如果 `lockedHandle` 存在，會阻止切換並顯示提示
- [x] TypeScript 型別檢查通過（前端編譯成功）
- [x] 無 ESLint 錯誤

#### 後端測試
- [x] Redis 客戶端初始化成功（`backend/src/utils/redis.ts`）
- [x] Redis 連線正常（支援環境變數 `REDIS_URL` 或分離的 `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`）
- [x] Token 快取功能正常
  - [x] 第一次查詢從資料庫讀取並寫入 Redis
  - [x] 第二次查詢從 Redis 讀取（如果快取存在且未過期）
  - [x] Token 過期時清除快取
- [x] 後端 API 正常運作（無 Redis 時降級到資料庫查詢）

### User Test 驗收標準

**測試步驟**：

1. **跨頁面狀態一致性**
   - 在 `admin-api-test.tsx` 選擇商店 A
   - 切換到 `webhook-test.tsx`
   - 確認商店 A 仍然被選中
   - 切換到 `index.tsx`
   - 確認商店 A 仍然被選中

2. **操作鎖定機制**
   - 在 `admin-api-test.tsx` 選擇商店 A
   - 執行 API 操作（如 Get Store Info）
   - 在操作進行中（loading 狀態），嘗試切換商店
   - 確認無法切換（或顯示提示訊息）
   - 操作完成後，可以正常切換商店

3. **多步驟操作一致性**
   - 在 `admin-api-test.tsx` 選擇商店 A
   - 執行 `createOrder`（多步驟操作）
   - 在操作進行中，確認使用的都是商店 A 的 token
   - 操作完成後，可以切換商店

4. **Token 快取效能**（如果 Redis 已設定）
   - 執行 API 操作（如 Get Store Info）
   - 檢查後端日誌，確認第一次從資料庫讀取
   - 再次執行相同操作
   - 檢查後端日誌，確認從 Redis 讀取（或觀察回應時間）

5. **既有功能運作維持正常**
   - 所有現有功能（商店列表、授權、Webhook 訂閱、Admin API 測試）正常運作
   - 無功能回退或破壞性變更
   - 所有頁面可以正常訪問和操作

---

## 程式碼範例

### Zustand Store 範例

```typescript
// frontend/stores/useStoreStore.ts
import { create } from 'zustand'

interface StoreState {
  selectedHandle: string | null
  lockedHandle: string | null
  selectedPlatform: string | null
  selectedAPI: string | null
  
  setSelectedHandle: (handle: string | null) => void
  lockHandle: (handle: string) => void
  unlockHandle: () => void
  setSelectedPlatform: (platform: string | null) => void
  setSelectedAPI: (api: string | null) => void
}

export const useStoreStore = create<StoreState>((set, get) => ({
  selectedHandle: null,
  lockedHandle: null,
  selectedPlatform: null,
  selectedAPI: null,
  
  setSelectedHandle: (handle) => {
    const { lockedHandle } = get()
    if (lockedHandle && handle !== lockedHandle) {
      console.warn(`Cannot switch store: ${lockedHandle} is locked`)
      return
    }
    set({ selectedHandle: handle })
  },
  
  lockHandle: (handle) => {
    set({ lockedHandle: handle })
  },
  
  unlockHandle: () => {
    set({ lockedHandle: null })
  },
  
  setSelectedPlatform: (platform) => {
    set({ selectedPlatform: platform })
  },
  
  setSelectedAPI: (api) => {
    set({ selectedAPI: api })
  },
}))
```

### 使用範例

```typescript
// frontend/pages/admin-api-test.tsx
import { useStoreStore } from '../stores/useStoreStore'

export default function AdminAPITest() {
  const { selectedHandle, setSelectedHandle, lockHandle, unlockHandle } = useStoreStore()
  const adminAPI = useAdminAPI(selectedHandle)
  
  // ... rest of the component
}
```

### Redis 快取範例

```typescript
// backend/src/services/shopline.ts
import { getRedisClient } from '../utils/redis'

export class ShoplineService {
  async getStoreByHandle(handle: string) {
    const redis = getRedisClient()
    
    // 嘗試從 Redis 讀取
    if (redis) {
      const cached = await redis.get(`token:${handle}`)
      if (cached) {
        const store = JSON.parse(cached)
        // 檢查是否過期
        if (store.expiresAt && new Date(store.expiresAt) > new Date()) {
          return store
        }
        // 過期則清除快取
        await redis.del(`token:${handle}`)
      }
    }
    
    // 從資料庫讀取
    const store = await prisma.store.findUnique({
      where: { handle }
    })
    
    if (!store) {
      throw new Error(`Store not found: ${handle}`)
    }
    
    // 寫入 Redis 快取
    if (redis) {
      await redis.setex(
        `token:${handle}`,
        1800, // 30 分鐘
        JSON.stringify({
          id: store.id,
          handle: store.handle,
          accessToken: store.accessToken,
          expiresAt: store.expiresAt,
        })
      )
    }
    
    return store
  }
}
```

---

## 參考資料

- **決策文件**：`docs/memory/decisions/state-management.md`
- **問題分析**：`docs/archive/discussions/architecture-handle-token-management.md`
- **Zustand 文件**：https://github.com/pmndrs/zustand
- **ioredis 文件**：https://github.com/luin/ioredis
- **Render Redis 文件**：https://render.com/docs/redis
- **環境設定指南**：`docs/reference/guides/ENV_SETUP_GUIDE.md`（包含 Redis 設定說明）

---

## 相關決策

- 見 `docs/memory/decisions/state-management.md`
- 階段 1 適用範圍：Phase 1、Phase 2、Phase 3.1
- 階段 2 觸發條件：Phase 3.2 Job 管理系統開始前

---

**最後更新**: 2025-11-06

---

## ✅ 完成狀態

### User Test 結果
- ✅ 測試 1: 跨頁面狀態一致性測試 - 通過
- ✅ 測試 2: 操作鎖定機制測試 - 通過
- ✅ 測試 3: URL 參數與 Zustand Store 同步機制 - 通過（已修復閃跳問題）

### 推上線狀態
- ✅ 代碼完成並測試通過
- ✅ 準備推上線
