# Epic 4: Connection 管理體驗（Phase 1.2）

**狀態**: ✅ completed  
**對應 Roadmap**: Phase 1.2 - 多商店管理  
**開始日期**: 2025-11-12  
**完成日期**: 2025-11-12  
**完成 Run**: run-2025-11-12-01

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
- ✅ Story 4.1 ~ 4.3 已完成（run-2025-11-12-01）
  - Story 4.1: Connection Dashboard 與列表體驗 ✅ completed
  - Story 4.2: Connection 建立與重新授權工作流 ✅ completed
  - Story 4.3: Connection 層級權限與端點保護 ✅ completed
- ⏳ User Test 驗收中
- 🔜 Next Engine（Roadmap Phase 1.3）將由新 Epic 5 追蹤，不在本 Epic 範圍

---

## 前置條件
- ✅ Epic 3 完成（Admin 管理系統）
- ✅ [Refactor 3: Connection 基礎重構](../refactors/refactor-3-connection-foundation.md) 核心 Stories 完成（R3.0, R3.1, R3.2）
- ✅ Connection 決策文件落地（資料模型 / 狀態同步 / Token lifecycle）
- ✅ Story 4.1 ~ 4.3 已完成（run-2025-11-12-01）

---

## 核心目標（Phase 1.2 MVP）
- Shopline 單平台下的 Connection List / Dashboard 上線，含空態、狀態徽章與測試流程
- 可自介面完成新增、重新授權與停用 Connection，回傳狀態與錯誤處理一致
- 針對 Connection 相關 API 與 Webhook 實作使用者／Connection 擁有權保護，並補齊記錄與測試
- 既有 Admin 功能在多 Connection 情境下不再出現舊資料殘留、閃跳或未授權存取
- **依照 `ADMIN_APP_UI_ARCHITECTURE.md` + `CONNECTION_MANAGEMENT_UI_DESIGN.md` 建立統一的前台操作體驗，確保 Phase 1.3/Phase 2 能沿用同一 UI 分層**

---

## UI / UX 設計指引

- 上位架構：`docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- 詳細設計規格：`docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- 設計原則：
  - Connection Rail + Workspace Tab 架構，支援平台切換與擴充能力  
  - Zustand 為唯一 Source of Truth，URL 僅作初始化（對應 `connection-state-sync` 決策）  
  - 重用狀態徽章、平台徽章等元件，降低多平台擴充成本  
  - Activity / Insight 面板 Phase 1.2 先留空，Phase 2 可即插即用
- 實作時需建立組件目錄 `components/connections/`，統一封裝 Connection UI 元件，並與 `components/layout/PrimaryNav.tsx` 等全域元件對齊。

---

## Stories

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story 4.1: Connection Dashboard 與列表體驗](../stories/story-4-1-connection-dashboard.md) | Feature | Epic 4 | ✅ completed | run-2025-11-12-01 |
| [Story 4.2: Connection 建立與重新授權工作流](../stories/story-4-2-connection-workflow.md) | Feature | Epic 4 | ✅ completed | run-2025-11-12-01 |
| [Story 4.3: Connection 層級權限與端點保護](../stories/story-4-3-connection-security.md) | Feature | Epic 4 | ✅ completed | run-2025-11-12-01 |

---

## 成功標準 / 驗收重點

- Run 完成後，登入落地頁即為 `Connections` 模組，畫面結構符合 `ADMIN_APP_UI_ARCHITECTURE.md` 定義（Primary Nav + Context Bar + Workspace + Activity Dock 空態）。
- Connection 管理功能遵循 `CONNECTION_MANAGEMENT_UI_DESIGN.md` 的流程與元件設計，含 Flow C1~C4 行為、空態引導與狀態徽章。
- Cross-module 整合：Webhook / Admin API 頁面能共用 Context Bar 的 Connection 狀態，無閃跳或殘留資料。
- Activity / 通知：Token 重新授權、停用操作、錯誤提示透過統一通道呈現（Activity Dock 或 toast），符合 Token Lifecycle 決策。
- 文件回收：Story 4.1~4.3 在技術細節階段需引用上述設計文件並列出測試矩陣，Run 驗收時更新 Story 驗收紀錄。

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

**最後更新**: 2025-11-12

