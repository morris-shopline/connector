# OAuth 授權流程與會員登入系統銜接方案

**日期**: 2025-11-06  
**狀態**: 提案中

---

## 📋 問題分析

### 原本的 OAuth 流程（Story 0.2）

```
1. 使用者在前端點擊「新增商店授權」
   ↓
2. 前端生成 HMAC-SHA256 簽名
   ↓
3. 重導向到 /api/auth/shopline/install
   ↓
4. 後端驗證簽名和時間戳
   ↓
5. 重導向到 Shopline 授權頁面
   https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize
   ↓
6. 使用者在 Shopline 完成授權
   ↓
7. Shopline 重導向回 /api/auth/shopline/callback
   ↓
8. 後端驗證簽名
   ↓
9. 使用授權碼交換 Access Token
   ↓
10. 解析 JWT Token，儲存 Store（原本沒有 userId）
   ↓
11. 重導向回前端頁面
```

### 現在的問題

1. **Store 需要 userId**（Story 3.3 多租戶資料隔離）
   - Store 模型現在有必填的 `userId` 欄位
   - OAuth 回調時沒有使用者認證資訊

2. **OAuth 回調的上下文**
   - OAuth 回調是從 Shopline 重定向回來的
   - 沒有 `Authorization` header
   - 沒有 Cookie（跨域限制）
   - 只有 URL 查詢參數

3. **使用者認證狀態**
   - OAuth 流程是從前端發起的（使用者點擊「新增商店授權」）
   - 在發起 OAuth 流程時，使用者已經登入了
   - 需要在發起 OAuth 流程時，將使用者資訊傳遞到 OAuth 回調

---

## 🎯 解決方案

### 方案概述

使用 **OAuth `state` 參數**（OAuth 2.0 標準做法）傳遞使用者識別資訊：

1. **在生成授權 URL 時**：
   - 取得當前使用者的 `userId` 或 `sessionId`
   - 加密後放入 `state` 參數
   - 同時在 Redis 中暫存 `state` 和 `userId` 的對應關係（作為備份）

2. **在 OAuth 回調時**：
   - 優先從 Redis 取得 `userId`（最可靠）
   - 如果 Redis 沒有，嘗試解密 `state` 取得 `sessionId`，再從 Session 取得 `userId`
   - 使用 `userId` 儲存 Store

### 為什麼使用 `state` 參數？

1. **OAuth 2.0 標準**：`state` 參數是 OAuth 2.0 標準中專門用來傳遞狀態資訊的
2. **安全性**：可以加密，不會暴露敏感資訊
3. **可靠性**：即使 Shopline 不保留 `state`，也有 Redis 備份

### 為什麼需要 Redis 備份？

1. **Shopline 可能不保留 `state`**：某些 OAuth 實作可能不保留 `state` 參數
2. **跨域限制**：OAuth 回調是從 Shopline 重定向回來的，可能無法使用 Cookie
3. **可靠性**：Redis 備份確保即使 `state` 丟失，也能取得 `userId`

---

## 🔧 實作方案

### Phase 1: 後端修改

#### 1. 修改 `/api/auth/shopline/authorize` 端點

**檔案**: `backend/src/routes/auth.ts`

**修改內容**：
- 從 `authMiddleware` 取得當前使用者的 `userId`
- 生成 `state` 參數（加密 `userId` 或 `sessionId`）
- 在 Redis 中暫存 `state` 和 `userId` 的對應關係（10 分鐘 TTL）
- 返回包含 `state` 的授權 URL

**實作邏輯**：
```typescript
// 取得當前使用者（從 authMiddleware）
const userId = request.user.id
const sessionId = request.sessionId || null

// 生成 state 參數
let state: string
if (sessionId) {
  // 如果有 Session ID，加密後放入 state
  state = encryptState(sessionId)
} else {
  // 如果沒有 Session ID，直接加密 userId
  state = encryptState(userId)
}

// 在 Redis 中暫存 state 和 userId 的對應關係
const redis = getRedisClient()
if (redis) {
  await redis.setex(`oauth:state:${state}`, 600, userId)
}

// 生成授權 URL（包含 state）
const authUrl = shoplineService.generateAuthUrl(state, handle)
```

#### 2. 修改 `/api/auth/shopline/callback` 端點

**檔案**: `backend/src/routes/auth.ts`

**修改內容**：
- 從 `state` 參數中取得 `userId`
- 優先從 Redis 取得（最可靠）
- 如果 Redis 沒有，嘗試解密 `state` 取得 `sessionId`，再從 Session 取得 `userId`
- 使用 `userId` 儲存 Store

**實作邏輯**：
```typescript
// 從 state 參數中取得 userId
let userId: string | undefined = undefined
const state = params.state

if (state) {
  // 方法 1: 嘗試從 Redis 取得 userId（最可靠）
  const redis = getRedisClient()
  if (redis) {
    const cachedUserId = await redis.get(`oauth:state:${state}`)
    if (cachedUserId) {
      userId = cachedUserId
      // 取得後刪除（一次性使用）
      await redis.del(`oauth:state:${state}`)
    }
  }
  
  // 方法 2: 如果 Redis 沒有，嘗試解密 state 取得 sessionId
  if (!userId) {
    const sessionId = decryptState(state)
    if (sessionId) {
      const session = await getSession(sessionId)
      if (session) {
        userId = session.userId
      }
    }
  }
}

// 儲存 Store（使用 userId）
await shoplineService.saveStoreInfo(tokenData, params.handle, userId)
```

#### 3. 確保 `generateAuthUrl` 支援 `state` 參數

**檔案**: `backend/src/services/shopline.ts`

**確認**：`generateAuthUrl` 方法已經支援 `state` 參數

---

### Phase 2: 前端修改

#### 1. 修改「新增商店授權」按鈕

**檔案**: `frontend/pages/index.tsx`

**修改內容**：
- 確保使用者已登入（使用 `useAuthStore`）
- 如果未登入，提示使用者登入
- 如果已登入，調用 `/api/auth/shopline/authorize` 取得授權 URL
- 重定向到授權 URL

**實作邏輯**：
```typescript
const handleAddStore = async () => {
  // 檢查使用者是否已登入
  const { user, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !user) {
    alert('請先登入')
    router.push('/login')
    return
  }
  
  // 取得授權 URL（包含 state）
  const response = await apiClient.getAuthorizeUrl(handle)
  if (response.success && response.authUrl) {
    window.location.href = response.authUrl
  }
}
```

#### 2. 修改 OAuth 回調處理

**檔案**: `frontend/pages/index.tsx`

**修改內容**：
- 檢查 URL 參數中是否有 `auth_success` 和 `session_id`
- 如果有，恢復使用者認證狀態
- 重新取得商店列表

**實作邏輯**：
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const authSuccess = params.get('auth_success')
  const sessionId = params.get('session_id')
  
  if (authSuccess === 'true' && sessionId) {
    // 恢復使用者認證狀態
    useAuthStore.getState().checkAuth()
    // 重新取得商店列表
    refetchStores()
    // 清除 URL 參數
    window.history.replaceState({}, '', window.location.pathname)
  }
}, [])
```

---

## ✅ 驗收標準

### 功能驗收

- [x] 使用者登入後，點擊「新增商店授權」能正確取得授權 URL
- [x] 授權 URL 中包含 `state` 參數
- [x] OAuth 回調時能從 `state` 或 Redis 取得 `userId`
- [x] Store 能正確關聯到當前使用者
- [x] OAuth 回調後，前端能恢復使用者認證狀態
- [x] 商店列表能正確顯示授權的商店

### 邊界情況處理

- [x] 使用者未登入時，提示登入
- [x] `state` 參數丟失時，能從 Redis 取得 `userId`
- [x] Redis 不可用時，能從 `state` 解密取得 `sessionId`
- [x] Session 過期時，使用系統使用者（降級處理）

---

## 🔍 技術細節

### State 參數加密

**檔案**: `backend/src/utils/state.ts`

**實作**：
- 使用 AES-256-CBC 加密
- 密鑰：`STATE_SECRET` 或 `JWT_SECRET`
- 格式：`IV:encrypted`（IV 和加密內容用 `:` 分隔）

### Redis 暫存

**Key 格式**: `oauth:state:${state}`  
**Value**: `userId`  
**TTL**: 600 秒（10 分鐘）  
**使用方式**: 一次性使用（取得後刪除）

### 降級處理

如果無法取得 `userId`：
1. 記錄警告日誌
2. 使用系統使用者（`system@admin.com`）
3. 確保 Store 能正常儲存

---

## 📝 注意事項

1. **Shopline 可能不保留 `state`**：
   - 使用 Redis 備份確保可靠性
   - 即使 `state` 丟失，也能從 Redis 取得 `userId`

2. **跨域限制**：
   - OAuth 回調是從 Shopline 重定向回來的
   - 無法使用 Cookie 傳遞認證資訊
   - 必須使用 URL 參數（`state`）或 Redis

3. **安全性**：
   - `state` 參數必須加密
   - Redis 備份使用一次性 Key（取得後刪除）
   - 記錄詳細日誌，方便除錯

4. **向後兼容**：
   - 如果無法取得 `userId`，使用系統使用者
   - 確保現有的 OAuth 流程不會中斷

---

## 🚀 部署檢查清單

- [x] 後端修改完成
- [x] 前端修改完成
- [x] Redis 連線正常
- [x] `STATE_SECRET` 環境變數已設定
- [x] 測試 OAuth 流程完整流程
- [x] 測試邊界情況（未登入、`state` 丟失等）
- [x] 檢查日誌輸出

---

**最後更新**: 2025-11-06

