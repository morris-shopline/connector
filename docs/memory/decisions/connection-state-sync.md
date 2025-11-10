# Connection 狀態同步決策

**決策日期**: 2025-11-07  
**狀態**: ✅ 已決策

---

## 決策結論

採用「URL 參數 → Zustand Store（只做一次初始化）」的單向策略，將 Connection（平台 × 帳戶）的選取狀態統一交由 **Zustand 管理**，URL 只用來表示可分享的上下文。

**⚠️ 重要修正（2025-11-10）**：
- ❌ **錯誤理解**：「URL 是唯一真實來源」→ 這會造成 Dual Source of Truth
- ✅ **正確理解**：Zustand 是唯一的 Source of Truth，URL 只用來初始化 Zustand（可分享的上下文）

---

## 決策內容

### 核心原則（2025-11-10 修正）

1. **Zustand 是唯一的 Source of Truth**：
   - ✅ **正確**：所有 UI 狀態都在 Zustand 中
   - ❌ **錯誤**：「URL 是唯一真實來源」→ 這會造成 Dual Source of Truth Anti-pattern
   - URL 只用來「初始化」Zustand，不是 state storage

2. **URL → Zustand：只做一次初始化**：
   - ✅ **正確**：頁面載入時，從 URL 讀取 Connection 參數，初始化 Zustand Store（只做一次）
   - ❌ **錯誤**：在初始化過程中更新 URL（會造成循環）
   - ❌ **錯誤**：使用 `router.events` 持續監聽並同步（會造成循環）

3. **用戶操作流程**：
   - ✅ **正確**：用戶操作 → 更新 Zustand → 推送 URL（單向推送）
   - ❌ **錯誤**：UI 切換 Connection 時「僅呼叫 router.replace」，然後讓 Router 事件更新 Store（會造成循環）
   - ✅ **正確**：用戶操作時，先更新 Zustand，然後推送 URL

4. **狀態清理**：
   - 登出時清除 localStorage、Zustand store 中的 Connection 狀態並移除 URL 參數。
   - 登入成功後載入最新 Connection 清單：
     - 若無任何 Connection → 導向建立流程。
     - 若有多筆 → 選定預設值（第一筆或上次使用者記錄），並推送到 URL。

### 實作重點

- 提供 `useConnectionRouter()` Hook 封裝：
  - `getCurrentConnection()`、`setConnection(connectionId)` 等介面。
  - 隱藏 Router 操作細節。
- Refactor 1 未完成的商店狀態任務納入同一 Story 處理：
  - 登出清理、登入初始化、跨頁鎖定檢查。
- 所有需要 Connection 狀態的頁面皆改為讀取 Hook / Store，不再自己解析 URL。
- **Kickoff 更新（2025-11-10）**：
  - `connectionItemId` 視為主要識別；若 URL 只帶此參數，Hook 應向 API 取得對應 Connection，再補齊 `connectionId` 與 `platform`。
  - ⚠️ **修正**：補齊後只更新 Zustand，**不更新 URL**（URL 是外部來源，用戶可能故意只帶 `connectionItemId`）
  - 預設對外分享仍保留三個參數，方便除錯與跨頁篩選。

- **⚠️ 錯誤做法標示（2025-11-10）**：
  - ❌ **錯誤**：`syncFromRouter` 中調用 `applyToRouter` 更新 URL → 會造成循環
  - ❌ **錯誤**：頁面層的 `useEffect` 自動設置 Connection 並更新 URL → 會造成循環
  - ❌ **錯誤**：使用 `router.events` 持續監聽並同步 → 會造成循環
  - ✅ **正確**：只在頁面載入時從 URL 初始化一次，用戶操作時更新 Zustand 然後推送 URL

### 測試策略

- 單元測試：模擬 Router 事件，驗證 Store 更新。
- E2E 測試：
  - 切換 Connection 不再出現閃跳（Issue 2025-11-06-001）
  - 直接輸入帶 Query 的 URL 能正確載入對應 Connection。

---

## 關鍵理由

1. **消除循環依賴**：避免 useEffect 互相觸發造成閃跳。
2. **一致性**：所有頁面共享同一個同步機制，未來擴充平台也不需複寫邏輯。
3. **可觀測性**：URL 能明確表示目前選取的 Connection，利於 Debug 與分享。
4. **State 分層清晰**：Zustand 是唯一的 Source of Truth，URL 只是可分享的上下文表示。

## ⚠️ 錯誤做法警示（2025-11-10 補充）

以下做法會造成 **Dual Source of Truth Anti-pattern** 和無限循環，**禁止使用**：

### ❌ 錯誤做法 1：在 `syncFromRouter` 中更新 URL

```typescript
// ❌ 錯誤：會造成循環
const syncFromRouter = async (query) => {
  const resolved = await resolveMissingConnection(parsed)
  syncState(resolved)
  await applyToRouter(resolved) // ❌ 錯誤：更新 URL 會觸發 routeChangeComplete → syncFromRouter → 循環
}
```

**正確做法**：只更新 Zustand，不更新 URL

### ❌ 錯誤做法 2：頁面層自動設置 Connection 並更新 URL

```typescript
// ❌ 錯誤：會造成循環
useEffect(() => {
  if (!currentConnection.connectionItemId) {
    applyConnection(defaultConnection) // ❌ 錯誤：更新 URL → routeChangeComplete → 更新 Store → useEffect 依賴變化 → 循環
  }
}, [applyConnection, currentConnection.connectionItemId, defaultConnection])
```

**正確做法**：如果 URL 沒有參數，顯示「請選擇商店」，不自動設置

### ❌ 錯誤做法 3：使用 `router.events` 持續監聽並同步

```typescript
// ❌ 錯誤：會造成循環
router.events.on('routeChangeComplete', (url) => {
  syncFromRouter(query) // 如果 syncFromRouter 中更新 URL，會造成循環
})
```

**正確做法**：只在路由變化時從 URL 初始化一次，不更新 URL

---

## ✅ 正確實作方式（2025-11-10 補充）

參考 `docs/memory/decisions/state-management.md` 的「State 分層原則」章節。

---

## 待辦與依賴

- Refactor 3 Story R3.1 將依此策略進行實作與測試。
- Epic 4 的所有 Story（特別是前端 UI）需以此同步策略為基礎。

---

## 相關文件

- 討論紀錄：`docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`
- Issue：`docs/backlog/issues/issue-2025-11-06-001.md`
- 既有狀態決策：`docs/memory/decisions/state-management.md`

---

## 初始化層級提升（2025-11-10 關鍵修復）

### 問題

原本在每個頁面組件中使用 `useConnectionRouting` 進行初始化，導致：
- 頁面切換時 hook 重新建立
- `initializedRef` 重置
- URL 又重新觸發同步
- 形成無限循環

### 解決方案

**將初始化提升到 `_app.tsx` 層級**：

```typescript
// frontend/pages/_app.tsx
function AppContent({ Component, pageProps }: AppProps) {
  // ✅ 只在 app 首次載入時執行一次 URL → Zustand 初始化
  useInitConnectionFromURL()
  return <Component {...pageProps} />
}
```

**關鍵改進**：
1. ✅ 初始化只在 `_app.tsx` 執行一次（整個 app 生命週期）
2. ✅ 頁面切換時不會重新執行初始化
3. ✅ 避免 `initializedRef` 重置造成的循環問題

### Hook 拆分

**`useInitConnectionFromURL`**（初始化，只在 `_app.tsx` 使用）：
- 負責 URL → Zustand 初始化（只執行一次）
- 使用 `initializedRef` 確保只執行一次
- 只依賴 `router.isReady`，不依賴 `router.query`

**`useConnection`**（消費，任何頁面都可使用）：
- 只提供讀取和設置功能，不做初始化
- 使用標準 Zustand 做法（直接訂閱單個值）
- 返回對象使用 `useMemo` 包裝，確保引用穩定

---

**最後更新**: 2025-11-10（補充 State 分層原則、初始化層級提升、標示錯誤做法）


