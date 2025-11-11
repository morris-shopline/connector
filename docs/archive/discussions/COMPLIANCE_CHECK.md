# Shopline API 合規性檢查

## ✅ 已正確實作的部分

### 1. 安裝請求驗證 (步驟 1)
- ✅ 使用正確的路徑：`GET /api/auth/shopline/install`
- ✅ 驗證必要參數：`appkey`, `handle`, `timestamp`, `sign`
- ✅ 檢查 appkey 匹配
- ✅ 時間戳驗證（5分鐘內有效，支援秒和毫秒）
- ✅ HMAC-SHA256 簽名驗證
- ✅ 使用 `crypto.timingSafeEqual()` 防止時序攻擊
- ✅ 自動處理 `lang` 參數

### 2. 授權 URL 重定向 (步驟 2)
**注意**：使用了與官方文件不同但實際有效的 URL

官方文件：
```
https://{handle}.myshopline.com/admin/oauth/authorize?response_type=code&client_id={appkey}&redirect_uri={redirect_uri}&scope={scope}&state={state}
```

實作（已測試通過）：
```
https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey={appkey}&responseType=code&scope={scope}&redirectUri={redirect_uri}
```

**說明**：
- 使用前端路由 `/admin/oauth-web/` 而非後端 API `/admin/oauth`
- 參數使用 camelCase 而非 snake_case
- 實際測試已確認可正常運作

### 3. 回調處理 (步驟 3)
- ✅ 正確處理授權碼 `code`
- ✅ 驗證必要參數
- ✅ 簽名驗證（包含所有參數：appkey, code, handle, lang, timestamp）
- ✅ 時間戳驗證
- ✅ 自動過濾 `sign` 參數並按字母順序排序
- ✅ 返回 HTML 頁面並自動重導向

**🚨 關鍵實作細節**：
- 簽名驗證必須直接傳遞整個 `params` 或 `req.query`
- `verifyInstallRequest` 會自動遍歷所有參數進行簽名驗證
- **禁止**只傳遞部分參數（會導致簽名驗證失敗）

**參考實作**：見 `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`

### 4. Token 交換 (步驟 4)
- ✅ 使用正確的端點：`POST https://{handle}.myshopline.com/admin/oauth/token/create`
- ✅ 正確的 Headers：`Content-Type`, `appkey`, `timestamp`, `sign`
- ✅ 正確的 Body：`{"code": "{authorization_code}"}`
- ✅ POST 請求簽名：`body + timestamp`
- ✅ 使用 HMAC-SHA256
- ✅ 正確解析 JWT Token

### 5. 資料儲存
- ✅ 儲存 access_token (完整 JWT)
- ✅ 儲存 handle
- ✅ 儲存 scope
- ✅ 儲存 shop_id (從 JWT 解析)
- ✅ 儲存 shop_domain (從 JWT 解析)
- ✅ 儲存 expiresAt (從 JWT 解析)
- ✅ 使用 upsert 避免重複

### 6. 安全措施
- ✅ 所有請求驗證簽名
- ✅ 時間戳檢查（5分鐘）
- ✅ 使用 `crypto.timingSafeEqual()` 防止時序攻擊
- ✅ HTTPS（透過 ngrok）
- ✅ 錯誤處理完整

### 7. 其他要求
- ✅ 使用商店域名 `{handle}.myshopline.com`
- ✅ 所有 API 調用使用 HTTPS
- ✅ 錯誤處理完善
- ✅ 支援 iframe 嵌入

## 📋 簽名驗證詳細檢查

### GET 請求簽名（安裝請求與回調）
**官方要求**：
1. 參數按鍵名排序 ✅
2. 拼接成 `key1=value1&key2=value2` 格式 ✅
3. HMAC-SHA256 加密 ✅
4. 轉換為十六進制字串 ✅
5. 排除 `sign` 參數 ✅

**實作**：使用 `verifyGetSignature()` ✅

### POST 請求簽名（Token 交換）
**官方要求**：
1. Body + Timestamp ✅
2. HMAC-SHA256 加密 ✅
3. 轉換為十六進制字串 ✅

**實作**：使用 `signPostRequest()` ✅

### 簽名驗證
**官方要求**：
1. 使用相同算法生成期望簽名 ✅
2. 與接收到的簽名比較 ✅
3. 使用 `crypto.timingSafeEqual()` ✅

**實作**：完全符合 ✅

## 🔍 額外檢查

### 時間戳處理
**問題**：回調使用毫秒時間戳，安裝請求使用秒

**實作**：
- ✅ 自動判斷長度（>=13位 = 毫秒）
- ✅ 支援兩種格式

### 可選參數
**已處理**：
- ✅ `lang` 參數（可選）
- ✅ `customField` 參數（可選）

### 錯誤處理
**已實作**：
- ✅ 400 Bad Request（缺少參數）
- ✅ 401 Unauthorized（簽名/時間戳/App Key 錯誤）
- ✅ 500 Internal Server Error（伺服器錯誤）
- ✅ 詳細的錯誤訊息

### JWT Token 處理
**已實作**：
- ✅ 正確解析 JWT Payload
- ✅ 提取 storeId、domain、exp
- ✅ 儲存到期時間

## 🎯 總結

### 核心功能符合度：100%

**完全符合**：
- ✅ 簽名生成與驗證
- ✅ Token 交換
- ✅ 安全措施
- ✅ 錯誤處理
- ✅ OAuth 流程完整性

**實測結果**：
- ✅ 授權流程完整測試通過
- ✅ 資料正確儲存
- ✅ 前端正確顯示

**建議**：
1. 已完成完整實測 ✅
2. 當前實作完全符合 Shopline 實際行為 ✅
3. 可直接用於生產環境

---

**最後更新**: 2025-11-03  
**測試狀態**: ✅ 已完全測試通過

