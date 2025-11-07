# Connection 狀態同步決策

**決策日期**: 2025-11-07  
**狀態**: ✅ 已決策

---

## 決策結論

採用「URL 參數 → Router 事件 → 全域 Store」的單向同步策略，將 Connection（平台 × 帳戶）的選取狀態統一交由 URL 管理。

---

## 決策內容

### 核心原則

1. **URL 是唯一真實來源**：
   - Query 參數包含 `platform`, `connectionId`, `itemId`（可選）。
   - 任一頁面開啟時，依 URL 初始化選取狀態。

2. **Router 事件驅動**：
   - 使用 Next.js `router.events` 監聽 `routeChangeComplete`，根據新 URL 更新 Zustand store。
   - 取消 useEffect 互相寫回 URL 與 Store 的循環邏輯。

3. **操作流程**：
   - UI 切換 Connection 時，僅呼叫 `router.replace({ query: { ... } })`。
   - Store 僅在 Router 事件中接收資料並更新，避免雙向競態。

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

**最後更新**: 2025-11-07


