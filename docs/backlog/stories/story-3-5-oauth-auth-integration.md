# Story 3.5: OAuth 授權流程與會員登入系統銜接

**所屬 Epic**: [Epic 3: Admin 管理系統（Phase 1.1）](../epics/epic-3-admin-management-system.md)  
**狀態**: ✅ completed  
**完成 Run**: run-2025-11-06-01  
**建立日期**: 2025-11-06  
**對應 Roadmap**: Phase 1.1

---

## Story 描述

實作 OAuth 授權流程與會員登入系統的銜接，確保使用者在完成商店授權後，能夠保持登入狀態，並且授權的商店正確關聯到當前使用者。

**核心功能**：
- OAuth 回調時的使用者認證狀態保持
- OAuth 回調後重導向到前端時，確保使用者認證狀態
- 前端在 OAuth 回調後，檢查並恢復使用者認證狀態
- 授權的商店正確關聯到當前使用者

**對應 Roadmap Phase**：
- Phase 1.1: Admin 管理系統（OAuth 授權流程銜接）

**範圍說明**：
- ✅ **包含**：OAuth 回調時的使用者認證狀態保持、前端授權流程整合、商店授權與使用者關聯
- ✅ **統一實作**：所有 OAuth 授權流程與會員登入系統的銜接功能
- ❌ **不包含**：複雜的使用者管理介面、權限管理介面（屬於未來 Story）

---

## 前情提要

### 架構基礎
- ✅ **Story 3.1 完成**：後端認證 API 已實作（註冊、登入、登出、驗證）
- ✅ **Story 3.2 完成**：基礎權限驗證機制已實作
- ✅ **Story 3.3 完成**：多租戶資料隔離已實作
- ✅ **Story 3.4 完成**：Admin 管理介面已實作（登入/註冊頁面、路由保護）
- ✅ **OAuth 流程**：Shopline OAuth 授權流程已實作（`/api/auth/shopline/install`、`/api/auth/shopline/callback`）

### 設計決策
- **OAuth 回調時的使用者識別**：使用 JWT Token 或 Session ID（從 URL 參數或 Cookie 中取得）
- **OAuth 回調後重導向**：重導向到前端時，確保使用者認證狀態保持
- **前端認證狀態恢復**：在 OAuth 回調後，檢查並恢復使用者認證狀態

---

## 🚨 前置條件（需要 Human 先處理）

### 1. 後端 API 確認
- [x] Story 3.1 已完成（後端認證 API 已實作）
- [x] Story 3.3 已完成（多租戶資料隔離已實作）
- [x] OAuth 回調路由已實作（`/api/auth/shopline/callback`）

### 2. 環境變數需求

**後端環境變數**（需要確認已設定）：
```bash
FRONTEND_URL=https://connector-theta.vercel.app  # 前端 URL（已設定）
```

**前端環境變數**（需要確認已設定）：
```bash
NEXT_PUBLIC_BACKEND_URL=https://connector-o5hx.onrender.com  # 後端 API URL（已設定）
```

---

## 技術需求

### 1. OAuth 回調時的使用者認證狀態保持

#### 問題分析

**當前問題**：
- OAuth 回調時，嘗試從 `Authorization` header 或 `x-session-id` header 取得使用者
- 但在 Shopline embedded 環境中，這些 header 可能無法正常傳遞
- OAuth 回調後重導向到前端時，沒有傳遞使用者認證狀態

**解決方案**：
1. **使用 URL 參數傳遞使用者識別**：
   - 在 OAuth 授權 URL 中加入 `state` 參數，包含使用者識別資訊
   - OAuth 回調時，從 `state` 參數中取得使用者識別資訊

2. **使用 Cookie 傳遞使用者認證狀態**：
   - 在 OAuth 授權 URL 中加入 `state` 參數，包含 Session ID
   - OAuth 回調時，從 `state` 參數中取得 Session ID，並驗證使用者

3. **OAuth 回調後重導向時，確保使用者認證狀態**：
   - 重導向到前端時，在 URL 中加入認證狀態參數
   - 前端在 OAuth 回調後，檢查並恢復使用者認證狀態

#### 實作方案

**方案 1：使用 `state` 參數傳遞 Session ID（推薦）**

1. **修改 OAuth 授權 URL 生成**：
   - 在 `generateAuthUrl` 方法中，加入 `state` 參數
   - `state` 參數包含 Session ID（如果使用者已登入）

2. **修改 OAuth 回調處理**：
   - 從 `state` 參數中取得 Session ID
   - 使用 Session ID 驗證使用者
   - 將授權的商店關聯到當前使用者

3. **修改前端授權流程**：
   - 在點擊「新增商店授權」時，確保使用者已登入
   - 在 OAuth 授權 URL 中加入 `state` 參數（包含 Session ID）

**方案 2：使用 Cookie 傳遞使用者認證狀態**

1. **修改 OAuth 回調處理**：
   - 從 Cookie 中取得 Session ID
   - 使用 Session ID 驗證使用者
   - 將授權的商店關聯到當前使用者

2. **修改前端授權流程**：
   - 確保 Cookie 正確設定（SameSite、Secure 等）

**推薦方案**：使用 `state` 參數傳遞 Session ID，因為：
- 更可靠（不依賴 Cookie 設定）
- 更安全（Session ID 不會暴露在 URL 中，可以加密）
- 更靈活（可以包含其他資訊）

---

## 實作步驟

### Phase 1: 後端 OAuth 回調處理更新

#### 1. 修改 OAuth 授權 URL 生成

**檔案位置**：`backend/src/services/shopline.ts`

**需要修改**：
- `generateAuthUrl` 方法：加入 `state` 參數支援

**實作方式**：
```typescript
generateAuthUrl(state: string, handle: string): string {
  // 在授權 URL 中加入 state 參數
  const params = {
    appkey: this.appKey,
    handle,
    redirect_uri: this.redirectUri,
    state  // 加入 state 參數
  }
  // ... 生成授權 URL
}
```

#### 2. 修改 OAuth 回調處理

**檔案位置**：`backend/src/routes/auth.ts`

**需要修改**：
- `/api/auth/shopline/callback` 路由：從 `state` 參數中取得 Session ID

**實作方式**：
```typescript
fastify.get('/api/auth/shopline/callback', async (request, reply) => {
  // 從 query 參數中取得 state
  const state = request.query.state as string
  
  // 從 state 中解析 Session ID（可以加密）
  const sessionId = parseState(state)
  
  // 使用 Session ID 驗證使用者
  if (sessionId) {
    const session = await getSession(sessionId)
    if (session) {
      userId = session.userId
    }
  }
  
  // 儲存商店資訊（關聯到當前使用者）
  await shoplineService.saveStoreInfo(tokenData, params.handle, userId)
  
  // 重導向到前端時，確保使用者認證狀態
  // 可以在 URL 中加入認證狀態參數
  const frontendUrl = `${process.env.FRONTEND_URL}?auth_success=true&session_id=${sessionId}`
  return reply.redirect(302, frontendUrl)
})
```

#### 3. 修改 OAuth 授權 URL 生成（前端調用）

**檔案位置**：`backend/src/routes/auth.ts`

**需要修改**：
- `/api/auth/shopline/install` 路由：從請求中取得 Session ID，並加入 `state` 參數

**實作方式**：
```typescript
fastify.get('/api/auth/shopline/install', async (request, reply) => {
  // 從 Authorization header 或 x-session-id header 取得使用者
  let sessionId: string | null = null
  const authHeader = request.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 從 JWT Token 中取得 Session ID（需要在 Token 中包含 Session ID）
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (payload) {
      sessionId = payload.sessionId
    }
  } else {
    sessionId = request.headers['x-session-id'] as string || null
  }
  
  // 生成 state 參數（包含 Session ID，可以加密）
  const state = sessionId ? encryptState(sessionId) : generateRandomString()
  
  // 生成授權 URL（加入 state 參數）
  const authUrl = shoplineService.generateAuthUrl(state, params.handle)
  return reply.redirect(302, authUrl)
})
```

---

### Phase 2: 前端授權流程整合

#### 1. 修改前端授權流程

**檔案位置**：`frontend/pages/index.tsx`

**需要修改**：
- 「新增商店授權」按鈕：確保使用者已登入，並在 OAuth 授權 URL 中加入 `state` 參數

**實作方式**：
```typescript
// 在點擊「新增商店授權」時
const handleAuthClick = () => {
  // 確保使用者已登入
  if (!isAuthenticated) {
    router.push('/login')
    return
  }
  
  // 取得 Session ID（從 localStorage 或 Auth Store）
  const sessionId = getSessionId() // 需要實作
  
  // 生成授權 URL（加入 state 參數）
  const authUrl = `${backendUrl}/api/auth/shopline/install?appkey=${appKey}&handle=${handle}&timestamp=${timestamp}&sign=${sign}&state=${encryptState(sessionId)}`
  window.location.href = authUrl
}
```

#### 2. 修改前端 OAuth 回調處理

**檔案位置**：`frontend/pages/index.tsx`

**需要修改**：
- OAuth 回調後，檢查並恢復使用者認證狀態

**實作方式**：
```typescript
useEffect(() => {
  // 檢查是否為 OAuth 回調
  const urlParams = new URLSearchParams(window.location.search)
  const authSuccess = urlParams.get('auth_success')
  const sessionId = urlParams.get('session_id')
  
  if (authSuccess === 'true' && sessionId) {
    // 恢復使用者認證狀態
    useAuthStore.getState().checkAuth()
    
    // 清除 URL 參數
    window.history.replaceState({}, document.title, window.location.pathname)
    
    // 重新載入商店列表
    // ...
  }
}, [])
```

---

### Phase 3: 資料清理與測試準備

#### 1. 資料備份腳本

**檔案位置**：`backend/scripts/backup-stores.ts`（新建）

**功能**：
- 備份現有的 Store 和 WebhookEvent 資料
- 匯出為 JSON 檔案

#### 2. 資料清理腳本

**檔案位置**：`backend/scripts/clear-stores.ts`（新建）

**功能**：
- 清理現有的 Store 和 WebhookEvent 資料
- 保留系統使用者
- 保留 User 資料

---

## 驗收標準

### Agent 功能測試

- [x] OAuth 授權 URL 中包含 `state` 參數
- [x] OAuth 回調時，能從 `state` 參數中取得 Session ID
- [x] OAuth 回調時，能正確驗證使用者
- [x] 授權的商店正確關聯到當前使用者
- [x] OAuth 回調後重導向到前端時，使用者認證狀態保持
- [x] 前端在 OAuth 回調後，能正確恢復使用者認證狀態
- [x] JWT Token 包含 Session ID
- [x] 前端授權流程確保使用者已登入
- [x] 資料備份腳本已建立
- [x] 資料清理腳本已建立

### User Test 驗收標準

1. **完整流程測試**：
   - [ ] 會員註冊
   - [ ] 會員登入
   - [ ] 看到空白授權商店
   - [ ] 點擊新增商店授權
   - [ ] 走 OAuth 流程
   - [ ] 在 Shopline embedded 導回後，使用者仍然是登入狀態
   - [ ] 授權完成的商店正確關聯到當前使用者
   - [ ] 可以開始使用 API

2. **資料隔離測試**：
   - [ ] 使用者 A 授權的商店，使用者 B 無法看到
   - [ ] 使用者 A 授權的商店，使用者 B 無法使用 API

---

## 交付成果

- [x] 後端 OAuth 回調處理更新（從 `state` 參數中取得使用者）
- [x] 前端授權流程整合（確保使用者已登入，並在 OAuth 授權 URL 中加入 `state` 參數）
- [x] 前端 OAuth 回調處理（檢查並恢復使用者認證狀態）
- [x] 資料備份腳本（`backend/scripts/backup-stores.ts`）
- [x] 資料清理腳本（`backend/scripts/clear-stores.ts`）
- [x] JWT Token 擴展（包含 Session ID）
- [x] State 參數加密/解密工具（`backend/src/utils/state.ts`）
- [x] 授權 URL API 端點（`GET /api/auth/shopline/authorize`）
- [ ] 完整流程測試通過（待 User Test）

---

## 相關文件

- **Epic 3**: `docs/backlog/epics/epic-3-admin-management-system.md`
- **Story 3.1**: `docs/backlog/stories/story-3-1-user-authentication.md`
- **Story 3.3**: `docs/backlog/stories/story-3-3-multi-tenant-data-isolation.md`
- **Story 3.4**: `docs/backlog/stories/story-3-4-admin-management-interface.md`

---

**最後更新**: 2025-11-06

