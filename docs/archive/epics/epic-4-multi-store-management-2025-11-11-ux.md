# Epic 4: Connection 管理體驗（Phase 1.2）

**狀態**: ⏳ planned（Refactor 3 baseline 已完成，等待 Story 建立）  
**對應 Roadmap**: Phase 1.2 - 多商店管理  
**開始日期**: -

---

## Epic 描述

本 Epic 聚焦在 Roadmap Phase 1.2「多商店管理」的最小可行範圍：在 Shopline 單平台前提下，提供穩定的多 Connection 體驗。核心重點如下：

- 以 Connection（平台 × 帳戶）為中心的列表、狀態顯示與基本操作
- 統一的連線建立、重新授權與停用流程，沿用 Refactor 3 的 Token Lifecycle 決策
- 確保現有 API / Webhook 依據 Connection 擁有權進行授權，補齊 Story 3.x 尚未覆蓋的測試缺口
- 將既有 Admin 模組對齊新的 Connection store 初始化策略，消除舊資料殘留與閃跳問題

> ❗️ 多平台抽象、動態路由重構、Connection Insight 與跨平台治理改進，已移轉至 Phase 2 之後的規劃（見「移轉至 Phase 2 的項目」章節）。

---

## 現況摘要
- ✅ Epic 3 已完成，多租戶 + 單平台多 Connection happy path 可運作
- ✅ Refactor 3（Connection 基礎重構）R3.0／R3.1／R3.2 已完工
- ⏳ Story 4.1 ~ 4.3 尚未進入 Story 建立階段，需要整理驗收條件與測試清單
- 📝 需納入的測試與 UX 背景：
  - `note-2025-11-06-002`（測試缺口、UX 改善）
  - `note-2025-11-07-001`（公開端點檢視與保護）
- 🔜 Next Engine（Roadmap Phase 1.3）將由新 Epic 5 追蹤，不在本 Epic 範圍

---

## 前置條件
- ✅ Epic 3 完成（Admin 管理系統）
- ✅ [Refactor 3: Connection 基礎重構](../refactors/refactor-3-connection-foundation.md) 核心 Stories 完成（R3.0, R3.1, R3.2）
- ✅ Connection 決策文件落地（資料模型 / 狀態同步 / Token lifecycle）
- ⏳ Story 4.1 ~ 4.3 需進入 Story 建立階段並補齊 UAT 清單

---

## 核心目標（Phase 1.2 MVP）
- Shopline 單平台下的 Connection List / Dashboard 上線，含空態、狀態徽章與測試流程
- 可自介面完成新增、重新授權與停用 Connection，回傳狀態與錯誤處理一致
- 針對 Connection 相關 API 與 Webhook 實作使用者／Connection 擁有權保護，並補齊記錄與測試
- 既有 Admin 功能在多 Connection 情境下不再出現舊資料殘留、閃跳或未授權存取

---

## Stories

### ⏳ Story 4.1: Connection Dashboard 與列表體驗（Phase 1.2 MVP）
- **描述**: 建立新的 Connection List & Dashboard，取代現有商店列表，整合空態、狀態徽章與基本操作入口
- **範圍 / 要點**:
  - 串接 `/api/connections`，呈現 Connection 及其 Connection Items（Shopline-only）
  - 空態引導：尚未有 Connection → 引導建立流程與測試指引
  - 狀態顯示：Active / Expired / Error，沿用 R3.2 的錯誤碼映射
  - 測試需覆蓋 `note-2025-11-06-002` 列出的 UI / 流程缺口與 happy path / edge cases

### ⏳ Story 4.2: Connection 建立與重新授權工作流
- **描述**: 整合新增 Connection、重新授權、停用流程，提供一致 UX 與紀錄
- **範圍 / 要點**:
  - 新增 Connection Flow：選擇平台（Shopline）、導向 OAuth、回前端後自動刷新列表
  - 重新授權入口：整合 R3.2 的提示機制，提供「重新授權」「重試」等操作
  - 停用／刪除流程：確認視窗、API 連動、狀態同步（包含 Token revoke 後的 UI 變化）
  - 事件記錄：顯示最近授權時間、錯誤訊息、重新授權結果，並補齊測試腳本

### ⏳ Story 4.3: Connection 層級權限與端點保護
- **描述**: 針對 Connection 相關 API / Webhook 補齊使用者與 Connection 擁有權驗證，納入審計記錄，封存公開端點
- **範圍 / 要點**:
  - 驗證 Connection 所屬使用者與 platform scope，確保多 Connection 情境資料隔離
  - 調整 `/api/auth/shopline/install` 等入口：需登入 Session 或流向明確的安全 Token，避免匿名授權
  - API / Webhook 層級紀錄 userId、connectionId、操作時間；補齊 `note-2025-11-07-001` 所列安全缺口
  - 測試：撰寫權限測試腳本與自動化檢核，覆蓋 `note-2025-11-06-002` 的未測情境

---

## 移轉至 Phase 2 的項目（原 4.4 / 4.5）
- **動態路由重構與 URL 分享上下文**：依 `docs/memory/decisions/routing-strategy.md`，安排至 Refactor Story R3.3（Phase 2）再行規劃
- **Admin 模組全面 Connection 化**：跨頁模組（Webhook、Admin API 測試、Dashboard Widgets）的深度重構，延後至 Phase 2 重新拆解
- **Connection Insight 與通知**：狀態洞察、指標與告警改進，納入 Phase 2 規劃，待多平台願景一併評估

> 待 Phase 2 啟動時，請從本節與 `docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md` 重新整理優先度。

---

## 相關決策 / 文件
- Roadmap：`docs/memory/roadmap.md`（Phase 1.2）
- Connection 資料模型：`docs/memory/decisions/connection-data-model.md`
- Connection 狀態同步：`docs/memory/decisions/connection-state-sync.md`
- Token Lifecycle：`docs/memory/decisions/token-lifecycle-handling.md`
- Security / Routing：`docs/memory/decisions/routing-strategy.md`
- 架構討論：`docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`
- 測試缺口整理：`docs/archive/inbox/processed/note-2025-11-06-002.md`
- 公開端點檢視：`docs/archive/inbox/processed/note-2025-11-07-001.md`

---

**最後更新**: 2025-11-11

