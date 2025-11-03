# 工具腳本說明

## scripts/start-dev.sh

一鍵啟動開發環境的腳本。

**功能**：
- 自動檢測是否需要 Docker PostgreSQL
- 自動判斷是否使用 Neon
- 啟動後端服務
- 啟動前端服務

**使用方法**：
```bash
./scripts/start-dev.sh
```

## scripts/start-ngrok.sh

啟動 ngrok 隧道的腳本。

**功能**：
- 啟動 ngrok 連接到後端端口 3001
- 輸出公開的 HTTPS URL

**使用方法**：
```bash
./scripts/start-ngrok.sh
```

## scripts/test-complete-flow.js

完整流程測試腳本。

**功能**：
- 測試健康檢查端點
- 測試商店列表 API
- 測試 Webhook 事件 API
- 生成授權 URL
- 驗證簽名生成

**使用方法**：
```bash
node scripts/test-complete-flow.js
```

**注意**：這只測試 API 端點，不包含實際的 OAuth 授權流程。實際授權需要手動測試。

## scripts/update-ngrok-config.js

更新 ngrok URL 配置的腳本。

**功能**：
- 讀取當前 ngrok URL
- 更新後端配置文件
- 更新前端配置

**使用方法**：
```bash
node scripts/update-ngrok-config.js
```

## 測試建議

### 基礎功能測試

1. 啟動所有服務
2. 運行測試腳本：
   ```bash
   node scripts/test-complete-flow.js
   ```

### OAuth 授權測試

1. 開啟前端頁面
2. 點擊「新增商店授權」
3. 輸入 Handle
4. 完成授權流程
5. 確認資料正確顯示

### 手動 API 測試

使用 curl 測試各端點：

```bash
# 健康檢查
curl http://localhost:3001/api/health

# 商店列表
curl http://localhost:3001/api/stores

# Webhook 事件
curl http://localhost:3001/webhook/events
```

---

**最後更新**: 2025-11-03

