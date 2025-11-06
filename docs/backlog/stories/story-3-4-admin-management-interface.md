# Story 3.4: Admin 管理介面

**所屬 Epic**: [Epic 3: Admin 管理系統（Phase 1.1）](../epics/epic-3-admin-management-system.md)  
**狀態**: ⏳ planned  
**建立日期**: 2025-11-06  
**對應 Roadmap**: Phase 1.1

---

## Story 描述

實作 Admin 管理的前端介面，包括登入/註冊頁面、登入狀態展示、路由保護與重導向邏輯。為多租戶系統提供使用者認證的前端體驗。

**核心功能**：
- 登入頁面（使用者登入）
- 註冊頁面（新使用者註冊）
- 登入狀態展示（使用者資訊、登出按鈕）
- 路由保護（未登入重導向登入頁）
- 認證狀態管理（Zustand Store）

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（前端介面）

**範圍說明**：
- ✅ **包含**：登入/註冊頁面、登入狀態展示、路由保護、認證狀態管理（useAuthStore、ProtectedRoute）、API 請求保護（Token 自動附加）
- ✅ **統一實作**：所有前端認證相關功能（包括 Story 3.2 中描述的前端路由保護和 API 請求保護）
- ❌ **不包含**：複雜的使用者管理介面、權限管理介面（屬於未來 Story）

---

## 前情提要

### 架構基礎
- ✅ **Story 3.1 完成**：後端認證 API 已實作（註冊、登入、登出、驗證）
- ✅ **前端基礎**：Next.js + TypeScript + Tailwind CSS 已建立
- ✅ **狀態管理**：Zustand 已整合（`frontend/stores/useStoreStore.ts`）
- ✅ **API 基礎**：`frontend/lib/api.ts` 已建立（使用 axios）

### 設計決策
- **認證狀態管理**：使用 **Zustand Store**（遵循現行狀態管理策略，見 `docs/memory/decisions/state-management.md`）
- **Token 儲存**：使用 localStorage（前端儲存 JWT Token）
- **路由保護**：使用 Higher-Order Component（HOC）
- **API 請求**：在 axios 攔截器中自動附加 Token
- **登入狀態展示**：在 Header 組件中顯示使用者資訊和登出按鈕

**重要**：遵循 Refactor 1 的狀態管理策略，使用 Zustand 而非 React Context。

---

## 🚨 前置條件（需要 Human 先處理）

### 1. 後端 API 確認
- [x] Story 3.1 已完成（後端認證 API 已實作）
- [x] 後端 API 端點可用：
  - `POST /api/auth/register` - 註冊
  - `POST /api/auth/login` - 登入
  - `POST /api/auth/logout` - 登出
  - `GET /api/auth/me` - 取得當前使用者

### 2. 環境變數需求

**前端環境變數**（需要確認已設定）：
```bash
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com  # 後端 API URL（已設定）
```

---

## 技術需求

### 1. 認證狀態管理（Zustand Store）

#### Auth Store

**檔案位置**：`frontend/stores/useAuthStore.ts`（新建）

**功能**：
- 管理使用者登入狀態（遵循現行 Zustand 狀態管理策略）
- 提供登入、登出、註冊方法
- 自動從 localStorage 讀取 Token
- 自動驗證 Token 有效性

**Store 結構**：
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}
```

**使用方式**：
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore()
```

**重要**：遵循 Refactor 1 的狀態管理策略，使用 Zustand 而非 React Context（見 `docs/memory/decisions/state-management.md`）。

### 2. API 函數擴展

#### 認證 API 函數

**檔案位置**：`frontend/lib/api.ts`（擴展現有檔案）

**需要新增的函數**：
```typescript
// 註冊
export async function register(email: string, password: string, name?: string)

// 登入
export async function login(email: string, password: string)

// 登出
export async function logout()

// 取得當前使用者
export async function getCurrentUser()
```

#### Token 管理

**功能**：
- 在 axios 請求攔截器中自動附加 Token
- Token 儲存在 localStorage
- Token 過期時自動清除並重導向登入頁

**實作位置**：`frontend/lib/api.ts`（擴展現有檔案）

**Token 儲存格式**：
- Key: `auth_token`
- Value: JWT Token（字串）

### 3. 登入/註冊頁面

#### 登入頁面

**檔案位置**：`frontend/pages/login.tsx`（新建）

**功能**：
- Email 輸入欄位
- 密碼輸入欄位
- 登入按鈕
- 連結到註冊頁面
- 錯誤訊息顯示

**設計要求**：
- 使用 Tailwind CSS 樣式
- 響應式設計（手機、平板、桌面）
- 表單驗證（Email 格式、密碼長度）

#### 註冊頁面

**檔案位置**：`frontend/pages/register.tsx`（新建）

**功能**：
- Email 輸入欄位
- 密碼輸入欄位（至少 8 字元）
- 確認密碼輸入欄位
- 使用者名稱輸入欄位（選填）
- 註冊按鈕
- 連結到登入頁面
- 錯誤訊息顯示

**設計要求**：
- 使用 Tailwind CSS 樣式
- 響應式設計
- 表單驗證（Email 格式、密碼長度、密碼確認）

### 4. 登入狀態展示

#### Header 組件擴展

**檔案位置**：`frontend/components/Header.tsx`（擴展現有檔案）

**需要新增的功能**：
- 顯示使用者資訊（Email、名稱）
- 顯示登出按鈕
- 未登入時顯示登入連結

**設計要求**：
- 在 Header 右側顯示使用者資訊
- 使用下拉選單或按鈕顯示登出選項
- 保持現有導航功能不變

### 5. 路由保護

#### Protected Route HOC

**檔案位置**：`frontend/components/ProtectedRoute.tsx`（新建）

**功能**：
- 檢查使用者是否已登入
- 未登入時重導向到登入頁
- 已登入時顯示受保護的內容

**使用方式**：
```typescript
<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

#### Next.js Middleware（可選）

**檔案位置**：`frontend/middleware.ts`（新建，可選）

**功能**：
- 在頁面載入前檢查認證狀態
- 自動重導向未登入使用者到登入頁
- 保護需要登入的頁面路由

**保護的路由**：
- `/` - 首頁（商店列表）
- `/webhook-test` - Webhook 管理
- `/admin-api-test` - Admin API 測試

**公開的路由**：
- `/login` - 登入頁
- `/register` - 註冊頁

### 6. 類型定義

#### User 類型

**檔案位置**：`frontend/types.ts`（擴展現有檔案）

**需要新增的類型**：
```typescript
interface User {
  id: string
  email: string
  name: string | null
}

interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  error?: string
  message?: string
}
```

---

## 實作步驟

### Phase 1: 認證狀態管理

1. **建立 Auth Store（Zustand）**
   - 建立 `frontend/stores/useAuthStore.ts`
   - 遵循現有的 Zustand Store 模式（參考 `frontend/stores/useStoreStore.ts`）
   - 實作認證狀態管理邏輯
   - 實作登入、登出、註冊方法

2. **擴展 API 函數**
   - 在 `frontend/lib/api.ts` 新增認證相關 API 函數
   - 實作 Token 自動附加邏輯（axios 攔截器）
   - 實作 Token 儲存與讀取（localStorage）

### Phase 2: 登入/註冊頁面

1. **建立登入頁面**
   - 建立 `frontend/pages/login.tsx`
   - 實作登入表單
   - 整合 useAuthStore（Zustand）

2. **建立註冊頁面**
   - 建立 `frontend/pages/register.tsx`
   - 實作註冊表單
   - 整合 useAuthStore（Zustand）

### Phase 3: 登入狀態展示

1. **擴展 Header 組件**
   - 在 `frontend/components/Header.tsx` 新增使用者資訊顯示
   - 新增登出按鈕
   - 整合 useAuthStore（Zustand）

2. **整合 Auth Store**
   - 在需要認證的頁面中使用 `useAuthStore()`
   - 確保所有頁面都能存取認證狀態（Zustand 是全域的，不需要 Provider）

### Phase 4: 路由保護

1. **建立 ProtectedRoute 組件**
   - 建立 `frontend/components/ProtectedRoute.tsx`
   - 實作認證檢查邏輯
   - 實作重導向邏輯

2. **保護需要登入的頁面**
   - 更新 `frontend/pages/index.tsx`（使用 ProtectedRoute）
   - 更新 `frontend/pages/webhook-test.tsx`（使用 ProtectedRoute）
   - 更新 `frontend/pages/admin-api-test.tsx`（使用 ProtectedRoute）

3. **實作 Next.js Middleware（可選）**
   - 建立 `frontend/middleware.ts`
   - 實作路由保護邏輯

### Phase 5: 測試與驗證

1. **前端功能測試**
   - 測試註冊流程
   - 測試登入流程
   - 測試登出流程
   - 測試路由保護

2. **整合測試**
   - 測試與後端 API 的整合
   - 測試 Token 自動附加
   - 測試 Token 過期處理

---

## 驗收標準

### Agent 功能測試

#### 認證狀態管理測試
- [ ] Auth Store（Zustand）正常運作
- [ ] useAuthStore Hook 正常運作
- [ ] Token 正確儲存到 localStorage
- [ ] Token 正確從 localStorage 讀取
- [ ] Token 自動附加到 API 請求

#### 登入/註冊頁面測試
- [ ] 登入頁面正常顯示
- [ ] 登入表單驗證正常運作
- [ ] 登入成功後重導向到首頁
- [ ] 登入失敗時顯示錯誤訊息
- [ ] 註冊頁面正常顯示
- [ ] 註冊表單驗證正常運作
- [ ] 註冊成功後自動登入並重導向
- [ ] 註冊失敗時顯示錯誤訊息

#### 登入狀態展示測試
- [ ] Header 顯示使用者資訊（已登入）
- [ ] Header 顯示登入連結（未登入）
- [ ] 登出按鈕正常運作
- [ ] 登出後清除 Token 並重導向登入頁

#### 路由保護測試
- [ ] 未登入時訪問受保護頁面會重導向登入頁
- [ ] 登入後可以正常訪問受保護頁面
- [ ] 登出後自動重導向登入頁
- [ ] Token 過期時自動清除並重導向登入頁

#### TypeScript 類型檢查
- [ ] 所有 TypeScript 類型定義正確
- [ ] 編譯無錯誤
- [ ] ESLint 檢查通過

### User Test 驗收標準

**測試步驟**：

1. **註冊功能測試**
   - 訪問 `/register` 頁面
   - 輸入 Email、密碼、確認密碼
   - 點擊註冊按鈕
   - **驗證**：註冊成功後自動登入並重導向到首頁
   - **驗證**：Header 顯示使用者資訊

2. **登入功能測試**
   - 訪問 `/login` 頁面
   - 輸入已註冊的 Email 和密碼
   - 點擊登入按鈕
   - **驗證**：登入成功後重導向到首頁
   - **驗證**：Header 顯示使用者資訊

3. **錯誤處理測試**
   - 使用錯誤密碼登入
   - **驗證**：顯示錯誤訊息（密碼錯誤）
   - 使用不存在的 Email 登入
   - **驗證**：顯示錯誤訊息（使用者不存在）

4. **路由保護測試**
   - 登出後訪問首頁 `/`
   - **驗證**：自動重導向到 `/login` 頁面
   - 登入後訪問首頁
   - **驗證**：可以正常訪問首頁

5. **登出功能測試**
   - 登入後點擊 Header 的登出按鈕
   - **驗證**：登出成功並重導向到 `/login` 頁面
   - **驗證**：localStorage 中的 Token 已清除
   - 再次訪問受保護頁面
   - **驗證**：自動重導向到 `/login` 頁面

6. **Token 自動附加測試**
   - 登入後訪問需要認證的 API（如 `/api/auth/me`）
   - **驗證**：API 請求自動附加 Token
   - **驗證**：API 返回使用者資訊

7. **Token 過期處理測試**
   - 登入後手動修改 localStorage 中的 Token 為無效值
   - 訪問需要認證的頁面
   - **驗證**：自動清除無效 Token 並重導向到 `/login` 頁面

---

## 程式碼範例

### Auth Store 範例（Zustand）

```typescript
// frontend/stores/useAuthStore.ts
import { create } from 'zustand'
import { login as loginAPI, register as registerAPI, logout as logoutAPI, getCurrentUser } from '../lib/api'
import { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
  
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }
    
    set({ isLoading: true })
    try {
      const response = await getCurrentUser()
      if (response.success && response.user) {
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          token,
          isLoading: false 
        })
      } else {
        localStorage.removeItem('auth_token')
        set({ user: null, isAuthenticated: false, token: null, isLoading: false })
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
      set({ user: null, isAuthenticated: false, token: null, isLoading: false })
    }
  },
  
  login: async (email: string, password: string) => {
    const response = await loginAPI(email, password)
    if (response.success && response.token && response.user) {
      localStorage.setItem('auth_token', response.token)
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        token: response.token 
      })
    } else {
      throw new Error(response.error || '登入失敗')
    }
  },
  
  register: async (email: string, password: string, name?: string) => {
    const response = await registerAPI(email, password, name)
    if (response.success && response.token && response.user) {
      localStorage.setItem('auth_token', response.token)
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        token: response.token 
      })
    } else {
      throw new Error(response.error || '註冊失敗')
    }
  },
  
  logout: async () => {
    try {
      await logoutAPI()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      set({ user: null, isAuthenticated: false, token: null })
    }
  },
}))

// 初始化時檢查認證狀態
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth()
}
```

### 登入頁面範例

```typescript
// frontend/pages/login.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuthStore } from '../stores/useAuthStore'

export default function Login() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 如果已登入，重導向到首頁
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登入您的帳號
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email 地址"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密碼"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? '登入中...' : '登入'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-sm text-blue-600 hover:text-blue-500">
              還沒有帳號？立即註冊
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### ProtectedRoute 範例

```typescript
// frontend/components/ProtectedRoute.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../stores/useAuthStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

### API 函數擴展範例

```typescript
// frontend/lib/api.ts（擴展部分）
// ... 現有程式碼（已有 axios 實例和攔截器） ...

// 認證相關 API
export async function register(email: string, password: string, name?: string) {
  const response = await api.post('/api/auth/register', { email, password, name })
  return response.data
}

export async function login(email: string, password: string) {
  const response = await api.post('/api/auth/login', { email, password })
  return response.data
}

export async function logout() {
  const response = await api.post('/api/auth/logout')
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/api/auth/me')
  return response.data
}

// Token 自動附加（擴展現有的 axios 請求攔截器）
// 注意：現有的 api.ts 已經有請求攔截器，需要修改它來加入 Token
// 修改現有的請求攔截器：
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    
    // 加入 Token（如果存在）
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Token 過期處理（擴展現有的 axios 響應攔截器）
// 修改現有的響應攔截器，加入 401 處理：
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message)
    
    // 處理 401 錯誤（未授權）
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // 清除 Zustand Store 中的認證狀態
      if (typeof window !== 'undefined') {
        const { useAuthStore } = require('../stores/useAuthStore')
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

---

## 參考資料

- **狀態管理策略**：`docs/memory/decisions/state-management.md` - **必須遵循**：使用 Zustand 而非 React Context
- **Zustand 文件**：https://github.com/pmndrs/zustand
- **現有 Store 範例**：`frontend/stores/useStoreStore.ts` - 參考現有的 Zustand Store 模式
- **Refactor 1 成果**：`docs/backlog/stories/story-r1-0-zustand-implementation.md` - Zustand 階段 1 核心實作
- **Next.js Authentication**：https://nextjs.org/docs/authentication
- **Axios Interceptors**：https://axios-http.com/docs/interceptors
- **Story 3.1**：`docs/backlog/stories/story-3-1-user-authentication.md` - 後端認證 API

---

## 相關決策

- 見 `docs/backlog/epics/epic-3-admin-management-system.md` - Epic 3 範圍說明
- 見 `docs/backlog/stories/story-3-1-user-authentication.md` - 後端認證 API 實作

---

## 注意事項

1. **Token 安全**
   - Token 儲存在 localStorage（前端）
   - Token 自動附加到 API 請求（axios 攔截器）
   - Token 過期時自動清除並重導向登入頁

2. **路由保護**
   - 使用 ProtectedRoute 組件保護需要登入的頁面
   - 未登入時自動重導向到 `/login` 頁面
   - 登入後自動重導向到原本要訪問的頁面（可選功能）

3. **錯誤處理**
   - 所有 API 請求必須有適當的錯誤處理
   - 錯誤訊息應該清楚且對使用者友善
   - 網路錯誤時應該顯示適當的提示

4. **使用者體驗**
   - 登入/註冊表單應該有適當的驗證和錯誤提示
   - 載入狀態應該清楚顯示
   - 登入成功後應該有適當的反饋

5. **與現有系統的整合**
   - **必須遵循現行狀態管理策略**：使用 Zustand 而非 React Context（見 `docs/memory/decisions/state-management.md`）
   - 遵循現有的 Zustand Store 模式（參考 `frontend/stores/useStoreStore.ts`）
   - 不影響現有的 Shopline OAuth 流程
   - 新增的認證功能與現有功能分離
   - 為未來的多租戶資料隔離做準備（Story 3.3）

---

**最後更新**: 2025-11-06

