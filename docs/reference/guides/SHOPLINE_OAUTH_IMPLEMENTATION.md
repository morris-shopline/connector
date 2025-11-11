# Shopline OAuth 實作指南

> 🚨 **Agent 必讀**：實作或修改 Shopline OAuth 相關功能時，必須參考此文件。

---

## 📋 目錄

1. [完整 OAuth 流程](#完整-oauth-流程)
2. [關鍵實作細節](#關鍵實作細節)
3. [簽名驗證實作](#簽名驗證實作)
4. [常見錯誤與解決方法](#常見錯誤與解決方法)
5. [參考實作](#參考實作)

---

## 完整 OAuth 流程

### 流程圖

```
1. 前端調用 /api/auth/shopline/authorize
   ↓
2. 後端生成授權 URL（包含 state 參數）
   ↓
3. 重導向到 Shopline 授權頁面
   ↓
4. 使用者在 Shopline 完成授權
   ↓
5. Shopline 重導向回 /api/auth/shopline/callback
   ↓
6. 後端驗證簽名（關鍵步驟）
   ↓
7. 使用授權碼交換 Access Token
   ↓
8. 儲存商店資訊並重導向回前端
```

### 端點說明

| 端點 | 用途 | 調用者 |
|------|------|--------|
| `/api/auth/shopline/install` | Shopline 發送安裝請求 | Shopline |
| `/api/auth/shopline/authorize` | 前端調用，生成授權 URL | 前端（已登入使用者） |
| `/api/auth/shopline/callback` | OAuth 授權完成後回調 | Shopline |

---

## 關鍵實作細節

### 🚨 簽名驗證（最重要）

**關鍵原則**：簽名驗證必須包含所有參數（除了 `sign` 本身）

#### 正確實作（參考 `temp/oauth.js`）

```typescript
// ✅ 正確：直接傳遞整個 query 參數
const isValidSignature = verifyGetSignature(req.query, sign, appSecret)
```

```typescript
// ✅ 正確：直接傳遞整個 params 給 verifyInstallRequest
const isValidSignature = await shoplineService.verifyInstallRequest(params)
```

#### 錯誤實作（會導致簽名驗證失敗）

```typescript
// ❌ 錯誤：只傳遞部分參數
const verifyParams = {
  appkey: params.appkey,
  handle: params.handle,
  timestamp: params.timestamp,
  sign: params.sign
  // 缺少 code, lang 等參數！
}
const isValidSignature = await shoplineService.verifyInstallRequest(verifyParams)
```

### OAuth Callback 參數

Shopline OAuth callback 會包含以下參數：

**必要參數**：
- `appkey`: 應用密鑰
- `code`: 授權碼
- `handle`: 商店 handle
- `timestamp`: 時間戳
- `sign`: 簽名

**可選參數**（但必須包含在簽名驗證中）：
- `lang`: 語言（例如：`ja`）
- `customField`: 自訂欄位
- `state`: 狀態參數（包含 Session ID）

### 簽名驗證流程

1. **取得所有參數**：從 `request.query` 取得所有參數
2. **排除 sign**：`verifyGetSignature` 會自動排除 `sign` 參數
3. **按字母順序排序**：`verifyGetSignature` 會自動排序
4. **生成簽名**：使用 HMAC-SHA256 加密
5. **比較簽名**：使用 `crypto.timingSafeEqual()` 防止時序攻擊

---

## 簽名驗證實作

### verifyInstallRequest 方法

```typescript
async verifyInstallRequest(params: ShoplineAuthParams): Promise<boolean> {
  const { appkey, handle, timestamp, sign } = params
  
  // 1. 檢查 appkey 是否匹配
  if (appkey !== this.appKey) {
    return false
  }

  // 2. 驗證時間戳 (5分鐘內有效)
  const now = Date.now()
  const requestTime = timestamp.length >= 13 
    ? parseInt(timestamp) 
    : parseInt(timestamp) * 1000
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false
  }

  // 3. 驗證簽名 - 排除 sign 後自動排序所有參數
  // ⚠️ 關鍵：會自動遍歷 params 的所有屬性（包含 code, lang 等）
  const allParams: Record<string, string> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'sign' && value !== undefined) {
      allParams[key] = String(value)
    }
  })
  const isValidSignature = verifyGetSignature(allParams, sign, this.appSecret)
  
  return isValidSignature
}
```

### OAuth Callback 實作範例

```typescript
fastify.get('/api/auth/shopline/callback', async (request, reply) => {
  const rawQuery = request.query as Record<string, unknown>
  
  // 1. 檢查必要參數
  if (!rawQuery.appkey || !rawQuery.code || !rawQuery.handle || 
      !rawQuery.timestamp || !rawQuery.sign) {
    return reply.status(400).send({
      success: false,
      error: 'Missing required parameters'
    })
  }
  
  // 2. 解析參數（使用 zod schema）
  const parseResult = callbackSchema.safeParse(request.query)
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid request parameters',
      details: parseResult.error.errors
    })
  }
  
  const params = parseResult.data
  
  // 3. 驗證簽名 - ⚠️ 關鍵：直接傳遞整個 params
  // verifyInstallRequest 會自動遍歷所有參數（包含 code, lang 等）
  const isValidSignature = await shoplineService.verifyInstallRequest(params as any)
  if (!isValidSignature) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid signature'
    })
  }
  
  // 4. 交換授權碼獲取 Token
  const tokenData = await shoplineService.exchangeCodeForToken(params.code, params.handle)
  
  // 5. 處理後續邏輯...
})
```

---

## 常見錯誤與解決方法

### ❌ 錯誤 1: Invalid signature

**原因**：簽名驗證時未包含所有參數（例如缺少 `code` 或 `lang`）

**錯誤實作**：
```typescript
// 只傳遞部分參數
const verifyParams = {
  appkey: params.appkey,
  handle: params.handle,
  timestamp: params.timestamp,
  sign: params.sign
  // 缺少 code！
}
```

**正確實作**：
```typescript
// 直接傳遞整個 params
const isValidSignature = await shoplineService.verifyInstallRequest(params)
```

### ❌ 錯誤 2: REDIRECT_URI_NOT_WHITELISTED

**原因**：Shopline Console 的 App callback URL 設定錯誤

**錯誤設定**：
- App callback URL: `https://example.com/api/auth/shopline/authorize` ❌

**正確設定**：
- App callback URL: `https://example.com/api/auth/shopline/callback` ✅

**說明**：
- `/authorize` 是前端調用的端點（生成授權 URL）
- `/callback` 是 Shopline 回調的端點（必須在白名單中）

### ❌ 錯誤 3: Missing required parameters

**原因**：OAuth callback 缺少必要參數（通常是 `code`）

**可能情況**：
- 使用者取消了授權
- Shopline 回調時發生錯誤

**處理方式**：
```typescript
// 先檢查必要參數
if (!rawQuery.appkey || !rawQuery.code || !rawQuery.handle || 
    !rawQuery.timestamp || !rawQuery.sign) {
  return reply.status(400).send({
    success: false,
    error: 'Missing required parameters'
  })
}
```

---

## 參考實作

### 正確的參考實作

**檔案位置**：`temp/oauth.js`

```javascript
router.get('/callback', async (req, res) => {
  const { appkey, code, handle, timestamp, sign, customField } = req.query
  
  // 驗證必要參數
  if (!appkey || !code || !handle || !timestamp || !sign) {
    return res.status(400).json({ 
      error: 'Missing required parameters' 
    })
  }
  
  // ✅ 關鍵：直接傳遞整個 req.query
  const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
  
  if (!isValidSignature) {
    return res.status(401).json({ 
      error: 'Invalid signature' 
    })
  }
  
  // 後續處理...
})
```

### 當前實作位置

- **後端路由**：`backend/src/routes/auth.ts`
- **簽名驗證服務**：`backend/src/services/shopline.ts`
- **簽名工具函數**：`backend/src/utils/signature.ts`

---

## 🚨 重構注意事項

### 禁止事項

1. **禁止**：只傳遞部分參數給 `verifyInstallRequest`
2. **禁止**：手動過濾參數（`verifyGetSignature` 會自動處理）
3. **禁止**：修改 `verifyInstallRequest` 的參數遍歷邏輯

### 允許事項

1. **允許**：直接傳遞整個 `params` 或 `req.query`
2. **允許**：使用 `as any` 類型斷言（因為 `ShoplineAuthParams` 類型可能不完整）

### 歷史教訓

**Run 2025-11-10-01 的錯誤**：
- 重構時將簽名驗證從「傳遞整個 params」改為「只傳遞部分參數」
- 導致缺少 `code` 參數，簽名驗證失敗
- **修復方式**：恢復為重構前的做法（直接傳遞整個 params）

---

## Shopline Console 設定

### 基本資訊設定

**App URL**（應用程式 URL）：
```
https://your-domain.com/api/auth/shopline/install
```

**App callback URL**（應用程式回調 URL）：
```
https://your-domain.com/api/auth/shopline/callback
```

⚠️ **重要**：App callback URL 必須是 `/callback`，不是 `/authorize`！

### 環境變數設定

**後端 `.env`**：
```bash
SHOPLINE_REDIRECT_URI=https://your-domain.com/api/auth/shopline/callback
```

---

## 測試檢查清單

在修改 OAuth 相關代碼後，必須確認：

- [ ] 簽名驗證包含所有參數（包含 `code`, `lang` 等）
- [ ] Shopline Console 的 App callback URL 設定正確（`/callback`）
- [ ] 環境變數 `SHOPLINE_REDIRECT_URI` 設定正確
- [ ] 必要參數檢查正確（`appkey`, `code`, `handle`, `timestamp`, `sign`）
- [ ] 時間戳驗證正確（5分鐘內有效）
- [ ] App key 驗證正確

---

## 相關文件

- **API 文件**：`docs/reference/platform-apis/shopline-api-docs.md`
- **合規性檢查**：`docs/archive/discussions/COMPLIANCE_CHECK.md`
- **參考實作**：`temp/oauth.js`
- **當前實作**：`backend/src/routes/auth.ts`

---

**最後更新**: 2025-11-11  
**維護者**: Agent（基於 Run 2025-11-11-01 的修復經驗）

