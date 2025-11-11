# 下一 Run 建議

**建立日期**: 2025-11-11  
**當前 Run**: run-2025-11-11-01（✅ closed）

---

## 📊 當前狀態

### ✅ 已完成

- **Refactor 3: Connection 基礎重構** - ✅ 完成
  - Story R3.0: Connection 資料模型與 Migration ✅
  - Story R3.1: Connection 狀態同步 ✅
  - Story R3.2: Token Lifecycle 與重新授權流程 ✅
- **Issue 2025-11-10-001**: OAuth callback 簽名驗證問題 ✅ 已修復
- **技術債清理**: 過渡期映射工具已移除 ✅
- **文件更新**: Shopline OAuth 實作指南已建立 ✅

### 🔄 準備就緒

- **Epic 4: Connection 管理體驗** - 🔄 ready-for-dev
  - 前置條件：Epic 3 ✅ + Refactor 1 ✅ + Refactor 3 ✅
  - 狀態：所有前置條件已完成，可以開始開發

---

## 🎯 建議下一 Run 內容

### 選項 1: 開始 Epic 4 - Story 4.1（推薦）

**Story 4.1: Connection Dashboard 與列表體驗**

**優先級**: High  
**類型**: Feature  
**預估工作量**: Medium

**目標**：
- 建立新的 Connection List & Dashboard（取代現有商店列表）
- 整合空態、狀態徽章、基本操作
- 串接 `/api/connections` API
- 顯示 Connection 與 Connection Item

**技術要點**：
- 串接 `/api/connections`，展示 Connection 與底下 Connection Item
- 空態引導：尚未有 Connection → 引導建立流程
- 狀態顯示：Active / Expired / Error（引用 Story R3.2 的錯誤碼）
- 測試覆蓋 note-2025-11-06-002 中列出的 UI/流程缺口

**前置準備**：
- ✅ `/api/connections` API 已存在（Refactor 3 完成）
- ✅ Connection 資料模型已完成
- ✅ Token 狀態錯誤碼已完成（Story R3.2）

**相關文件**：
- Epic 4: `docs/backlog/epics/epic-4-multi-store-management.md`
- Story 4.1: 待建立（在 Epic 4 文件中）
- Note 2025-11-06-002: `docs/backlog/inbox/note-2025-11-06-002.md`（測試缺口）

---

### 選項 2: 整理 Inbox 並規劃 Story

**優先級**: Medium  
**類型**: Planning  
**預估工作量**: Low

**目標**：
- 整理 `docs/backlog/inbox/` 中的待處理項目
- 將 Note 轉換為正式的 Story 或 Issue
- 確認 Epic 4 的 Story 細節

**待整理項目**：
- Note 2025-11-07-002: 待釐清的程式碼與測試變更
- Note 2025-11-10: Run 2025-11-10-01 後續待辦事項（部分已處理）

**前置準備**：
- 無特殊前置條件

---

### 選項 3: 完善 Story R3.2 的剩餘項目

**優先級**: Low  
**類型**: Enhancement  
**預估工作量**: Low

**目標**：
- 確認 Connection List UI 是否顯示 Token 狀態徽章
- 確認是否有提供重新授權入口
- 完善錯誤碼覆蓋測試（`TOKEN_REVOKED`、`TOKEN_SCOPE_MISMATCH`）

**注意**：
- Story R3.2 核心功能已完成並通過 User Test
- 這些是增強項目，不影響核心功能

---

## 📋 進入開發前的準備工作

### 1. 閱讀相關文件（必須）

**Epic 4 相關**：
- [ ] 閱讀 `docs/backlog/epics/epic-4-multi-store-management.md`
- [ ] 閱讀 `docs/memory/decisions/connection-data-model.md`
- [ ] 閱讀 `docs/memory/decisions/connection-state-sync.md`
- [ ] 閱讀 `docs/memory/decisions/token-lifecycle-handling.md`

**測試缺口**：
- [ ] 閱讀 `docs/backlog/inbox/note-2025-11-06-002.md`（測試缺口與 UX 改善建議）

**架構討論**：
- [ ] 閱讀 `docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`

### 2. 確認 API 端點（必須）

**後端 API**：
- [ ] 確認 `/api/connections` API 的實作與回應格式
- [ ] 確認 Connection 資料結構（Connection / Connection Item）
- [ ] 確認 Token 狀態錯誤碼的實作

**相關檔案**：
- `backend/src/routes/api.ts` - API 路由
- `backend/src/repositories/connection.ts` - Connection Repository
- `backend/src/services/shopline.ts` - Shopline Service

### 3. 確認前端現有實作（必須）

**Connection 相關 Hook**：
- [ ] 確認 `useConnections` Hook 的實作
- [ ] 確認 `useConnection` Hook 的實作
- [ ] 確認 `useConnectionRouting` Hook 的實作

**相關檔案**：
- `frontend/hooks/useConnections.ts`
- `frontend/hooks/useConnection.ts`
- `frontend/hooks/useConnectionRouting.ts`
- `frontend/stores/useStoreStore.ts`（可能已改名或重構）

### 4. 確認設計規格（建議）

**UI/UX 設計**：
- [ ] 確認是否有 Connection Dashboard 的設計規格
- [ ] 確認空態設計（Empty State）
- [ ] 確認狀態徽章設計（Active / Expired / Error）

**相關檔案**：
- `docs/reference/design-specs/`（如果有相關設計文件）

### 5. 建立 Story 文件（如果選擇選項 1）

**Story 4.1 文件**：
- [ ] 在 `docs/backlog/stories/` 建立 `story-4-1-connection-dashboard.md`
- [ ] 參考其他 Story 文件的格式
- [ ] 包含 Story 描述、驗收標準、技術需求、關鍵資訊

---

## 🚀 建議執行順序

### 如果選擇選項 1（推薦）

1. **準備階段**（約 30 分鐘）
   - 閱讀 Epic 4 相關文件
   - 確認 API 端點與資料結構
   - 確認前端現有實作

2. **建立 Story 文件**（約 15 分鐘）
   - 建立 `story-4-1-connection-dashboard.md`
   - 定義驗收標準與技術需求

3. **開發階段**（約 2-3 小時）
   - 實作 Connection Dashboard 組件
   - 串接 `/api/connections` API
   - 實作空態與狀態顯示
   - 整合到現有頁面

4. **測試階段**（約 30 分鐘）
   - Agent 測試（編譯、linter、功能測試）
   - User Test 準備（測試腳本）

### 如果選擇選項 2

1. **整理 Inbox**（約 30 分鐘）
   - 檢視 Note 2025-11-07-002
   - 檢視 Note 2025-11-10（確認剩餘項目）
   - 決定轉換為 Story/Issue 或棄置

2. **規劃 Story**（約 30 分鐘）
   - 確認 Epic 4 的 Story 細節
   - 建立 Story 4.1 文件（如果尚未建立）

---

## 📝 注意事項

### 開發前檢查清單

- [ ] 已閱讀 `docs/00-AGENT-ONBOARDING.md`
- [ ] 已檢查 `docs/context/current-run.md`（確認沒有進行中的 Run）
- [ ] 已閱讀相關決策文件
- [ ] 已確認 API 端點與資料結構
- [ ] 已確認前端現有實作
- [ ] 已建立 Story 文件（如果選擇選項 1）

### 開發時注意事項

- **遵循 Refactor 3 的架構**：使用 Connection 資料模型，不要使用舊的 Store 模型
- **遵循 R3.1 的狀態同步策略**：Zustand 是 Source of Truth，URL 只用來初始化
- **參考 Story R3.2 的錯誤碼**：使用 `TOKEN_EXPIRED`、`TOKEN_REVOKED` 等錯誤碼顯示狀態
- **測試覆蓋**：參考 note-2025-11-06-002 中的測試缺口

---

## 🔗 相關文件

- **Epic 4**: `docs/backlog/epics/epic-4-multi-store-management.md`
- **Refactor 3**: `docs/backlog/refactors/refactor-3-connection-foundation.md`
- **Story R3.0**: `docs/backlog/stories/story-r3-0-connection-data-model.md`
- **Story R3.1**: `docs/backlog/stories/story-r3-1-connection-state-sync.md`
- **Story R3.2**: `docs/backlog/stories/story-r3-2-token-lifecycle.md`
- **Note 2025-11-06-002**: `docs/backlog/inbox/note-2025-11-06-002.md`
- **當前 Run**: `docs/context/current-run.md`

---

**最後更新**: 2025-11-11

