# 環境變數檢查清單

> 用於檢查正式機環境變數設定是否正確

---

## 🔍 問題診斷

如果遇到 **404 Not Found** 錯誤，請檢查以下項目：

### 1. Vercel（前端）環境變數

**必須設定**：
- `NEXT_PUBLIC_BACKEND_URL` = `https://connector-o5hx.onrender.com`
  - ⚠️ **重要**：不要有尾部斜線（`/`）
  - ✅ 正確：`https://connector-o5hx.onrender.com`
  - ❌ 錯誤：`https://connector-o5hx.onrender.com/`

**檢查方式**：
1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇專案 `connector`
3. 前往 Settings → Environment Variables
4. 確認 `NEXT_PUBLIC_BACKEND_URL` 已設定且值正確

**驗證方式**：
在瀏覽器 Console 執行：
```javascript
console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL)
// 應該輸出：https://connector-o5hx.onrender.com
```

### 2. Render（後端）環境變數

**必須設定**：
- `DATABASE_URL` - Neon PostgreSQL 連線字串
- `PORT` - `10000`（Render 預設）
- `NODE_ENV` - `production`
- `FRONTEND_URL` - `https://connector-theta.vercel.app`
- `REDIS_URL` - `redis://red-d406i56uk2gs739qn8ig:6379`（Render Internal）

**檢查方式**：
1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 選擇服務 `connector`
3. 前往 Environment 標籤
4. 確認所有環境變數已設定

**驗證方式**：
檢查後端健康檢查端點：
```bash
curl https://connector-o5hx.onrender.com/api/health
```

應該回傳：
```json
{
  "success": true,
  "message": "Service is running",
  "database": "connected"
}
```

---

## 🐛 常見問題

### 問題 1: 404 Not Found

**可能原因**：
1. ❌ `NEXT_PUBLIC_BACKEND_URL` 未設定或設定錯誤
2. ❌ URL 有尾部斜線導致路由錯誤
3. ❌ 後端服務未正確部署或重啟

**解決方法**：
1. 檢查 Vercel 環境變數設定
2. 確認 URL 格式正確（無尾部斜線）
3. 重新部署前端（Vercel 會自動重建）
4. 檢查後端服務狀態（Render Dashboard）

### 問題 2: CORS 錯誤

**可能原因**：
- 後端 CORS 設定未包含前端域名

**解決方法**：
檢查 `backend/src/index.ts` 的 CORS 設定，確認包含：
```typescript
origin: [
  'https://connector-theta.vercel.app',
  /https:\/\/connector.*\.vercel\.app/,
]
```

### 問題 3: 401 Unauthorized

**可能原因**：
- Token 過期或無效
- 後端 JWT_SECRET 與前端不一致

**解決方法**：
1. 重新登入取得新 Token
2. 檢查後端 `JWT_SECRET` 環境變數

---

## ✅ 快速檢查腳本

在瀏覽器 Console 執行以下腳本檢查環境變數：

```javascript
// 檢查前端環境變數
console.log('=== 前端環境變數檢查 ===')
console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL || '❌ 未設定')
console.log('NODE_ENV:', process.env.NODE_ENV || 'development')

// 檢查後端連線
fetch('https://connector-o5hx.onrender.com/api/health')
  .then(r => r.json())
  .then(data => {
    console.log('=== 後端健康檢查 ===')
    console.log('狀態:', data.success ? '✅ 正常' : '❌ 異常')
    console.log('資料庫:', data.database)
  })
  .catch(err => {
    console.error('❌ 後端連線失敗:', err)
  })
```

---

## 📝 更新記錄

| 日期 | 更新內容 |
|------|---------|
| 2025-11-12 | 建立環境變數檢查清單 |

---

**相關文件**：
- [正式環境資訊](./PRODUCTION_ENVIRONMENT.md)
- [環境設定指南](./ENV_SETUP_GUIDE.md)

