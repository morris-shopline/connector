# 重要學習點與經驗總結

本文檔記錄在開發過程中遇到的重要問題、解決方案和關鍵學習點。

## 目錄

1. [OAuth 2.0 流程實作](#oauth-20-流程實作)
2. [簽名驗證挑戰](#簽名驗證挑戰)
3. [JWT Token 處理](#jwt-token-處理)
4. [資料庫設計](#資料庫設計)
5. [前端整合](#前端整合)
6. [開發工具與流程](#開發工具與流程)

---

## OAuth 2.0 流程實作

### 問題 1: 授權 URL 格式不符合官方文件

**問題描述**

Shopline 官方文件顯示的授權 URL 格式為：
```
https://{handle}.myshopline.com/admin/oauth/authorize?response_type=code&client_id={appkey}...
```

但實際可用的 URL 格式為：
```
https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey={appkey}...
```

**解決方案**

參考專案中的 temp 腳本，確認 Shopline 實際使用前端路由而非純後端 API。使用 `/admin/oauth-web/` 路徑並採用 camelCase 參數命名。

**學習點**

- 官方文件可能與實際實作有差異
- 應該參考實際可用的範例代碼
- 前端路由（React/Vue SPA）和後端 API 的區別

### 問題 2: 時間戳單位不一致

**問題描述**

不同的 Shopline API 端點使用不同的時間戳格式：
- 安裝請求：秒級（10 位數）
- 回調請求：毫秒級（13 位數）

**解決方案**

實作自動判斷邏輯：
```typescript
const requestTime = timestamp.length >= 13 
  ? parseInt(timestamp) 
  : parseInt(timestamp) * 1000
```

**學習點**

- API 設計不一致是很常見的
- 需要靈活的解析邏輯
- 錯誤訊息很重要（包含實際值）

### 問題 3: Callback 重導向問題

**問題描述**

OAuth callback 返回 JSON 不適合在 iframe 中顯示，且無法關閉視窗。

**解決方案**

1. 返回 HTML 頁面而非 JSON
2. 實作自動重導向到前端
3. 嘗試關閉彈窗（如果可用）

**學習點**

- 不同的上下文需要不同的回應格式
- 瀏覽器的安全限制（`window.close()`）
- 使用者體驗的考量

---

## 簽名驗證挑戰

### 問題 1: 參數排序重要性

**問題描述**

簽名驗證一直失敗，直到發現參數必須按字母順序排序。

**解決方案**

```typescript
const sortedKeys = Object.keys(params).sort()
const queryString = sortedKeys
  .map(key => `${key}=${params[key]}`)
  .join('&')
```

**學習點**

- HMAC 簽名對輸入順序敏感
- 標準實作需要排序
- 測試所有邊界情況

### 問題 2: 時序攻擊防護

**問題描述**

使用簡單的 `===` 比較簽名容易被時序攻擊。

**解決方案**

使用 Node.js 的 `crypto.timingSafeEqual()`：
```typescript
crypto.timingSafeEqual(
  Buffer.from(expectedSign, 'hex'),
  Buffer.from(receivedSign, 'hex')
)
```

**學習點**

- 密碼學操作需要安全實作
- 關注細節很重要
- 使用標準庫的專業方法

### 問題 3: 可選參數處理

**問題描述**

`lang` 參數是可選的，但必須包含在簽名驗證中。

**解決方案**

使用 `verifyGetSignature()` 自動收集所有參數（除 `sign` 外），無論是否可選。

**學習點**

- 文件中的「可選」可能是驗證時的「必須」
- 自動化的參數收集更可靠
- 測試不同參數組合

---

## JWT Token 處理

### 問題 1: Token 回應格式與預期不同

**問題描述**

預期 Shopline 返回包含 `shop_id`、`shop_domain` 等欄位，但實際只返回 JWT Token。

**解決方案**

實作 JWT 解析：
```typescript
const jwtPayload = JSON.parse(
  Buffer.from(access_token.split('.')[1], 'base64').toString()
)
const shop_id = jwtPayload.storeId
const shop_domain = jwtPayload.domain
const expiresAt = new Date(jwtPayload.exp * 1000)
```

**學習點**

- 預期可能與實際 API 回應不符
- 需要先了解實際回應結構
- 實作調試輸出來驗證

### 問題 2: 欄位命名不一致

**問題描述**

期待 `snake_case` 但實際是 `camelCase`。

**解決方案**

調整 TypeScript 介面定義和解析邏輯以符合實際格式。

**學習點**

- JavaScript/Node.js 生態系統偏好 camelCase
- API 設計不一致
- 適配性很重要

---

## 資料庫設計

### 問題 1: Handle 沒有預先儲存

**問題描述**

最初的 schema 沒有 `handle` 欄位，導致顯示「未命名商店」。

**解決方案**

新增 `handle` 和 `expiresAt` 欄位到 schema，並在 OAuth callback 時儲存。

**學習點**

- 先理解完整需求再設計 schema
- 後續新增欄位是正常的
- Prisma 的 `db push` 很方便

### 問題 2: API 回應缺少欄位

**問題描述**

資料庫有資料，但 API 回應缺少某些欄位。

**解決方案**

確保 `getAllStores()` 的 `select` 包含所有需要的欄位：
```typescript
select: {
  id: true,
  shoplineId: true,
  handle: true,  // 需要明確包含
  expiresAt: true,  // 需要明確包含
  // ...
}
```

**學習點**

- Prisma 的 `select` 必須明確指定
- 不要假設所有欄位都會返回
- 型別定義和實際回傳要一致

---

## 前端整合

### 問題 1: 環境變數暴露

**問題描述**

App Key 和 Secret 寫在前端代碼中不安全。

**解決方案**

保持敏感資訊僅在後端，前端只生成簽名所需的部分。

**學習點**

- 前端代碼可被查看
- 敏感資訊必須在後端
- 前端只能有公開資訊

### 問題 2: 授權對話框 UX

**問題描述**

硬編碼 `handle` 不方便，需要更好的 UX。

**解決方案**

實作 Modal 對話框讓使用者輸入 `handle`，預設值為測試 Handle。

**學習點**

- 使用者體驗很重要
- 靈活性 vs 便利性
- 預設值要實用

### 問題 3: 即時更新

**問題描述**

授權完成後，前端列表未即時更新。

**解決方案**

使用 SWR 的 `mutate()` 強制重新驗證，或在重新載入時自動刷新。

**學習點**

- 快取管理和即時更新
- SWR 的強大功能
- 使用者反饋

---

## 開發工具與流程

### ngrok 的使用

**學習點**

- 本地開發需要 HTTPS
- ngrok 免費版足夠開發使用
- URL 會變更，需要更新配置

### 日誌的重要性

**學習點**

- 詳細的日誌幫助調試
- 結構化日誌更好
- 開發時可用 `console.log`，生產環境需要日誌系統

### 迭代開發

**學習點**

- 小步驟迭代
- 每步測試
- 不要一次改太多

### 文件的重要性

**學習點**

- 記錄決策和原因
- 更新文件很重要
- 好的文件節省時間

---

## 最佳實踐總結

### 程式碼品質

1. **型別安全**: 使用 TypeScript 和嚴格模式
2. **錯誤處理**: 預期失敗情況並適當處理
3. **測試**: 覆蓋關鍵路徑
4. **可讀性**: 清楚的變數和函數名稱

### API 整合

1. **簽名驗證**: 使用標準庫和安全方法
2. **錯誤訊息**: 提供有意義的錯誤資訊
3. **日誌**: 記錄關鍵步驟
4. **測試**: 使用實際 API 測試

### 資料庫設計

1. **Schema 演化**: 使用 migration 管理變更
2. **查詢優化**: 只取需要的欄位
3. **關係設計**: 清楚的外鍵和約束
4. **型別對應**: Prisma 與 TypeScript 同步

### 開發流程

1. **環境設定**: 用 `.example` 文件
2. **相依性管理**: 鎖定版本
3. **文檔**: 保持更新
4. **Git**: 清晰的提交訊息

---

## 常見陷阱

### ❌ 不要做

- 假設 API 行為符合文件
- 使用簡單的字串比較簽名
- 在前端儲存敏感資訊
- 忽略可選參數在簽名中的作用
- 假設資料庫欄位會自動返回

### ✅ 應該做

- 先測試實際 API 行為
- 使用標準的安全方法
- 敏感資訊保持在後端
- 所有參數都參與簽名驗證
- 明確指定需要的欄位

---

## 參考資源

- [Shopline API 文件](https://developer.shopline.com)
- [OAuth 2.0 規範](https://oauth.net/2/)
- [JWT.io](https://jwt.io/)
- [Node.js Crypto 文件](https://nodejs.org/api/crypto.html)

---

**最後更新**: 2025-11-03

