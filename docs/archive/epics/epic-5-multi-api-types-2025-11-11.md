# Epic 5: 多 API 類型支援（Phase 1.3）

**狀態**: 🔄 部分完成  
**對應 Roadmap**: Phase 1.3  
**開始日期**: -

---

## Epic 描述

統一管理不同類型的 API，支援 Admin API、Webhook、GraphQL 等多種 API 類型。

**前置條件**：
- ✅ Epic 4: 多商店管理完成（Phase 1.2）
- ✅ Refactor 1: 狀態管理階段 1 基礎架構完成（API 類型管理）

**當前狀態**：
- ✅ Admin API（已完成 - Epic 2）
- ✅ Webhook（已完成 - Epic 0）
- ⏳ GraphQL（待開發）
- ⏳ 其他 API（待開發）

---

## Stories

### ✅ Story 2.1-2.5: Admin API（已完成）
- **狀態**: completed
- **描述**: Admin API 測試功能（Epic 2）
- **完成**: Store Info、Products、Orders、Locations API

### ✅ Story 0.5: Webhook（已完成）
- **狀態**: completed
- **描述**: Webhook 基礎功能（Epic 0）
- **完成**: Webhook 訂閱/取消訂閱、事件接收

### ⏳ Story 5.1: GraphQL API 支援
- **狀態**: planned
- **描述**: 實作 GraphQL API 類型支援
- **技術需求**:
  - GraphQL 客戶端整合
  - GraphQL 查詢封裝
  - GraphQL 錯誤處理

### ⏳ Story 5.2: API 類型統一管理
- **狀態**: planned
- **描述**: 統一管理不同 API 類型的 Token 和配置
- **技術需求**:
  - API 類型管理系統
  - 不同 API 的 Token/配置管理
  - 統一的 API 呼叫介面

### ⏳ Story 5.3: API 類型選擇 UI
- **狀態**: planned
- **描述**: 實作 API 類型選擇的前端介面
- **技術需求**:
  - API 類型選擇器
  - API 配置管理 UI
  - 狀態管理整合（使用 Refactor 1 的狀態管理）

---

## 相關決策

- 見 `docs/memory/roadmap.md` - Phase 1.3
- 需要 Refactor 1 的 API 類型管理

---

**最後更新**: 2025-11-05

