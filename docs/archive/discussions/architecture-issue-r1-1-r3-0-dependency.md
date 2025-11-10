# R1.1 與 R3.0 依賴關係問題報告

**發現日期**: 2025-11-10  
**問題類型**: 架構依賴與測試可行性  
**嚴重程度**: 🔴 高（影響 Story 可測試性）

---

## 🚨 問題描述

### 核心問題

**R1.1 在前端使用了新的 Connection 欄位（`platform`、`connectionId`、`connectionItemId`），但後端 API 和資料庫還沒有這些欄位（R3.0 才會建立）。**

### 具體狀況

1. **前端狀態管理（R1.1）**：
   - Zustand Store 使用 `selectedPlatform`、`selectedConnectionId`、`selectedConnectionItemId`
   - URL Query 使用 `?platform=` / `?connectionId=` / `?connectionItemId=`
   - 需要這些欄位才能運作

2. **後端資料結構（R3.0 才會建立）**：
   - `/api/stores` 回傳的是舊的 `stores` 表結構
   - 沒有 `platform`、`connectionId`、`connectionItemId` 欄位
   - 只有 `id`、`shoplineId`、`handle`、`userId` 等舊欄位

3. **過渡期映射邏輯**：
   - 前端各頁面有分散的映射邏輯（`mapStoreToConnection`、`resolveConnectionItem`）
   - 使用型別斷言 `as StoreLike` 來處理不存在的欄位
   - 映射邏輯：`platform = 'shopline'`（硬編碼）、`connectionId = shoplineId`、`connectionItemId = id`

---

## ⚠️ 影響範圍

### 1. 測試可行性問題

- ❌ **R1.1 無法完整測試**：因為後端資料結構不匹配
- ❌ **無法驗證 Connection 狀態同步**：因為資料來源還是舊結構
- ❌ **無法驗證跨頁面同步**：因為資料映射可能不一致

### 2. 型別安全問題

- ⚠️ `StoreInfo` 型別定義沒有 `platform`、`connectionId` 欄位
- ⚠️ 使用 `as StoreLike` 型別斷言，失去型別檢查保護
- ⚠️ 映射邏輯分散在各個頁面，容易不一致

### 3. 維護性問題

- ⚠️ 過渡期映射邏輯需要手動維護
- ⚠️ R3.0 完成後需要移除這些映射邏輯
- ⚠️ 如果映射邏輯有 bug，會影響所有使用 Connection 狀態的功能

---

## 📋 當前實作狀況

### 過渡期映射邏輯（分散在各頁面）

**index.tsx**:
```typescript
const platform = primary.platform ?? 'shopline'
const connectionId = primary.connectionId ?? primary.shoplineId ?? primary.id ?? null
const connectionItemId = primary.id ?? primary.shoplineId ?? null
```

**admin-api-test.tsx**:
```typescript
const mapStoreToConnection = (store: StoreInfo): ConnectionParams => ({
  platform: (store as any).platform ?? 'shopline',
  connectionId: (store as any).connectionId ?? store.shoplineId ?? store.id ?? null,
  connectionItemId: store.id ?? store.shoplineId ?? null,
})
```

**webhook-test.tsx**:
```typescript
const platform = (target as any).platform ?? 'shopline'
const connectionId = (target as any).connectionId ?? target.shoplineId ?? target.id ?? null
```

### 問題

1. **映射邏輯不一致**：各頁面的映射方式略有不同
2. **型別不安全**：使用 `as any` 或 `as StoreLike` 斷言
3. **硬編碼平台**：`platform = 'shopline'` 硬編碼，無法支援多平台

---

## 💡 建議解決方案

### 方案 A: 統一映射工具函數（推薦）

**優點**：
- 統一映射邏輯，避免不一致
- 型別安全，提供明確的型別定義
- 易於維護，R3.0 完成後只需修改一個地方

**實作**：
```typescript
// frontend/utils/storeToConnection.ts
export function mapStoreToConnection(store: StoreInfo): ConnectionParams {
  return {
    platform: 'shopline', // 過渡期：硬編碼，R3.0 後從 store.platform 取得
    connectionId: store.shoplineId ?? store.id ?? null,
    connectionItemId: store.id ?? store.shoplineId ?? null,
  }
}

export function findStoreByConnectionItemId(
  stores: StoreInfo[],
  connectionItemId: string
): StoreInfo | null {
  return stores.find(s => s.id === connectionItemId || s.shoplineId === connectionItemId) ?? null
}
```

**使用**：
```typescript
import { mapStoreToConnection } from '../utils/storeToConnection'

const connection = mapStoreToConnection(store)
```

### 方案 B: 擴展 StoreInfo 型別（過渡期）

**優點**：
- 型別定義明確
- 不需要型別斷言

**實作**：
```typescript
// frontend/types.ts
export interface StoreInfo {
  id: string
  shoplineId: string
  handle?: string
  // ... 其他欄位
  
  // 過渡期欄位（R3.0 後會從後端取得）
  platform?: string
  connectionId?: string
  connectionItemId?: string
}
```

**問題**：
- 型別定義與實際資料不符（後端還沒有這些欄位）
- 可能造成混淆

### 方案 C: 調整 Story 順序（不推薦）

**說明**：
- 先完成 R3.0，再進行 R1.1
- 這樣 R1.1 就可以直接使用後端的 Connection 資料

**問題**：
- 違反 Run 規劃的執行順序
- R3.0 需要 R1.1 的前端狀態管理才能測試

---

## ✅ 建議行動

### 立即修正（優先級 1）

1. **建立統一的映射工具函數**：
   - 建立 `frontend/utils/storeToConnection.ts`
   - 統一所有頁面的映射邏輯
   - 提供明確的型別定義

2. **更新型別定義**：
   - 在 `StoreInfo` 中加入過渡期欄位的註解說明
   - 或建立 `StoreInfoLegacy` 和 `StoreInfoConnection` 兩個型別

3. **更新文件**：
   - 在 Story R1.1 文件中說明過渡期處理方式
   - 標註 R3.0 完成後需要移除的映射邏輯

### 短期改善（優先級 2）

1. **加入測試**：
   - 為映射函數加入單元測試
   - 確保映射邏輯正確

2. **加入註解**：
   - 在映射邏輯處加入 `// TODO: R3.0 後移除此映射邏輯` 註解
   - 說明過渡期的處理方式

### 長期優化（優先級 3）

1. **R3.0 完成後**：
   - 移除所有映射邏輯
   - 更新型別定義
   - 更新測試

---

## 📝 結論

### 問題確認

- ✅ **問題確實存在**：R1.1 依賴了 R3.0 的資料結構，但 R3.0 還沒完成
- ✅ **過渡期處理不完整**：映射邏輯分散且不一致
- ⚠️ **測試可行性受影響**：R1.1 無法完整測試 Connection 狀態同步

### 建議

1. **立即修正**：建立統一的映射工具函數，確保過渡期邏輯一致
2. **文件更新**：在 Story 文件中明確說明過渡期處理方式
3. **測試策略**：R1.1 的測試重點放在「狀態管理邏輯」而非「資料結構」，R3.0 完成後再進行完整測試

### 風險評估

- **技術風險**：低（過渡期映射邏輯相對簡單）
- **時程風險**：中（需要額外時間建立映射工具）
- **測試風險**：高（R1.1 無法完整測試，需要 R3.0 完成後才能驗證）

---

**最後更新**: 2025-11-10

