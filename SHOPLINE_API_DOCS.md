# Shopline API 官方文件重點

## 1. 應用授權 (App Authorization)
**文件**: https://developer.shopline.com/docs/apps/api-instructions-for-use/app-authorization?version=v20260301

### OAuth 2.0 授權流程

#### 步驟 1: 驗證應用安裝請求
當商家安裝應用時，Shopline 會向應用 URL 發送 GET 請求：
```
GET {app_url}?appkey={appkey}&handle={handle}&timestamp={timestamp}&sign={sign}
```

**參數說明**:
- `appkey`: 應用密鑰
- `handle`: 商店標識符
- `timestamp`: 時間戳
- `sign`: 簽名

#### 步驟 2: 請求授權碼
確認商家需要授權後，重定向商家至 Shopline 授權頁面：
```
https://{handle}.myshopline.com/admin/oauth/authorize?response_type=code&client_id={appkey}&redirect_uri={redirect_uri}&scope={scope}&state={state}
```

**參數說明**:
- `response_type`: 固定為 "code"
- `client_id`: 應用密鑰 (appkey)
- `redirect_uri`: 回調地址
- `scope`: 權限範圍
- `state`: 狀態參數

#### 步驟 3: 獲取訪問令牌
商家授權後，使用授權碼請求訪問令牌：
```
POST https://{handle}.myshopline.com/admin/oauth/token/create
```

**Headers**:
```
Content-Type: application/json
appkey: {appkey}
timestamp: {timestamp}
sign: {sign}
```

**Body**:
```json
{
  "code": "{authorization_code}"
}
```

## 2. 生成和驗證簽名 (Generate and Verify Signatures)
**文件**: https://developer.shopline.com/docs/apps/api-instructions-for-use/generate-and-verify-signatures?version=v20260301

### 簽名生成算法
使用 HMAC-SHA256 算法：

1. 將參數按鍵名排序
2. 拼接成 `key1=value1&key2=value2` 格式
3. 使用 App Secret 作為密鑰進行 HMAC-SHA256 加密
4. 結果轉換為十六進制字串

### 簽名驗證
1. 使用相同算法生成期望簽名
2. 與接收到的簽名進行比較
3. 使用 `crypto.timingSafeEqual()` 防止時序攻擊

## 3. 訪問範圍 (Access Scope)
**文件**: https://developer.shopline.com/docs/apps/api-instructions-for-use/access-scope?version=v20260301

### 常用權限範圍
- `read_products`: 讀取商品資訊
- `write_products`: 修改商品資訊
- `read_orders`: 讀取訂單資訊
- `write_orders`: 修改訂單資訊
- `read_customers`: 讀取客戶資訊
- `write_customers`: 修改客戶資訊

## 重要注意事項

1. **授權 URL**: 使用商店域名 `{handle}.myshopline.com`，不是 `api.shopline.com`
2. **簽名驗證**: 所有請求都必須驗證簽名
3. **時間戳檢查**: 請求時間戳不能超過 5 分鐘
4. **HTTPS**: 所有 API 調用都必須使用 HTTPS
5. **錯誤處理**: 必須妥善處理各種錯誤情況

## 4. App Bridge 開發工具

App Bridge 提供 UI 元件庫和通訊能力，讓嵌入式應用程式可以在 SHOPLINE Admin 中顯示統一的官方元件。

### 相關文件

- **概述**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/overview?version=v20260301
- **快速開始**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/getting-started?version=v20260301
- **Redirect Action**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/redirect?version=v20260301
- **Authorization Action**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/authorization?version=v20260301
- **Message Action**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/message?version=v20260301
- **Subscribe Action**: https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/subscribe?version=v20260301

詳細使用指南請參見：[App Bridge 使用指南](docs/APP_BRIDGE.md)

## 當前配置

- **App Key**: `4c951e966557c8374d9a61753dfe3c52441aba3b`
- **App Secret**: `dd46269d6920f49b07e810862d3093062b0fb858`
- **Shop Handle**: `paykepoc`
- **Shop URL**: `https://paykepoc.myshopline.com/`
- **Redirect URI**: `https://f79597ed859e.ngrok-free.app/api/auth/shopline/callback`
