# Story R3.1: Connection 狀態同步與 URL 單一來源

**所屬 Refactor**: [Refactor 3: Connection 基礎重構（Phase 1.2 前置）](../refactors/refactor-3-connection-foundation.md)  
**狀態**: ⏳ planned  
**建立日期**: 2025-11-07  
**相關 Issue**: [Issue 2025-11-06-001](../issues/issue-2025-11-06-001.md)  
**相關決策**: 
- `docs/memory/decisions/connection-state-sync.md`
- `docs/memory/decisions/state-management.md`

---

## 前情提要

- 目前 Connection/商店切換依靠雙向 useEffect，同時寫入 URL 與 Zustand，造成循環與閃跳。
- Refactor 1 尚有登入/登出狀態清理、跨頁鎖定等待完成。
- 決策已確定採取「URL 單一來源 + Router 事件」的同步模式。

---

## Story 描述

導入 Connection 狀態同步新策略，確保所有頁面透過 URL 表示當前 Connection。具體包含：

1. 建立 `useConnectionRouter()` Hook，封裝 URL → Store 的映射與操作。
2. 改寫 `frontend/stores/*` 中 Connection 相關邏輯，移除雙向 useEffect。
3. 更新各頁面（Dashboard、Webhook、Admin API 測試等）的 Connection 選擇流程。
4. 收斂 Refactor 1 未完事項：登入後初始化、登出清理、操作鎖定、localStorage 對齊。

---

## 實作項目

1. **Router → Store 單向同步**
   - 使用 `router.events.on('routeChangeComplete', ...)` 監聽 URL 變化
   - Store 僅在此事件中更新選定 Connection/Item
   - 封裝 `setConnection`, `setConnectionItem` 以呼叫 `router.replace`

2. **登入 / 登出流程**
   - 登入成功：載入 Connection List，若沒有 connection → 導向授權流程；有 connection → 設定預設 URL
   - 登出：清理 Zustand, localStorage, URL Query

3. **頁面整合**
   - `index.tsx`, `webhook-test.tsx`, `admin-api-test.tsx` 皆改讀 Hook
   - 確保切換 Connection 時仍保留目前頁面狀態（如操作 log）

4. **Refactor 1 backlog 收斂**
   - 檢查並完成 R1.1~R1.4 中跟 Connection 狀態相關的待辦（若屬未來範圍，明確標註出來）

5. **測試**
   - 單元：Hook 與 Store 的行為
   - E2E：
     - 切換 Connection 不再閃跳
     - 直接輸入帶 `connectionId` 的 URL 能正確還原狀態
     - 登出後登入不同帳號，不會殘留舊 Connection

---

## 驗收標準

- [ ] Issue 2025-11-06-001 標記為 resolved
- [ ] 所有頁面均透過 `useConnectionRouter` 取得選定 Connection
- [ ] 登入、登出流程對應的 URL & store 狀態一致
- [ ] E2E 測試新增/更新，涵蓋 Connection 切換與直接透過 URL 進入
- [ ] 文件（Story 測試區/README）更新使用方式

---

## 風險與備註

- 需要同步檢查瀏覽器歷史（back/forward）是否會正確還原 Connection
- 未來若導入多工作分頁，需要再討論 Connection 狀態與 localStorage 的同步策略

---

**最後更新**: 2025-11-07


