# Zustand 標準實踐決策

**決策日期**: 2025-11-10  
**狀態**: ✅ 已決策並實作

---

## 決策結論

全面採用標準 Zustand 做法，確保所有使用處都符合最佳實踐，避免無限循環和性能問題。

---

## 核心原則

### 1. 直接訂閱單個值（不是返回對象）

**✅ 正確做法**：
```typescript
// 直接訂閱單個值
const selectedPlatform = useStoreStore((state) => state.selectedPlatform)
const selectedConnectionId = useStoreStore((state) => state.selectedConnectionId)
const selectedConnectionItemId = useStoreStore((state) => state.selectedConnectionItemId)

// Actions 直接從 store 獲取（它們是穩定的）
const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
const resetState = useStoreStore((state) => state.resetState)
```

**❌ 錯誤做法**：
```typescript
// ❌ 不要返回對象（即使使用 shallow 比較）
const { selectedPlatform, selectedConnectionId } = useStoreStore(
  (state) => ({
    selectedPlatform: state.selectedPlatform,
    selectedConnectionId: state.selectedConnectionId,
  }),
  shallow // ❌ 不應該需要 shallow
)
```

### 2. 組合值使用 useMemo

**✅ 正確做法**：
```typescript
// 組合多個值時使用 useMemo
const currentConnection = useMemo<ConnectionParams>(
  () => ({
    platform: selectedPlatform,
    connectionId: selectedConnectionId,
    connectionItemId: selectedConnectionItemId,
  }),
  [selectedPlatform, selectedConnectionId, selectedConnectionItemId]
)
```

### 3. 包裝函數使用 useCallback

**✅ 正確做法**：
```typescript
// Actions 是穩定的，但包裝函數需要 useCallback
const applyConnection = useCallback(
  (params: ConnectionParams) => {
    setSelectedConnection(params)
    saveConnectionCache(params)
  },
  [setSelectedConnection] // Actions 是穩定的依賴
)
```

### 4. Hook 返回對象使用 useMemo 包裝

**✅ 正確做法**：
```typescript
// Hook 返回對象時，使用 useMemo 確保引用穩定
export const useConnection = () => {
  // ... 訂閱值和 Actions ...
  
  return useMemo(
    () => ({
      currentConnection,
      applyConnection,
      resetConnection,
    }),
    [currentConnection, applyConnection, resetConnection]
  )
}
```

**❌ 錯誤做法**：
```typescript
// ❌ 直接返回對象，每次渲染都是新引用
return {
  currentConnection,
  applyConnection,
  resetConnection,
}
```

---

## 關鍵問題與解決方案

### 問題：Maximum update depth exceeded

**根本原因**：
1. Hook 返回對象每次渲染都是新引用
2. 依賴此 hook 的 `useMemo` 會無限重新計算
3. 導致無限循環

**解決方案**：
1. ✅ 使用標準 Zustand 做法：直接訂閱單個值
2. ✅ 使用 `useMemo` 包裝返回對象，確保引用穩定
3. ✅ 使用 `useCallback` 包裝函數，確保函數引用穩定

---

## 實作檢查清單

- [x] 所有 `useStoreStore` 使用都直接訂閱單個值
- [x] 所有 Actions 都直接從 store 獲取
- [x] 組合值使用 `useMemo`
- [x] 包裝函數使用 `useCallback`
- [x] Hook 返回對象使用 `useMemo` 包裝
- [x] 移除所有不必要的 `shallow` 比較

---

## 相關文件

- 狀態管理決策：`docs/memory/decisions/state-management.md`
- Connection 狀態同步決策：`docs/memory/decisions/connection-state-sync.md`
- 初始化層級決策：`docs/memory/decisions/connection-state-sync.md`（見「初始化層級提升」章節）

---

**最後更新**: 2025-11-10

