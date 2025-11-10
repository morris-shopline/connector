# 狀態管理架構決策

**決策日期**: 2025-11-04  
**狀態**: ✅ 已決策

---

## 決策結論

採用方案 A（Zustand 漸進式 → Redux）階段 1

---

## 決策內容

### 階段 1（當前）：Zustand + 後端 Session + Redis

**架構**:
- **前端**: Zustand 管理 UI 狀態（selectedStore, selectedPlatform, selectedAPI, authState）
- **後端**: Session 管理（使用者認證 Session，使用 Redis 儲存）
- **Redis**: Token 快取（加速查詢）+ Session 管理（使用者認證）
- **SWR**: 資料獲取（保持現狀）

### State 分層原則（2025-11-10 補充，2025-11-10 修正）

**核心原則：只有一個 Source of Truth**

| 層 | 承載內容 | 來源 | 同步方向 | 用途 |
|---|---------|------|---------|------|
| **URL** | ~~可分享的上下文（Connection 參數、篩選條件等）~~ **現階段：僅用於初始化** | 外部來源（可 deep link） | **單向：URL → Zustand（只做一次初始化）** | ~~可分享、可還原的狀態~~ **現階段：僅初始化** |
| **Zustand** | UI state（當前選取、表單暫態、界面交互） | **唯一 Source of Truth** | - | 所有 UI 狀態的來源 |
| **localStorage** | 快取（刷新頁面時恢復） | Zustand | Zustand → localStorage | 持久化快取 |
| **DB / Domain State** | 真實系統狀態（jobs, event log, sync result） | 後端 | - | 後端資料 |

**關鍵規則（現階段簡化版）**：

1. **Zustand 是唯一的 Source of Truth**
   - 所有 UI 狀態都在 Zustand 中
   - URL 只用來「初始化」Zustand（如果 URL 有參數）
   - **禁止**：Zustand 回寫 URL（正常使用 Zustand 管理 state 的狀況都不會這樣做）

2. **URL → Zustand：只做一次初始化**
   - 頁面載入時，如果 URL 有 Connection 參數，從 URL 讀取並初始化 Zustand Store（只做一次）
   - 如果 URL 沒有參數，不從 URL 初始化
   - **禁止**：在初始化過程中更新 URL（會造成循環）

3. **用戶操作時：只更新 Zustand**
   - 用戶點擊商店 → 更新 Zustand Store
   - **不更新 URL**（現階段不會有 URL 分享上下文的情境）
   - **禁止**：監聽 Zustand 變化自動更新 URL（會造成循環）

4. **避免 Dual Source of Truth Anti-pattern**
   - ❌ **錯誤**：URL 和 Zustand 互相同步
   - ✅ **正確**：Zustand 是唯一的 Source of Truth，URL 只用於初始化（如果有的話）

**未來改進（動態路由重構）**：
- 當需要 URL 分享上下文功能時，改用動態路由處理核心資源
- 見 `docs/memory/decisions/routing-strategy.md`

**實作範例（現階段簡化版）**：

```typescript
// ✅ 正確：URL → Zustand（只做一次初始化）
useEffect(() => {
  if (!router.isReady) return
  
  const params = parseConnectionQuery(router.query)
  if (params.platform || params.connectionId || params.connectionItemId) {
    setSelectedConnection(params) // 只更新 Zustand，不更新 URL
  }
}, [router.isReady]) // 只依賴 router.isReady

// ✅ 正確：用戶操作 → 只更新 Zustand（不更新 URL）
const applyConnection = (params) => {
  setSelectedConnection(params) // 只更新 Zustand，不更新 URL
}

// ❌ 錯誤：Zustand → URL 自動同步（會造成循環）
useEffect(() => {
  if (selectedConnection && selectedConnection !== router.query.connectionId) {
    router.replace({ query: { connectionId: selectedConnection } })
  }
}, [selectedConnection, router.query.connectionId])

// ❌ 錯誤：用戶操作時更新 URL（現階段不需要）
const applyConnection = async (params) => {
  setSelectedConnection(params)
  await router.push({ query: buildConnectionQuery(params) }) // ❌ 現階段不需要
}
```

**相關文件**：
- 詳細說明：`docs/archive/discussions/state-layering-correct-approach-2025-11-10.md`
- Connection 狀態同步：`docs/memory/decisions/connection-state-sync.md`
- 路由策略決策：`docs/memory/decisions/routing-strategy.md`（動態路由重構）

**Store 結構**：
- `frontend/stores/useStoreStore.ts` - 商店選擇狀態管理（Refactor 1 成果）
- `frontend/stores/useAuthStore.ts` - 認證狀態管理（Story 3.4 實作）

**實作範圍**:
- Zustand 統一狀態管理
- 後端 Session 管理
- Redis 快取整合

**適用範圍**:
- ✅ Phase 1 完成（多租戶 + 多平台）
- ✅ Phase 2 完成（多平台整合）
- ✅ Phase 3.1 簡單資料流（SL get product -> NE update product）✅ **關鍵 milestone**
- ⚠️ Phase 3.2 Job 管理系統開始前（需要重新評估）

---

## 關鍵理由

1. **符合 Roadmap 需求**：階段 1 可以維持到完成關鍵 milestone
2. **漸進式擴展**：避免過度設計，可以分階段增強
3. **Agent 協作友好**：文件清晰，容易維護，協作成本低
4. **重構成本可控**：未來如果需要進入階段 2（Redux），有成熟的遷移路徑

---

## 觸發進入階段 2 的條件

**需要進入階段 2 的情況**:
- **Job Queue 功能上線**（關鍵觸發點）
  - 需要複雜的 Job 管理（監測、暫停、重啟）
  - 需要即時狀態更新（多裝置同步）
  - 需要複雜的狀態同步

**不需要進入階段 2 的情況**:
- ❌ 多租戶本身不需要階段 2（Zustand 足夠）
- ❌ 多平台本身不需要階段 2（Zustand 足夠）
- ❌ 簡單資料流不需要階段 2（Zustand 足夠）
- ❌ 使用者認證狀態管理不需要階段 2（Zustand 足夠，Story 3.4 實作）

---

## 相關文件

- **詳細討論過程**: `archive/discussions/state-management-2025-11-04.md`
- **架構文檔**: `memory/architecture/current.md`
- **專案路線圖**: `memory/roadmap.md`

---

## Zustand 標準實踐（2025-11-10 補充）

**重要**：所有 Zustand 使用必須遵循標準做法，避免無限循環和性能問題。

### 核心原則

1. **直接訂閱單個值**（不是返回對象）
   ```typescript
   // ✅ 正確
   const platform = useStoreStore((state) => state.selectedPlatform)
   
   // ❌ 錯誤（即使使用 shallow）
   const { platform } = useStoreStore((state) => ({ platform: state.selectedPlatform }), shallow)
   ```

2. **Actions 直接從 store 獲取**（它們是穩定的）
   ```typescript
   // ✅ 正確
   const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
   ```

3. **Hook 返回對象使用 useMemo 包裝**
   ```typescript
   // ✅ 正確
   return useMemo(() => ({ currentConnection, applyConnection }), [currentConnection, applyConnection])
   ```

詳細請參考：`docs/memory/decisions/zustand-standard-practices.md`

---

**最後更新**: 2025-11-10（補充 Zustand 標準實踐）

