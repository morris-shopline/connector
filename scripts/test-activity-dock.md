# Activity Dock 檢查指南

## 檢查方式

### 方式 1: 瀏覽器開發者工具檢查（推薦）

1. **打開應用程式**（例如：`http://localhost:3000/connections`）
2. **打開瀏覽器開發者工具**（F12 或 Cmd+Option+I）
3. **切換到 Network 標籤**
4. **過濾 `audit-logs`**，觀察是否有請求：
   - 應該看到 `GET /api/audit-logs?limit=50`
   - 狀態碼應該是 `200`
   - 回應應該包含 `success: true` 和 `data` 陣列

5. **切換到 Console 標籤**，檢查是否有錯誤：
   - 不應該有 `Failed to fetch audit logs` 錯誤
   - 不應該有 CORS 錯誤

6. **檢查 Activity Dock 顯示**：
   - 頁面底部應該有 Activity Dock 區域
   - 如果有審計記錄，應該顯示記錄列表
   - 如果沒有記錄，應該顯示「目前沒有通知」

### 方式 2: 直接測試 API（使用 curl 或 Postman）

```bash
# 1. 先取得登入 token（從瀏覽器 localStorage 複製）
TOKEN="your-auth-token-here"

# 2. 測試 API
curl -X GET "http://localhost:3001/api/audit-logs?limit=50" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

預期回應：
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "userId": "...",
      "connectionId": "...",
      "operation": "connection.create",
      "result": "success",
      "createdAt": "2025-11-11T...",
      ...
    }
  ]
}
```

### 方式 3: 產生測試資料

執行以下操作來產生審計記錄：

1. **新增 Connection**：
   - 點擊「新增 Connection」
   - 完成 OAuth 流程
   - 應該在 Activity Dock 看到「Connection "xxx" 已成功建立」

2. **重新授權 Connection**：
   - 點擊 Connection 的「重新授權」按鈕
   - 完成 OAuth 流程
   - 應該在 Activity Dock 看到「Connection "xxx" 已成功重新授權」

3. **停用/啟用 Connection Item**：
   - 在 Connection Items 表格中點擊「停用」或「啟用」
   - 應該在 Activity Dock 看到對應的記錄

### 方式 4: 檢查資料庫

```sql
-- 檢查審計記錄是否存在
SELECT * FROM integration_audit_logs 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## 常見問題排查

### 問題 1: Activity Dock 顯示「載入中...」一直轉圈

**可能原因**：
- API 請求失敗
- 後端服務未啟動
- 認證 token 無效

**檢查步驟**：
1. 檢查 Network 標籤中的請求狀態
2. 檢查 Console 是否有錯誤訊息
3. 確認後端服務正在運行

### 問題 2: Activity Dock 顯示「目前沒有通知」

**可能原因**：
- 資料庫中沒有審計記錄
- API 返回空陣列

**檢查步驟**：
1. 執行上述「方式 3」產生測試資料
2. 檢查資料庫是否有記錄
3. 檢查 API 回應是否包含資料

### 問題 3: Activity Dock 顯示錯誤訊息

**可能原因**：
- API 返回錯誤
- 資料格式不正確

**檢查步驟**：
1. 檢查 Network 標籤中的 API 回應
2. 檢查 Console 中的錯誤訊息
3. 檢查後端日誌

## 預期行為

- ✅ Activity Dock 應該顯示在頁面底部
- ✅ 每 5 秒自動刷新（可以在 Network 標籤觀察到）
- ✅ 顯示最近 10 筆審計記錄
- ✅ 每筆記錄應該有：
  - 圖標（根據 operation 類型）
  - 訊息文字
  - 時間戳記
- ✅ 錯誤記錄應該以紅色顯示

