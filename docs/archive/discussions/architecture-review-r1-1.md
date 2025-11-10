# Story R1.1 架構檢查報告

**檢查日期**: 2025-11-10  
**檢查範圍**: Story R1.1 實作與向後相容性  
**檢查者**: Agent (架構師待確認)

---

## 📋 架構要求對齊檢查

### ✅ 符合決策文件要求

| 決策要求 | 實作狀態 | 說明 |
|---------|---------|------|
| **Router 事件驅動** | ✅ | 使用 `router.events.on('routeChangeComplete')` 監聽路由變化 |
| **URL 單一來源** | ✅ | UI 操作只更新 URL，Store 從 Router 事件更新 |
| **取消 useEffect 循環** | ✅ | 移除互相觸發的 useEffect，使用 Router 事件單向同步 |
| **提供 Hook 封裝** | ✅ | `useConnectionRouting` 提供完整介面 |

### ✅ 架構實作重點

1. **`useConnectionRouting` Hook**：
   - ✅ `parseConnectionQuery()` - 解析 URL Query
   - ✅ `buildConnectionQuery()` - 建立 Query 物件
   - ✅ `applyConnection()` - 封裝 `router.replace`
   - ✅ `currentConnection` - 取得當前 Connection 狀態
   - ✅ `resetConnection()` - 清除狀態

2. **Zustand Store 更新**：
   - ✅ `selectedPlatform`、`selectedConnectionId`、`selectedConnectionItemId` 取代 `selectedHandle`
   - ✅ `lockConnectionItem` / `unlockConnectionItem` 取代 `lockHandle` / `unlockHandle`
   - ✅ `resetState()` 用於登出清理

3. **localStorage 快取**：
   - ✅ `connectionCache.ts` 提供版本控管
   - ✅ `loadConnectionCache()` / `saveConnectionCache()` / `clearConnectionCache()`

---

## ⚠️ 向後相容性問題

### 問題 1: 後端 API 仍使用 `handle` 參數

**現況**：
- 後端 API 路徑：`/api/stores/:handle/info`、`/api/stores/:handle/products` 等
- 前端 URL Query：已改為 `connectionItemId`、`connectionId`、`platform`
- 前端需要從 `connectionItemId` 轉換為 `handle` 才能呼叫後端 API

**影響範圍**：
- `useAdminAPI` - 需要 `handle` 參數
- `useWebhookSubscriptions` - 需要 `handle` 參數
- `apiClient` 所有方法 - 需要 `handle` 參數

**當前處理方式**：
```typescript
// admin-api-test.tsx
const activeStore = stores.find(store => 
  store.id === currentConnection.connectionItemId
)
const activeHandle = activeStore?.handle || activeStore?.shoplineId
```

**風險**：
- ⚠️ 如果 `stores` 還沒載入，無法取得 `handle`
- ⚠️ 如果 `connectionItemId` 對應不到 `store`，API 呼叫會失敗
- ⚠️ 舊的 URL 參數（`handle`）不再支援

### 問題 2: 舊 URL 參數（`handle`）不再支援

**現況**：
- `useConnectionRouting` 會清除 `handle` 參數（`LEGACY_KEYS`）
- 舊的書籤或分享連結使用 `?handle=xxx` 會失效

**建議處理方式**：
```typescript
// 在 parseConnectionQuery 中加入向後相容
const handle = typeof query.handle === 'string' ? query.handle : null
if (handle && !connectionItemId) {
  // 從 handle 找到對應的 connectionItemId
  const store = stores.find(s => s.handle === handle)
  if (store) {
    return {
      platform: 'shopline',
      connectionId: store.shoplineId,
      connectionItemId: store.id
    }
  }
}
```

### 問題 3: `stores` 資料載入時序

**現況**：
- `useStores()` 使用 SWR 非同步載入
- `useConnectionRouting` 可能在 `stores` 載入前就執行
- 如果 URL 只有 `connectionItemId`，需要 `stores` 才能解析

**風險**：
- ⚠️ 初始載入時，`connectionItemId` 無法立即轉換為 `handle`
- ⚠️ `resolveConnectionItem` 需要 `stores` 資料，但可能還沒載入

**建議處理方式**：
- 在 `resolveConnectionItem` 中加入等待 `stores` 載入的邏輯
- 或提供 fallback，先使用 `connectionItemId` 作為 `handle`（如果後端支援）

---

## 🔍 既有功能運作檢查

### ✅ 正常運作的功能

1. **登入流程**：
   - ✅ 登入後會載入 `stores`
   - ✅ 如果有預設 Connection，會自動設定 URL Query

2. **商店選擇**：
   - ✅ 點擊商店卡片會更新 URL Query
   - ✅ URL Query 會同步到 Zustand Store
   - ✅ 跨頁面切換會保持狀態

3. **Admin API 測試**：
   - ✅ 可以選擇商店並呼叫 API
   - ✅ 鎖定機制正常運作

4. **Webhook 測試**：
   - ✅ 可以選擇商店並訂閱 Webhook
   - ✅ Token 過期處理正常

### ⚠️ 可能受影響的功能

1. **舊書籤連結**：
   - ⚠️ 使用 `?handle=xxx` 的連結會失效
   - 需要加入向後相容處理

2. **直接輸入 URL**：
   - ⚠️ 如果只有 `connectionItemId`，需要等待 `stores` 載入才能運作
   - 建議加入 loading 狀態或 fallback

3. **API 呼叫時序**：
   - ⚠️ 如果 `stores` 還沒載入，`handle` 無法取得，API 會失敗
   - 建議加入錯誤處理和重試機制

---

## 📝 建議修正項目

### 優先級 1: 向後相容性（必須）

1. **支援舊 URL 參數 `handle`**：
   ```typescript
   // useConnectionRouting.ts
   const parsed = parseConnectionQuery(query)
   if (query.handle && !parsed.connectionItemId) {
     // 從 handle 解析為 Connection 參數
   }
   ```

2. **確保 `stores` 載入後再解析**：
   ```typescript
   // 等待 stores 載入完成
   if (stores.length === 0 && storesLoading) {
     return // 等待載入
   }
   ```

### 優先級 2: 錯誤處理（建議）

1. **API 呼叫失敗時的處理**：
   - 如果 `handle` 無法取得，顯示錯誤訊息
   - 提供重新載入或選擇商店的選項

2. **URL 解析失敗時的處理**：
   - 如果 `connectionItemId` 找不到對應 `store`，清除 URL 參數
   - 或導向到商店列表頁面

### 優先級 3: 使用者體驗（可選）

1. **Loading 狀態**：
   - 在 `stores` 載入時顯示 loading
   - 在 URL 解析時顯示 loading

2. **錯誤提示**：
   - 如果 URL 參數無效，顯示友善的錯誤訊息
   - 提供回到首頁的連結

---

## ✅ 結論

### 架構對齊狀態

- ✅ **符合決策文件要求**：使用 Router 事件驅動，URL 單一來源
- ✅ **架構實作完整**：Hook 封裝、Store 更新、快取機制都已實作
- ⚠️ **向後相容性不足**：舊 URL 參數不支援，需要加入相容處理
- ⚠️ **資料載入時序**：需要確保 `stores` 載入後再解析

### 既有功能運作狀態

- ✅ **核心功能正常**：登入、商店選擇、API 呼叫都能運作
- ⚠️ **邊緣情況需處理**：舊書籤、直接輸入 URL、資料載入時序

### 建議行動

1. **立即修正**：加入舊 URL 參數 `handle` 的向後相容處理
2. **短期改善**：確保 `stores` 載入後再解析 URL
3. **長期優化**：考慮後端 API 也改用 `connectionItemId`（需要後端配合）

---

**最後更新**: 2025-11-10

