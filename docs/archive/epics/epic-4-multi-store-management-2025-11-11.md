# Epic 4: Connection 管理體驗（Phase 1.2）

**狀態**: ⏳ planned（前置條件已完成，Story 待建立）  
**對應 Roadmap**: Phase 1.2  
**開始日期**: -

---

## Epic 描述

在人員已完成 Admin 基礎功能（Epic 3）並完成 Connection 基礎重構（Refactor 3）後，提供多 Connection 管理的完整使用體驗：

- 以 Connection（平台 × 帳戶）為核心的列表、狀態與操作流程
- 統一的連線建立與重新授權 UX
- Connection 層級的權限保護與 API 接入
- 將既有 Admin 功能轉換為 Connection 感知（Connection-aware）的流程

---

## 現況摘要
- ✅ Epic 3 已完成，單一平台多個 Connection 的 happy path 可運作
- ✅ Refactor 3（Connection 基礎重構）核心 Stories 已完成（R3.0, R3.1, R3.2）
- ⏳ Story 4.1-4.5 尚未建立詳細文件，需要進行 Story 建立階段
- 📝 Inbox / Issues：
  - note-2025-11-06-002（測試缺口、UX 改善）
  - note-2025-11-07-001（公開端點檢視）
  - issue-2025-11-06-001、issue-2025-11-07-001 已在 Refactor 3 解決
- ⚠️ Next Engine 導入規劃列為 Run B（Refactor 完成後緊接 PoC）

---

## 前置條件
- ✅ Epic 3 完成（Admin 管理系統）
- ✅ [Refactor 3: Connection 基礎重構](../refactors/refactor-3-connection-foundation.md) 核心 Stories 完成（R3.0, R3.1, R3.2）
- ✅ Connection 決策文件落地（資料模型 / 狀態同步 / Token lifecycle）
- ⏳ Story 4.1-4.5 狀態為 `not-started`，需要進行 Story 建立階段

---

## Stories

### ⏳ Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: not-started
- **描述**: 新的 Connection List & Dashboard（取代現有商店列表），整合空態、狀態徽章、基本操作
- **技術 / UX 要點**:
  - 串接 `/api/connections`，展示 Connection 與底下 Connection Item
  - 空態引導：尚未有 Connection → 引導建立流程
  - 狀態顯示：Active / Expired / Error（引用 Story R3.2 的錯誤碼）
  - 測試覆蓋 note-2025-11-06-002 中列出的 UI/流程缺口

### ⏳ Story 4.2: Connection 建立與重新授權工作流
- **狀態**: not-started
- **描述**: 整合新增 Connection、重新授權、停用等操作，提供一致的 UX
- **技術 / UX 要點**:
  - 新增 Connection Flow：選擇平台 → 導向 OAuth → 回到 Connection List
  - 重新授權入口：整合 Story R3.2 的提示，提供「重新授權」與「重試」
  - 停用／刪除流程：確認視窗 + API 連動
  - 事件記錄：顯示最近一次授權時間、錯誤訊息

### ⏳ Story 4.3: Connection 層級權限與端點保護
- **狀態**: not-started
- **描述**: 確保 Connection 相關 API 依據使用者 / Connection 擁有權進行授權；檢視公開端點策略
- **技術要點**:
  - 驗證 Connection 所屬使用者、platform scope
  - `/api/auth/shopline/install` 等入口改為需登入或附帶 session state（參考 note-2025-11-07-001）
  - API / Webhook 層級的權限與審計（紀錄操作 userId, connectionId）
  - 撰寫權限測試腳本（參考 note-2025-11-06-002 未涵蓋測試）

### ⏳ Story 4.4: Admin 模組 Connection 化
- **狀態**: not-started
- **描述**: 讓既有 Admin 功能（Webhook、Admin API 測試、Dashboard Widgets 等）全面使用 Connection Context
- **技術 / 測試要點**:
  - 所有頁面從 URL 接收 Connection 狀態（利用 Refactor 3 的 Hook）
  - 測試：多 Connection 情境下資料隔離、切換時 UI 不閃跳
  - 更新文件與 walkthrough（參考 note-2025-11-06-002 的測試缺口）

### ⏳ Story 4.5: Connection Insight 與通知（可選延伸）
- **狀態**: not-started
- **描述**: 提供 Connection 狀態洞察（最後授權時間、API 成功率、錯誤告警）作為 Phase 1.2 完成準備
- **技術 / 觀察要點**:
  - 紀錄 token 錯誤、Webhook 失敗等事件
  - Dashboard 映射簡易圖表 / 指標
  - 為 Phase 1.3 的多 API 支援鋪路

> 若需調整 Story 內容，可於 Refactor 3 完成後進行 Story Refinement。

---

## 相關決策 / 文件
- Roadmap：`docs/memory/roadmap.md`（Phase 1.2）
- Connection 基礎：`docs/memory/decisions/connection-data-model.md`
- Connection 狀態同步：`docs/memory/decisions/connection-state-sync.md`
- Token Lifecycle：`docs/memory/decisions/token-lifecycle-handling.md`
- 架構討論：`docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`
- 長期議題 backlog：`docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`

---

**最後更新**: 2025-11-11

