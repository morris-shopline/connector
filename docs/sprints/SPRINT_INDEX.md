# Sprint 總覽

## 📋 Sprint 管理說明

本專案採用 **Sprint 為單位**進行開發管理。每個 Sprint 都有明確的目標、範圍和時程。

**文件結構**:
- 每個 Sprint 都有獨立的文件
- 文件命名格式：`{序號}-{名稱}.md`
- 所有 Sprint 文件都在 `docs/sprints/` 目錄下

---

## 🗓️ Sprint 時序表

| Sprint | 名稱 | 狀態 | 開始日期 | 完成日期 | 持續時間 | 說明 |
|--------|------|------|----------|----------|----------|------|
| [Sprint 0](#sprint-0-基礎架構與-oauth-授權) | 基礎架構與 OAuth 授權 | ✅ 已完成 | 2025-10-XX | 2025-11-03 | ~2 週 | 專案初始化、OAuth 流程、Webhook 基礎 |
| [Sprint 1](#sprint-1-bug-修復與架構優化) | Bug 修復與架構優化 | ✅ 已完成 | 2025-01-XX | 2025-01-XX | 1 天 | Token 過期處理、型別策略優化、健康檢查 |
| [Sprint 2](#sprint-2-admin-api-測試功能) | Admin API 測試功能 | ✅ 已完成 | 2025-01-XX | 2025-01-XX | ~3-5 天 | Admin API 封裝與測試介面 |

---

## 🔗 Sprint 詳細資訊

### Sprint 0: 基礎架構與 OAuth 授權

**狀態**: ✅ 已完成  
**日期**: 2025-10-XX ~ 2025-11-03  
**文件**: [00-foundation.md](./00-foundation.md)

**目標**:
- 建立專案基礎架構
- 實作 OAuth 2.0 授權流程
- 建立資料庫與資料模型
- 實作 Webhook 訂閱管理

**交付成果**:
- ✅ OAuth 授權流程完整實作
- ✅ 資料庫設計與整合
- ✅ Webhook 訂閱/取消訂閱功能
- ✅ 前端商店管理介面

**前置 Sprint**: 無（專案起始）

**後續 Sprint**: [Sprint 1](#sprint-1-bug-修復與架構優化)

---

### Sprint 1: Bug 修復與架構優化

**狀態**: ✅ 已完成  
**日期**: 2025-01-XX  
**文件**: [01-bug-fix-and-architecture.md](./01-bug-fix-and-architecture.md)

**目標**:
- 修復 Token 過期問題
- 優化型別定義策略
- 新增後端健康檢查功能

**交付成果**:
- ✅ Token 過期檢查機制
- ✅ 統一錯誤處理機制
- ✅ 型別定義完全獨立策略
- ✅ 健康檢查功能

**前置 Sprint**: [Sprint 0](#sprint-0-基礎架構與-oauth-授權)

**後續 Sprint**: [Sprint 2](#sprint-2-admin-api-測試功能)

---

### Sprint 2: Admin API 測試功能

**狀態**: ✅ 已完成（待正式環境測試確認）  
**日期**: 2025-01-XX ~ 2025-01-XX  
**文件**: [02-admin-api-testing.md](./02-admin-api-testing.md)

**目標**:
- ✅ 實作 Shopline Admin API 常用功能封裝
- ✅ 建立前端測試介面
- ✅ 統一錯誤處理機制
- ✅ Handle/Token 一致性保證（方案 B）

**交付成果**:
- ✅ Products API（Get, Get By Id, Create）
- ✅ Orders API（Get, Create）
- ✅ Store Info API
- ✅ Locations API（Get）
- ✅ 前端測試頁面（Toggle Menu, Request/Response 面板）
- ✅ Handle/Token 鎖定機制（方案 B）
- ✅ Header 統一化

**前置 Sprint**: [Sprint 1](#sprint-1-bug-修復與架構優化)

**後續 Sprint**: 待定（規劃：狀態管理重構 - 方案 A）

**關鍵決策**:
- 採用方案 B（最小改動）處理 handle/token 一致性問題
- 下個 Sprint 規劃完整 Context 架構重構（方案 A）

---

## 📊 Sprint 依賴關係

```
Sprint 0 (基礎架構)
    │
    ├─► OAuth 授權流程
    ├─► 資料庫設計
    ├─► Webhook 訂閱
    └─► 前端基礎介面
           │
           ▼
Sprint 1 (Bug 修復與架構優化)
    │
    ├─► Token 過期檢查
    ├─► 錯誤處理改進
    ├─► 型別策略優化
    └─► 健康檢查功能
           │
           ▼
Sprint 2 (Admin API 測試)
    │
    ├─► Products API
    ├─► Orders API
    ├─► Customers API
    └─► 測試介面
           │
           ▼
Sprint 3 (待規劃)
    │
    └─► ...
```

---

## 📈 Sprint 進度追蹤

### 已完成 Sprint

- ✅ **Sprint 0**: 基礎架構與 OAuth 授權 (2025-11-03 完成)
- ✅ **Sprint 1**: Bug 修復與架構優化 (2025-01-XX 完成)

### 進行中 Sprint

- 無

### 規劃中 Sprint

- 📝 **Sprint 2**: Admin API 測試功能（待 Review）

---

## 🎯 Sprint 命名規範

### 文件命名
- 格式：`{兩位數序號}-{英文名稱}.md`
- 範例：`00-foundation.md`, `01-bug-fix-and-architecture.md`, `02-admin-api-testing.md`
- 序號從 00 開始，依時序遞增

### Sprint 名稱
- 使用中文描述，清楚說明 Sprint 目標
- 避免過於技術性的術語
- 簡潔明瞭，方便追蹤

---

## 📝 Sprint 文件模板

每個 Sprint 文件應包含以下章節：

1. **Sprint 概述** - 目標、狀態、時程
2. **Sprint 目標** - 具體要達成的事項
3. **前置條件** - 依賴的 Sprint 或功能
4. **實作範圍** - 詳細的功能列表
5. **技術實作規劃** - 後端、前端、API 設計
6. **時程估算** - 各階段預估時間
7. **測試規劃** - 測試策略與清單
8. **風險與注意事項** - 潛在問題與應對
9. **完成標準** - 如何判定 Sprint 完成
10. **後續規劃** - 下一個 Sprint 的準備

---

## 🔄 Sprint 更新流程

1. **規劃階段**: 建立 Sprint 文件，定義目標與範圍
2. **Review**: 團隊 Review 確認無誤
3. **實作階段**: 開始開發，更新進度
4. **完成階段**: 標記完成，記錄經驗與問題
5. **規劃下一個**: 根據完成情況規劃下一個 Sprint

---

## 📚 相關文件

- [專案狀態](../PROJECT_STATUS.md) - 整體專案狀態
- [系統架構](../ARCHITECTURE.md) - 技術架構說明
- [專案結構與部署架構](../PROJECT_STRUCTURE.md) - 專案結構說明
- [Webhook 指南](../WEBHOOK_GUIDE.md) - Webhook 實作指南

---

## 📋 所有 Sprint 文件

- [Sprint 0: 基礎架構與 OAuth 授權](./00-foundation.md) - ✅ 已完成
- [Sprint 1: Bug 修復與架構優化](./01-bug-fix-and-architecture.md) - ✅ 已完成
- [Sprint 2: Admin API 測試功能](./02-admin-api-testing.md) - 📝 規劃中

---

**最後更新**: 2025-01-XX  
**維護者**: 專案團隊

