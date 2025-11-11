# Epic 6: 多 API 類型支援（Phase 2.1）

**狀態**: ⏳ planned（待 Phase 2 啟動時重新評估）  
**對應 Roadmap**: Phase 2.1 - 多 API 類型支援  
**開始日期**: -

---

## Epic 描述

當 Phase 1.2（Epic 4）與 Phase 1.3（Epic 5）完成後，本 Epic 將統一管理不同類型的 API，擴充 REST / Webhook 以外的能力，為後續資料流與多平台治理奠定基礎。核心目標：

- 導入 GraphQL、Bulk / Batch API 等新型態的呼叫能力
- 建立 API 類型能力矩陣與共用抽象層，統一錯誤處理與 Token 管理
- 產出 API 類型切換介面與設定工作流，與現有 Connection / Platform 架構整合

> 📌 本 Epic 在 Phase 2 前不開發。後續排程時需重新確認優先度與最新決策，並視 Next Engine 以外平台的需求做調整。

---

## 前置條件
- ✅ Epic 4（Phase 1.2）完成並穩定運作
- ⏳ Epic 5（Phase 1.3）完成多平台 MVP，提供 Next Engine 實作範例
- ✅ Refactor 1: 狀態管理階段 1 基礎架構完成（支援 API 類型管理）
- ⏳ Platform capability 決策補充（Phase 2 啟動時需更新）

---

## 當前狀態
- ✅ Admin API（已完成 - Epic 2）
- ✅ Webhook（已完成 - Epic 0）
- ⏳ GraphQL API（待開發）
- ⏳ Bulk / Batch API（待評估）
- ⏳ API 能力矩陣與 UI（待建立）

---

## Stories

### ⏳ Story 6.1: GraphQL / Bulk API 能力擴充
- **描述**: 實作 GraphQL API 與 Bulk / Batch API 的呼叫能力，建立最小抽象層
- **範圍 / 技術需求**:
  - 整合 GraphQL 客戶端、查詢封裝與錯誤處理
  - 評估 Bulk / Batch API 的排程與回傳結構，定義共用介面
  - 與 Token Lifecycle / Platform Adapter 整合，共享錯誤碼與重試策略

### ⏳ Story 6.2: API 類型統一管理模組
- **描述**: 建立 API 類型能力矩陣與設定中心，統一 Token / Scope / 配置管理
- **範圍 / 技術需求**:
  - 設計 `apiCapabilities` / `platformCapabilities` 結構，支援平台差異化
  - 整合 Connection / Platform 設定（`platform_apps`）及權限檢查
  - 補齊測試：API 類型與平台組合的驗證矩陣

### ⏳ Story 6.3: API 類型選擇 UI 與操作流程
- **描述**: 在前端提供 API 類型切換介面，整合設定與錯誤提示
- **範圍 / 技術需求**:
  - 建立 API 類型選擇器、設定表單、錯誤顯示
  - 與 Zustand / Router 策略整合，確保狀態一致性
  - 更新使用手冊與自動化測試，涵蓋多平台 + 多 API 類型情境

---

## 相關決策 / 文件
- Roadmap：`docs/memory/roadmap.md`（Phase 2.1）
- 狀態管理：`docs/memory/decisions/state-management.md`
- Connection 資料模型：`docs/memory/decisions/connection-data-model.md`
- Token Lifecycle：`docs/memory/decisions/token-lifecycle-handling.md`
- 多平台架構 backlog：`docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`

---

**最後更新**: 2025-11-11

