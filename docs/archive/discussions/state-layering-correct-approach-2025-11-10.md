# 正確的 State 分層實作方案

**日期**: 2025-11-10  
**目的**: 按照正確的 state 分層重新實作 Connection 狀態管理

---

## 確認的使用場景

**Connection 參數是可分享的上下文**：
- Admin A 分享：`/webhook-test?platform=nextengine&connectionId=xxx`
- Admin B 點擊後登入，直接看到該 connector 的 webhook 頁面
- 需要 deep link 功能

---

## 正確的 State 分層

### 層級定義

| 層 | 承載內容 | 來源 | 同步方向 |
|---|---------|------|---------|
| **URL** | 可分享的上下文（Connection 參數） | 外部來源（可 deep link） | **單向：URL → Zustand（只做一次初始化）** |
| **Zustand** | UI state（當前選取的 Connection） | **唯一 Source of Truth** | - |
| **localStorage** | 快取（刷新頁面時恢復） | Zustand | Zustand → localStorage |

### 核心原則

1. **Zustand 是唯一的 Source of Truth**
   - 所有 UI 狀態都在 Zustand 中
   - URL 只用來「初始化」Zustand，不是 state storage

2. **URL → Zustand：只做一次初始化**
   - 頁面載入時，從 URL 讀取 Connection 參數
   - 初始化 Zustand Store
   - **不做反向同步**

3. **用戶操作時：更新 Zustand，然後「推送」URL**
   - 用戶點擊商店 → 更新 Zustand Store
   - 然後「推送」URL（`router.push` 或 `router.replace`）
   - 這是「單向推送」，不是「同步」

4. **避免循環**
   - URL 變化 → 初始化 Zustand（只做一次）
   - Zustand 變化 → 推送 URL（用戶操作時）
   - **不應該有「Zustand 變化 → URL 變化 → Zustand 變化」的循環**

---

## 實作方案

### 1. 移除所有「Zustand → URL」的自動同步

**移除**：
- ❌ `useEffect` 監聽 Zustand 變化，自動更新 URL
- ❌ `syncFromRouter` 中更新 URL 的邏輯
- ❌ 頁面層的 `useEffect` 自動設置 Connection

**保留**：
- ✅ 用戶操作時，明確調用 `router.push` 或 `router.replace`
- ✅ 頁面載入時，從 URL 初始化 Zustand（只做一次）

### 2. 簡化 `useConnectionRouting` Hook

**新的設計**：

```typescript
export const useConnectionRouting = () => {
  const router = useRouter()
  const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
  
  // 1. 初始化：URL → Zustand（只做一次）
  useEffect(() => {
    if (!router.isReady) return
    
    const params = parseConnectionQuery(router.query)
    setSelectedConnection(params)
  }, [router.isReady]) // 只依賴 router.isReady，不依賴 router.query
  
  // 2. 用戶操作：更新 Zustand，然後推送 URL
  const applyConnection = useCallback(async (params: ConnectionParams) => {
    // 先更新 Zustand
    setSelectedConnection(params)
    
    // 然後推送 URL（單向推送，不是同步）
    await router.push({
      pathname: router.pathname,
      query: buildConnectionQuery(params),
    })
  }, [router, setSelectedConnection])
  
  // 3. 讀取當前 Connection（從 Zustand）
  const currentConnection = useStoreStore((state) => ({
    platform: state.selectedPlatform,
    connectionId: state.selectedConnectionId,
    connectionItemId: state.selectedConnectionItemId,
  }))
  
  return {
    currentConnection,
    applyConnection,
  }
}
```

### 3. 移除頁面層的自動設置邏輯

**移除**：
- ❌ `useEffect` 檢查 `currentConnection.connectionItemId`，如果沒有就自動設置
- ❌ `syncFromRouter` 中的 URL 補齊邏輯

**改為**：
- ✅ 頁面載入時，如果 URL 沒有 Connection 參數，顯示「請選擇商店」
- ✅ 用戶明確操作時（點擊商店、選擇下拉選單），才更新 URL

---

## 修正後的流程

### 場景 1：用戶點擊商店卡片

1. 用戶點擊商店卡片
2. 調用 `applyConnection(params)`
3. `applyConnection` 更新 Zustand Store
4. `applyConnection` 推送 URL（`router.push`）
5. 導航到新頁面
6. 新頁面載入時，從 URL 初始化 Zustand（只做一次）
7. ✅ **沒有循環**

### 場景 2：用戶直接輸入 URL

1. 用戶輸入：`/webhook-test?platform=nextengine&connectionId=xxx`
2. 頁面載入
3. `useEffect` 從 URL 初始化 Zustand（只做一次）
4. ✅ **沒有循環**

### 場景 3：用戶刷新頁面

1. 用戶刷新頁面
2. URL 保持不變（因為是瀏覽器歷史）
3. 頁面載入時，從 URL 初始化 Zustand（只做一次）
4. ✅ **沒有循環**

---

## 需要修正的檔案

1. **`frontend/hooks/useConnectionRouting.ts`**
   - 移除 `syncFromRouter` 中的 URL 更新邏輯
   - 簡化為「URL → Zustand 初始化」和「用戶操作 → 推送 URL」

2. **`frontend/pages/index.tsx`**
   - 移除 `useEffect` 自動設置 Connection 的邏輯

3. **`frontend/pages/admin-api-test.tsx`**
   - 移除 `useEffect` 自動設置 Connection 的邏輯

4. **`frontend/pages/webhook-test.tsx`**
   - 移除 `useEffect` 自動設置 Connection 的邏輯

---

## 關鍵改變

### Before（錯誤）：
- URL 和 Zustand 互相同步
- `syncFromRouter` 中更新 URL
- 頁面層自動設置 Connection

### After（正確）：
- Zustand 是唯一的 Source of Truth
- URL → Zustand：只做一次初始化
- 用戶操作 → 更新 Zustand → 推送 URL（單向推送）

---

## 下一步

1. 確認這個方案是否符合你的需求
2. 開始修正實作
3. 測試所有場景（點擊商店、直接輸入 URL、刷新頁面）

