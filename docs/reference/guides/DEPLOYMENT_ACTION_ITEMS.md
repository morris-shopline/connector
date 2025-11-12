# 🚀 Next Engine 正式站部署行動清單

## ✅ 已完成
- [x] 代碼已 commit 並 push 到 GitHub
- [x] Render 和 Vercel 會自動部署（如果已設定自動部署）

## ⚠️ 必須手動完成（部署前）

### 0. 檢查 Redis 設定（重要！）

**如果遇到 "Unable to identify user" 錯誤，優先檢查 Redis**：

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Environment**

**確認 `REDIS_URL` 環境變數**：
```
變數名稱：REDIS_URL
變數值：redis://red-d406i56uk2gs739qn8ig:6379
```

⚠️ **重要**：
- 必須使用 **Internal URL**（`redis://` 開頭，不需要密碼）
- 不要使用 External URL（`rediss://` 開頭，那是給地端開發用的）
- 詳細排除步驟見：`docs/reference/guides/NEXT_ENGINE_REDIS_TROUBLESHOOTING.md`

### 1. Render（後端）環境變數設定

前往 [Render Dashboard](https://dashboard.render.com/) → **connector** 專案 → **Environment**

**新增以下 4 個環境變數**：

| 變數名稱 | 變數值 |
|---------|--------|
| `NEXTENGINE_CLIENT_ID` | `v6MP5RkVZD9sEo` |
| `NEXTENGINE_CLIENT_SECRET` | `TNeWlyotIYkbSJ5XOVhZU2HMLuR16wB7rDPaj3mF` |
| `NEXTENGINE_REDIRECT_URI` | `https://connector-o5hx.onrender.com/api/auth/next-engine/callback` |
| `NEXTENGINE_AUTH_KEY` | `test-auth-key-12345` |

⚠️ **重要**：
- `NEXTENGINE_REDIRECT_URI` 必須使用 Render 的實際 URL
- 如果 Render URL 不是 `connector-o5hx.onrender.com`，請替換為實際 URL
- 環境變數設定後，Render 會自動重新部署

### 2. Next Engine Developer 後台設定

前往 [Next Engine Developer Console](https://developer.next-engine.com/)

**設定 Callback URL**：
```
https://connector-o5hx.onrender.com/api/auth/next-engine/callback
```

⚠️ **重要**：
- 必須與 Render 環境變數 `NEXTENGINE_REDIRECT_URI` 完全一致
- URL 必須是 HTTPS
- 路徑必須完全匹配：`/api/auth/next-engine/callback`

### 3. 確認 Vercel 環境變數

前往 [Vercel Dashboard](https://vercel.com/dashboard) → **connector** 專案 → **Settings** → **Environment Variables**

**確認已設定**：
- `NEXT_PUBLIC_BACKEND_URL` = `https://connector-o5hx.onrender.com`

---

## 🔍 部署驗證步驟

### 1. 檢查 Render 部署狀態

1. 前往 [Render Dashboard](https://dashboard.render.com/)
2. 進入 **connector** 專案
3. 查看 **"Events"** 或 **"Logs"** 確認部署完成
4. 確認服務狀態為 **"Live"**

### 2. 檢查後端健康狀態

訪問：
```
https://connector-o5hx.onrender.com/api/health
```

應該看到：
```json
{
  "success": true,
  "message": "Service is running",
  "database": "connected"
}
```

### 3. 檢查 Vercel 部署狀態

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 進入 **connector** 專案
3. 查看 **"Deployments"** 確認最新部署完成
4. 確認狀態為 **"Ready"**

### 4. 測試 Next Engine OAuth

1. 訪問前端：`https://connector-theta.vercel.app/`
2. 登入系統
3. 進入 Connections 頁面
4. 點擊「新增 Connection」
5. 選擇「Next Engine」平台
6. 點擊「前往 Next Engine 授權」
7. **驗證點**：
   - ✅ 應該能正常跳轉到 Next Engine 登入頁面
   - ✅ 不應出現 500 錯誤或環境變數缺失錯誤

---

## 📋 快速檢查清單

- [ ] Render 環境變數已設定（4 個 Next Engine 變數）
- [ ] Render 服務已重新部署（環境變數變更後自動觸發）
- [ ] Next Engine Developer 後台 Callback URL 已設定
- [ ] Vercel 環境變數已確認
- [ ] 後端健康檢查通過
- [ ] 前端頁面正常載入
- [ ] Next Engine OAuth 授權流程測試成功

---

## 🆘 如果遇到問題

### 問題：點擊「前往 Next Engine 授權」出現 500 錯誤

**檢查**：
1. Render 環境變數是否已設定（`NEXTENGINE_CLIENT_ID`、`NEXTENGINE_CLIENT_SECRET`、`NEXTENGINE_REDIRECT_URI`）
2. Render 服務是否已重新部署
3. 查看 Render Logs 確認錯誤訊息

### 問題：授權後無法返回

**檢查**：
1. Next Engine Developer 後台的 Callback URL 是否正確設定
2. Callback URL 必須與 Render 環境變數 `NEXTENGINE_REDIRECT_URI` 完全一致
3. URL 必須是 HTTPS

---

## 📝 相關文件

- 完整部署檢查清單：`docs/reference/guides/NEXT_ENGINE_DEPLOYMENT_CHECKLIST.md`
- 環境變數設定：`docs/reference/guides/ENV_SETUP_GUIDE.md`
- Next Engine 平台規格：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`

