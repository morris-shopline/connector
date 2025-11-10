# Story R3.1: Connection 狀態同步（State 分層策略）

**所屬 Refactor**: [Refactor 3: Connection 基礎重構（Phase 1.2 前置）](../refactors/refactor-3-connection-foundation.md)  
**狀態**: ✅ completed  
**完成日期**: 2025-11-10  
**User Test**: ✅ 通過（2025-11-10）  
**建立日期**: 2025-11-07  
**安排 Run**: run-2025-11-10-01（統一開發）  
**相關 Issue**: [Issue 2025-11-06-001](../issues/issue-2025-11-06-001.md)  
**相關決策**: 
- `docs/memory/decisions/connection-state-sync.md`
- `docs/memory/decisions/state-management.md`

---

## 前情提要

- 目前 Connection/商店切換依靠雙向 useEffect，同時寫入 URL 與 Zustand，造成循環與閃跳。
- Refactor 1 尚有登入/登出狀態清理、跨頁鎖定等待完成。
- ⚠️ **修正（2025-11-10）**：決策已確定採取「State 分層策略」：
  - Zustand 是唯一的 Source of Truth
  - URL 只用來初始化 Zustand（可分享的上下文）
  - 用戶操作 → 更新 Zustand → 推送 URL（單向推送）
- Story R1.1 提供了新的 Zustand 欄位與 Router helper，本 Story 須完全採用該介面。
- Story R3.0 將導致後端回傳 Connection 資料結構變動，本 Story 需同步更新前端資料模型。

---

## Story 描述

導入 Connection 狀態同步新策略，確保所有頁面透過 **Zustand** 管理當前 Connection，URL 只用來表示可分享的上下文。具體包含：

1. 建立 `useConnectionRouting()` Hook，封裝 URL → Zustand 的初始化與用戶操作。
2. 改寫 `frontend/stores/*` 中 Connection 相關邏輯，移除雙向 useEffect。
3. 更新各頁面（Dashboard、Webhook、Admin API 測試等）的 Connection 選擇流程。
4. 收斂 Refactor 1 未完事項：登入後初始化、登出清理、操作鎖定、localStorage 對齊。
5. ⚠️ **修正（2025-11-10）**：移除「跨頁守門機制自動設置 Connection」：
   - ❌ **錯誤**：Router Query 缺值時自動設置預設 Connection 並更新 URL（會造成循環）
   - ✅ **正確**：如果 URL 沒有 Connection 參數，顯示「請選擇商店」，不自動設置

---

## 架構師協作

- **Kickoff Review**
  - 確認 `useConnectionRouter` API 介面、事件訂閱方式與 Router 生命週期，避免造成 Next.js hydration 問題。
  - 與 R1.1 的實作者共同確認 helper 規格一致。
- **Interaction Demo（中段檢查）**
  - 於 PR 草稿時提供錄影或 QA instance，請架構師驗證跨頁切換、Back/Forward 行為。
- **Final Review**
  - 架構師需確認：
    - Issue 2025-11-06-001 已於 PR 中正式關閉並補充 QA 步驟
    - 所有頁面已移除雙向同步與 legacy handle 名稱
  - 結論紀錄於 Story 驗收標準勾選區與 run 文件。

---

## 實作項目

1. **URL → Zustand 初始化（只做一次）**
   - ✅ **正確**：頁面載入時，從 URL 讀取 Connection 參數，初始化 Zustand Store（只做一次）
   - ✅ **正確**：路由變化時，從新 URL 初始化 Zustand（只做一次）
   - ❌ **錯誤**：在初始化過程中更新 URL（會造成循環）
   - ❌ **錯誤**：使用 `router.events` 持續監聽並同步（會造成循環）
   - 封裝 `applyConnection` 以更新 Zustand 然後推送 URL（單向推送）

2. **登入 / 登出流程**
   - 登入成功：載入 Connection List，若沒有 connection → 導向授權流程；有 connection → 更新 Zustand 並推送 URL
   - ⚠️ **修正（2025-11-10）**：「設定預設 URL」改為「更新 Zustand 並推送 URL」（單向推送）
   - 登出：清理 Zustand, localStorage, URL Query

3. **頁面整合**
   - `index.tsx`, `webhook-test.tsx`, `admin-api-test.tsx` 皆改讀 Hook
   - 確保切換 Connection 時仍保留目前頁面狀態（如操作 log）
   - ⚠️ **修正（2025-11-10）**：移除頁面層的 `useEffect` 自動設置 Connection 邏輯：
     - ❌ **錯誤**：`useEffect` 檢查 `currentConnection.connectionItemId`，如果沒有就自動設置（會造成循環）
     - ✅ **正確**：如果 URL 沒有 Connection 參數，顯示「請選擇商店」，不自動設置

4. **Refactor 1 backlog 收斂**
   - 檢查並完成 R1.1~R1.4 中跟 Connection 狀態相關的待辦（若屬未來範圍，明確標註出來）

5. **測試**
   - 單元：Hook 與 Store 的行為（mock Router events）
   - E2E：
     - 切換 Connection 不再閃跳
     - 直接輸入帶 `connectionId` 的 URL 能正確還原狀態
     - 僅帶 `connectionItemId` 的 URL 可自動補齊參數並更新 Zustand
   - ⚠️ **修正（2025-11-10）**：補齊後只更新 Zustand，**不更新 URL**（URL 是外部來源）
     - 登出後登入不同帳號，不會殘留舊 Connection
   - Time travel（Back/Forward）與多分頁同步行為（以手動測試證明）

---

## 驗收標準

- [ ] Issue 2025-11-06-001 標記為 resolved
- [ ] 所有頁面均透過 `useConnectionRouting` 取得選定 Connection（從 Zustand 讀取）
- [ ] State 分層策略正確實作（Zustand 是唯一 Source of Truth，URL 只用來初始化）
- [ ] 登入、登出流程對應的 URL & store 狀態一致，並與 Story R1.1 測項共用
- [ ] E2E 測試新增/更新，涵蓋 Connection 切換與直接透過 URL 進入
- [ ] 文件（Story 測試區/README）更新使用方式
- [ ] 架構師 Final Review ✅，註明 reviewer 與日期

---

## 風險與備註

- 需要同步檢查瀏覽器歷史（back/forward）是否會正確還原 Connection
- 未來若導入多工作分頁，需要再討論 Connection 狀態與 localStorage 的同步策略
- Router 事件須注意 Next.js App Router v14 行為差異，若未來遷移需重新驗證
- 若有舊的 `handle` 名稱殘留，須建立 lint 規則（或搜尋結果）確保清除

---

**最後更新**: 2025-11-10（修正 State 分層原則，標示錯誤做法）


