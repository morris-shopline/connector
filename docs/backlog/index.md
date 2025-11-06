# Backlog Index

> 所有任務的總覽，詳細內容請查看各分類文件

---

## Feature Epics

| Epic | 狀態 | 進度 | 對應 Roadmap | 相關 Run |
|------|------|------|--------------|----------|
| [Epic 0: 基礎架構與 OAuth 授權](./epics/epic-0-foundation.md) | ✅ completed | 100% | Phase 0 | Run 1 |
| [Epic 2: Admin API 測試功能](./epics/epic-2-admin-api-testing.md) | ✅ completed | 100% | Phase 0.6 | Run 3 |
| [Epic 3: Admin 管理系統](./epics/epic-3-admin-management-system.md) | ⏳ planned | 0% | Phase 1.1 | - |
| [Epic 4: 多商店管理](./epics/epic-4-multi-store-management.md) | ⏳ planned | 0% | Phase 1.2 | - |
| [Epic 5: 多 API 類型支援](./epics/epic-5-multi-api-types.md) | 🔄 部分完成 | 50% | Phase 1.3 | - |

---

## Refactors

| Refactor | 狀態 | 進度 | 對應 Roadmap | 相關 Run |
|----------|------|------|--------------|----------|
| [Epic 1: Bug 修復與架構優化](./epics/epic-1-bug-fix-and-optimization.md) | ✅ completed | 100% | Phase 0 | Run 2 |
| [Refactor 1: 狀態管理階段 1 基礎架構（Phase 1 準備）](./refactors/refactor-1-state-management-phase1.md) | 🔄 in-progress | 75% | Phase 1 準備 | run-2025-11-05-01 |
| [Refactor 2: 狀態管理階段 2 Redux 遷移（Phase 3.2 觸發）](./refactors/refactor-2-redux-migration.md) | ⏳ planned | 0% | Phase 3.2 準備 | - |

---

## Issues

| Issue | 類型 | 狀態 | 優先級 | 相關 Run |
|-------|------|------|--------|----------|
| [Issue 2025-11-06-001: URL 參數與 Zustand Store 同步機制導致閃跳問題](./issues/issue-2025-11-06-001.md) | 架構設計 | 🔄 open | High | run-2025-11-05-01 |

---

## All Stories (統一管理)

### Epic 0: 基礎架構與 OAuth 授權

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story 0.1: 專案基礎架構建立](./stories/story-0-1-foundation-setup.md) | Feature | Epic 0 | ✅ completed | Run 1 |
| [Story 0.2: OAuth 2.0 授權流程實作](./stories/story-0-2-oauth-flow.md) | Feature | Epic 0 | ✅ completed | Run 1 |
| [Story 0.3: 安全機制實作](./stories/story-0-3-security.md) | Feature | Epic 0 | ✅ completed | Run 1 |
| [Story 0.4: 前端基礎介面](./stories/story-0-4-frontend-ui.md) | Feature | Epic 0 | ✅ completed | Run 1 |
| [Story 0.5: Webhook 基礎功能](./stories/story-0-5-webhook-basics.md) | Feature | Epic 0 | ✅ completed | Run 1 |

### Epic 1: Bug 修復與架構優化

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story 1.1: Token 過期處理機制](./stories/story-1-1-token-expiry-handling.md) | Refactor | Epic 1 | ✅ completed | Run 2 |
| [Story 1.2: 型別定義策略優化](./stories/story-1-2-type-strategy-optimization.md) | Refactor | Epic 1 | ✅ completed | Run 2 |
| [Story 1.3: 健康檢查功能](./stories/story-1-3-health-check.md) | Feature | Epic 1 | ✅ completed | Run 2 |

### Epic 2: Admin API 測試功能

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story 2.1: Store Info API](./stories/story-2-1-store-info-api.md) | Feature | Epic 2 | ✅ completed | Run 3 |
| [Story 2.2: Products API](./stories/story-2-2-products-api.md) | Feature | Epic 2 | ✅ completed | Run 3 |
| [Story 2.3: Orders API](./stories/story-2-3-orders-api.md) | Feature | Epic 2 | ✅ completed | Run 3 |
| [Story 2.4: Locations API](./stories/story-2-4-locations-api.md) | Feature | Epic 2 | ✅ completed | Run 3 |
| [Story 2.5: 前端 Admin API 測試介面](./stories/story-2-5-admin-api-test-ui.md) | Feature | Epic 2 | ✅ completed | Run 3 |
| [Story 2.6: Handle/Token 一致性保證（方案 B）](./stories/story-2-6-handle-token-consistency.md) | Refactor | Epic 2 | ✅ completed | Run 3 |

### Epic 3: Admin 管理系統（Phase 1.1）

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story 3.1: 使用者認證系統](./stories/story-3-1-user-authentication.md) | Feature | Epic 3 | ✅ completed | run-2025-11-06-01 |
| [Story 3.2: 基礎權限驗證機制](./stories/story-3-2-basic-authorization.md) | Feature | Epic 3 | ✅ completed | run-2025-11-06-01 |
| [Story 3.3: 多租戶資料隔離](./stories/story-3-3-multi-tenant-data-isolation.md) | Feature | Epic 3 | ✅ completed | run-2025-11-06-01 |
| [Story 3.4: Admin 管理介面](./stories/story-3-4-admin-management-interface.md) | Feature | Epic 3 | ✅ completed | run-2025-11-06-01 |
| [Story 3.5: OAuth 授權流程與會員登入系統銜接](./stories/story-3-5-oauth-auth-integration.md) | Feature | Epic 3 | ✅ completed | run-2025-11-06-01 |

### Epic 4: 多商店管理（Phase 1.2）

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| Story 4.1: 多商店資料模型 | Feature | Epic 4 | ⏳ planned | - |
| Story 4.2: 商店選擇與切換 | Feature | Epic 4 | ⏳ planned | - |
| Story 4.3: 商店級別權限管理 | Feature | Epic 4 | ⏳ planned | - |
| Story 4.4: 商店管理介面 | Feature | Epic 4 | ⏳ planned | - |

### Epic 5: 多 API 類型支援（Phase 1.3）

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| Story 5.1: GraphQL API 支援 | Feature | Epic 5 | ⏳ planned | - |
| Story 5.2: API 類型統一管理 | Feature | Epic 5 | ⏳ planned | - |
| Story 5.3: API 類型選擇 UI | Feature | Epic 5 | ⏳ planned | - |

### Refactor 1: 狀態管理階段 1 基礎架構（Phase 1 準備）

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| [Story R1.0: Zustand 階段 1 核心實作](./stories/story-r1-0-zustand-implementation.md) | Refactor | Refactor 1 | ✅ completed | run-2025-11-05-01 |
| Story R1.1: 多平台狀態管理擴展（Phase 2 支援） | Refactor | Refactor 1 | ⏳ planned | - |
| Story R1.2: 多裝置 Session 狀態管理（Phase 2 支援） | Refactor | Refactor 1 | ⏳ planned | - |
| Story R1.3: 資料流狀態管理擴展（Phase 3.1 支援） | Refactor | Refactor 1 | ⏳ planned | - |
| Story R1.4: 資料流執行狀態 UI（Phase 3.1 支援） | Refactor | Refactor 1 | ⏳ planned | - |

### Refactor 2: 狀態管理階段 2 Redux 遷移（Phase 3.2 觸發）

| Story | 類型 | 所屬 | 狀態 | 完成 Run |
|-------|------|------|------|----------|
| Story R2.1: Redux 架構規劃與遷移策略 | Refactor | Refactor 2 | ⏳ planned | - |
| Story R2.2: Redux Store 建立與核心功能 | Refactor | Refactor 2 | ⏳ planned | - |
| Story R2.3: Job 管理狀態實作 | Refactor | Refactor 2 | ⏳ planned | - |
| Story R2.4: Zustand → Redux 遷移 | Refactor | Refactor 2 | ⏳ planned | - |

---

## 📊 狀態管理架構規劃對照表

| Refactor | 狀態 | 對應 Roadmap | 觸發條件 | 階段 |
|----------|------|--------------|----------|------|
| **Refactor 1** | 🔄 in-progress | Phase 1 準備 | Phase 1 開始前 | Zustand 階段 1（核心完成） |
| **Refactor 2** | ⏳ planned | Phase 3.2 準備 | Phase 3.2 開始前（關鍵觸發點） | Redux 階段 2 |

### 狀態管理階段說明

**階段 1（Zustand）**：
- 適用範圍：Phase 1、Phase 2、Phase 3.1
- 技術方案：Zustand + 後端 Session + Redis
- 關鍵里程碑：Phase 3.1 完成後評估階段 2
- Refactor 1 包含所有階段 1 的擴展（Phase 2、Phase 3.1 支援）

**階段 2（Redux）**：
- 觸發條件：Phase 3.2 Job 管理系統（關鍵觸發點）
- 技術方案：Redux Toolkit + 複雜狀態管理
- 適用範圍：Phase 3.2 及後續複雜功能

**詳細決策**：見 `docs/memory/decisions/state-management.md`

### 功能 Epic 與狀態管理對應

| Feature Epic | 對應 Roadmap | 前置條件 |
|--------------|--------------|----------|
| **Epic 3: Admin 管理系統** | Phase 1.1 | Refactor 1 完成 |
| **Epic 4: 多商店管理** | Phase 1.2 | Epic 3 + Refactor 1 完成 |
| **Epic 5: 多 API 類型支援** | Phase 1.3 | Epic 4 + Refactor 1 完成 |

---

## 快速查找

- **Feature Stories**: 查看對應 Epic 文件
- **Refactor Stories**: 查看對應 Refactor 文件
- **Bug/Issue Stories**: 查看對應 Issue 文件
- **所有 Story 詳細資訊**: 查看 `stories/` 目錄
- **當前 Run 資訊**: 查看 `context/current-run.md`

---

**最後更新**: 2025-11-06

