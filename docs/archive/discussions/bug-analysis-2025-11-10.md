# Bug 分析報告：無限循環與強制登出問題

**日期**: 2025-11-10  
**問題**: 點擊「Webhook 管理」被迫登出、點擊商店 Crash、點擊「Admin API 測試」Crash

---

## 問題現象

1. **點擊「Webhook 管理」被迫登出**
2. **點擊商店，Crash** - "Maximum update depth exceeded"
3. **點擊「Admin API 測試」，Crash** - "Maximum update depth exceeded"

錯誤訊息顯示 `useConnectionRouting` hook 中的 `syncFromRouter` 和 `syncState` 不斷重複執行。

---

## 架構決策要求（connection-state-sync.md）

### 核心原則

1. **URL 是唯一真實來源**
2. **Router 事件驅動**：
   - 使用 Next.js `router.events` 監聽 `routeChangeComplete`
   - 根據新 URL 更新 Zustand store
   - **取消 useEffect 互相寫回 URL 與 Store 的循環邏輯**
3. **操作流程**：
   - UI 切換 Connection 時，僅呼叫 `router.replace({ query: { ... } })`
   - **Store 僅在 Router 事件中接收資料並更新，避免雙向競態**

### 關鍵要求

> **Store 僅在 Router 事件中接收資料並更新，避免雙向競態**

---

## 實作問題分析

### 問題 1：`syncFromRouter` 違反單向同步原則

**位置**: `frontend/hooks/useConnectionRouting.ts` 第 270-274 行、第 307 行

**問題**：
```typescript
// syncFromRouter 函數中
if (isParsedEmpty) {
  const cached = loadConnectionCache()
  if (cached) {
    syncState({ ... })  // ✅ 正確：更新 Store
    await applyToRouter({ ... })  // ❌ 錯誤：違反單向同步原則
  }
}

// 另一個地方
if (resolved.platform !== parsed.platform || resolved.connectionId !== parsed.connectionId) {
  await applyToRouter(resolved)  // ❌ 錯誤：違反單向同步原則
}
```

**違反原則**：
- 架構決策明確要求「Store 僅在 Router 事件中接收資料並更新」
- `syncFromRouter` 是從 Router 事件觸發的，應該只更新 Store，不應該再更新 URL
- 這會造成：`syncFromRouter` → `applyToRouter` → `router.replace` → `routeChangeComplete` → `syncFromRouter` → **無限循環**

### 問題 2：頁面層的 `useEffect` 造成循環

**位置**: 
- `frontend/pages/admin-api-test.tsx` 第 144-154 行
- `frontend/pages/index.tsx` 第 81-91 行
- `frontend/pages/webhook-test.tsx` 第 69-77 行

**問題**：
```typescript
useEffect(() => {
  if (!defaultConnection) return
  if (currentConnection.connectionItemId) return
  
  applyConnection(defaultConnection)  // ❌ 問題：會觸發 router.replace
}, [applyConnection, currentConnection.connectionItemId, defaultConnection])
```

**循環流程**：
1. `useEffect` 檢查 `currentConnection.connectionItemId` 為空
2. 調用 `applyConnection` → `router.replace`
3. 觸發 `routeChangeComplete` → `syncFromRouter` → 更新 Store
4. `currentConnection` 從 Store 讀取，值變化
5. `useEffect` 依賴項變化，再次執行
6. 如果條件仍滿足，又調用 `applyConnection` → **無限循環**

**違反原則**：
- 架構決策要求「取消 useEffect 互相寫回 URL 與 Store 的循環邏輯」
- 頁面層不應該主動設置 Connection，應該依賴 URL 作為唯一來源

### 問題 3：`useEffect` 依賴項包含 `syncFromRouter`

**位置**: `frontend/hooks/useConnectionRouting.ts` 第 317-327 行、第 330-355 行

**問題**：
```typescript
useEffect(() => {
  syncFromRouter(queryObject)
}, [router.isReady, syncFromRouter])  // ❌ syncFromRouter 在依賴項中

useEffect(() => {
  router.events.on('routeChangeComplete', handleRouteChange)
  return () => router.events.off('routeChangeComplete', handleRouteChange)
}, [router.isReady, router.events, syncFromRouter])  // ❌ syncFromRouter 在依賴項中
```

**問題**：
- `syncFromRouter` 是 `useCallback`，但它的依賴項包含 `applyToRouter`、`syncState` 等
- 當這些依賴項變化時，`syncFromRouter` 會重新建立
- 導致 `useEffect` 重新執行，可能造成不必要的同步

---

## 問題根源分類

### ✅ Story 文件描述：正確
- Story R1.1 和 R3.1 都明確要求「Router 事件驅動」、「單向同步」
- 文件描述清楚，沒有問題

### ✅ 架構決策設計：正確
- `connection-state-sync.md` 明確要求：
  - URL 是唯一真實來源
  - Store 僅在 Router 事件中接收資料並更新
  - 取消 useEffect 互相寫回 URL 與 Store 的循環邏輯
- 設計合理，沒有問題

### ❌ 實作問題：違反架構決策

**核心問題**：
1. **`syncFromRouter` 不應該更新 URL**：違反「Store 僅在 Router 事件中接收資料並更新」原則
2. **頁面層不應該主動設置 Connection**：違反「URL 是唯一真實來源」原則
3. **`useEffect` 依賴項設置不當**：可能造成不必要的重新執行

---

## 解決方案方向

### 1. 修正 `syncFromRouter`：只更新 Store，不更新 URL
- 移除 `syncFromRouter` 中所有 `applyToRouter` 調用
- URL 補齊邏輯應該在 UI 層處理，或使用其他機制

### 2. 移除頁面層的 `useEffect` 自動設置邏輯
- 頁面層不應該主動設置 Connection
- 如果 URL 沒有 Connection 參數，應該顯示「請選擇商店」提示，而不是自動設置

### 3. 優化 `useEffect` 依賴項
- `syncFromRouter` 不應該在 `useEffect` 依賴項中
- 應該使用 `useRef` 或直接使用穩定的函數引用

---

## 結論

**問題來源**：**實作違反架構決策要求**

- Story 文件描述正確 ✅
- 架構決策設計正確 ✅
- 實作未遵循架構決策 ❌

需要修正實作以符合架構決策的單向同步原則。

