# Next Engine OAuth Redis 問題排除指南

## 🔍 問題診斷

**錯誤訊息**：`Unable to identify user`

**可能原因**：
1. Redis 未正確連接或設定
2. Next Engine 不保留我們傳入的 state，而是生成自己的 state
3. Redis key 已過期（TTL 10 分鐘）

## ✅ 檢查步驟

### 1. 檢查 Render Redis 環境變數

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Environment**

**確認以下環境變數已設定**：

```
變數名稱：REDIS_URL
變數值：redis://red-d406i56uk2gs739qn8ig:6379
```

⚠️ **重要**：
- Render 服務內部必須使用 **Internal URL**（格式：`redis://red-{id}:6379`）
- 不要使用 External URL（那是給地端開發用的）
- Internal URL 不需要密碼

### 2. 檢查 Render Logs

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Logs**

**查找以下日誌訊息**：

#### ✅ 正常情況應該看到：
```
✅ [DEBUG] Redis Client Connected
✅ [DEBUG] Redis Client Ready
✅ [DEBUG] Redis PING 成功，連線正常
✅ 已在 Redis 暫存 state 和 userId 對應關係
```

#### ❌ 如果有問題會看到：
```
❌ [DEBUG] Redis 客戶端未初始化，請檢查 REDIS_URL 環境變數
❌ Redis connection failed after 3 retries
⚠️ Redis 客戶端不可用，嘗試解密 state
```

### 3. 檢查 OAuth Callback Logs

在 Render Logs 中查找 Next Engine callback 相關日誌：

**應該看到**：
```
🔍 Next Engine callback 除錯資訊: { state: '...', stateLength: ..., stateFormat: '...', hasRedis: true }
🔍 Redis 查詢結果: { redisKey: 'oauth:next-engine:state:...', cachedUserId: 'found' }
✅ 從 Redis 取得使用者 ID: <userId>
```

**如果有問題會看到**：
```
🔍 Next Engine callback 除錯資訊: { state: '...', stateFormat: 'plain', hasRedis: false }
⚠️ Redis 客戶端不可用，嘗試解密 state
⚠️ State 解密失敗，可能 Next Engine 生成了自己的 state
❌ 無法取得使用者 ID
```

## 🔧 解決方案

### 方案 1：確認 Redis 環境變數（最可能的原因）

1. 前往 Render Dashboard → **connector** 專案
2. 點擊左側選單 **"Environment"**
3. 檢查 `REDIS_URL` 環境變數：
   - **正確值**：`redis://red-d406i56uk2gs739qn8ig:6379`
   - **錯誤值**：`rediss://...`（這是 External URL，Render 內部不能用）
4. 如果值不正確，更新為 Internal URL
5. 儲存後 Render 會自動重新部署

### 方案 2：檢查 Redis 服務狀態

1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 找到 **shopline-middleware-redis** 服務（或類似的 Redis 服務）
3. 確認服務狀態為 **"Live"**
4. 如果服務未啟動，啟動服務

### 方案 3：驗證 Redis 連線

部署完成後，檢查 Render Logs 中的啟動日誌：

**應該看到**：
```
🔍 [DEBUG] 檢查 Redis 連線狀態...
✅ [DEBUG] Redis 客戶端已初始化
✅ [DEBUG] Redis PING 成功，連線正常
```

如果看到錯誤，請檢查：
- Redis 服務是否在運行
- `REDIS_URL` 環境變數是否正確
- Redis 服務 ID 是否正確（`red-d406i56uk2gs739qn8ig`）

## 📋 快速檢查清單

- [ ] Render 環境變數 `REDIS_URL` 已設定為 Internal URL
- [ ] Redis 服務狀態為 "Live"
- [ ] Render Logs 顯示 Redis 連線成功
- [ ] OAuth callback Logs 顯示 `hasRedis: true`
- [ ] Redis 查詢結果顯示 `cachedUserId: 'found'`

## 🆘 如果問題仍然存在

### 檢查 Next Engine State 問題

如果 Redis 正常但還是無法取得 userId，可能是 Next Engine 不保留我們傳入的 state。

**檢查方法**：
1. 查看 Render Logs 中的 OAuth callback 日誌
2. 檢查 `stateFormat`：
   - 如果是 `'encrypted'`：表示 Next Engine 保留了我們的 state
   - 如果是 `'plain'`：表示 Next Engine 生成了自己的 state

**如果 Next Engine 不保留 state**：
- 必須依賴 Redis 來儲存 userId
- 確保 Redis 連線正常
- 確保在生成授權 URL 時，Redis 寫入成功

### 臨時解決方案（不建議）

如果 Redis 完全無法使用，可以考慮：
1. 使用資料庫暫存 state 和 userId 的對應關係
2. 但這會增加資料庫負擔，且需要清理過期資料

**建議**：優先修復 Redis 連線問題。

## 📝 相關文件

- Redis 設定：`docs/reference/guides/ENV_SETUP_GUIDE.md`
- 部署檢查清單：`docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`
- 正式環境資訊：`docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

