# Shopline OAuth 實測資訊

## ✅ 服務狀態

所有服務已成功啟動並配置完成：

### 🌐 本機服務
- **後端**: http://localhost:3001 ✓
- **前端**: http://localhost:3000 ✓
- **ngrok 管理**: http://localhost:4040

### 🌍 ngrok 對外服務
- **完整 URL**: https://f79597ed859e.ngrok-free.app ✓
- **Backend API**: https://f79597ed859e.ngrok-free.app/api/

### 🔧 環境設定
- ✅ 後端 `.env`: 所有配置已設定（資料庫、Shopline API、ngrok URL）
- ✅ 前端 `.env`: ngrok URL 已設定
- ✅ 後端已關閉 X-Frame-Options，允許被 Shopline 嵌入
- ✅ Callback 端點返回 HTML 頁面並自動重導向
- ✅ 設定 ignoreTrailingSlash 解決 404 問題
- ✅ 配置統一使用 `.env` 系統，不再依賴 `config.json`

---

## 📋 Shopline App 設定

前往 **Shopline Console > 應用程式管理** 設定以下內容：

### 基本資訊設定（Basic Information Settings）

#### 1️⃣ App URL（應用程式 URL）
```
https://f79597ed859e.ngrok-free.app/api/auth/shopline/install
```

**說明**：這是應用程式的安裝入口點，Shopline 會向這個 URL 發送安裝請求。

#### 2️⃣ App callback URL（應用程式回調 URL）
```
https://f79597ed859e.ngrok-free.app/api/auth/shopline/callback
```

**說明**：這是 OAuth 授權完成後的重定向地址。

### Webhook 設定（在其他分頁）

**Webhook URL**：
```
https://f79597ed859e.ngrok-free.app/webhook/shopline
```

**說明**：這是接收 Shopline 事件通知的 Webhook 端點。

---

## 🔗 測試授權流程

### 方法一：從前端儀表板啟動

1. 開啟瀏覽器訪問：http://localhost:3000
2. 點擊「新增商店授權」按鈕
3. 在對話框中輸入商店 Handle（例如: `paykepoc`）
4. 點擊「確認授權」
5. 會自動跳轉到 Shopline 授權頁面
6. 在 Shopline 完成授權
7. 自動重導回前端，商店資料已儲存

### 測試重點

✅ 簽名驗證  
✅ 時間戳驗證  
✅ App Key 匹配  
✅ Token 交換  
✅ 商店資訊儲存  
✅ 自動重導向  
✅ Handle 顯示  
✅ Token 到期時間顯示  

---

## 📊 預期結果

### 成功授權後

前端應顯示：
- 商店 Handle (例如: `paykepoc`)
- 商店網域: `paykepoc.myshopline.com`
- Token 到期時間
- 建立時間和最後更新時間

資料庫應包含：
- `shoplineId`: 商店 ID
- `handle`: 商店 Handle
- `accessToken`: JWT Token
- `expiresAt`: Token 到期時間
- `domain`: 商店完整域名
- `scope`: 授權範圍
- `isActive`: true

---

## 🐛 常見問題

### 1. 404 錯誤

**原因**: Callback URL 有尾隨斜線不匹配

**解決**: 後端已設定 `ignoreTrailingSlash: true`

### 2. X-Frame-Options 錯誤

**原因**: 瀏覽器阻止 iframe 嵌入

**解決**: 後端已設定 `frameguard: false`

### 3. 簽名驗證失敗

**可能原因**:
- 參數未按字母順序排序
- 時間戳格式不正確
- App Secret 錯誤

**檢查**: 查看後端日誌 `tail -f /tmp/backend.log`

### 4. Token 欄位 undefined

**原因**: JWT 格式或欄位名稱不正確

**解決**: 確保使用正確的 JWT 解析邏輯

---

## 📝 日誌查看

### 後端日誌

```bash
tail -f /tmp/backend.log
```

### ngrok 流量

訪問 http://localhost:4040 查看所有請求

---

## ⚠️ 注意事項

1. **ngrok URL 會變更**: 每次重啟 ngrok，URL 會改變
2. **必須更新配置**: URL 變更後需更新 Shopline 和後端配置
3. **測試用 Handle**: 目前只有 `paykepoc` 在測試白名單中
4. **Token 有效期**: 預設 10 小時，需要實作自動刷新

---

**最後更新**: 2025-11-03
