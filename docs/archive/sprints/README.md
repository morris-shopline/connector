# Sprints 目錄說明

> ⚠️ **重要說明**：這是舊方法論下的歷史記錄，**不作為當前任務管理**。

---

## 📋 定位說明

### `sprints/` vs `backlog/`

| 項目 | `sprints/` | `backlog/` |
|------|-----------|-----------|
| **用途** | 歷史記錄（已完成 Sprint 的詳細實作記錄） | 當前任務管理（Epic、Story 狀態管理） |
| **方法論** | 舊方法論（Sprint 概念） | 新方法論（Run、Epic、Story） |
| **內容** | 詳細的 Sprint 實作記錄、技術細節 | 簡化的 Epic、Story 狀態追蹤 |
| **更新** | 不更新（歷史記錄） | 持續更新（任務狀態） |
| **查看時機** | 需要查閱歷史實作細節時 | 查看當前任務進度時 |

---

## 📁 目錄內容

本目錄包含專案初期（使用舊 Sprint 方法論）的詳細實作記錄：

- `00-foundation.md` - Sprint 0: 基礎架構與 OAuth 授權（已完成）
- `01-bug-fix-and-architecture.md` - Sprint 1: Bug 修復與架構優化（已完成）
- `02-admin-api-testing.md` - Sprint 2: Admin API 測試功能（已完成）
- `03-state-management-refactor.md` - Sprint 3: 狀態管理架構重構（進行中/已完成）
- `SPRINT_INDEX.md` - Sprint 總覽索引

---

## 🚨 重要提醒

### 當前任務管理請使用

- **Epic 和 Story 管理**: `../../backlog/`
- **當前 Run 狀態**: `../../context/current-run.md`
- **任務總覽**: `../../backlog/index.md`

### 為什麼保留 `sprints/`？

這些文件包含詳細的實作記錄和技術細節，作為歷史參考：
- 了解過去的實作決策
- 查閱技術實作細節
- 參考實作模式

但**不應該**作為當前的任務管理工具。

---

## 🔗 相關文件

- **新方法論**: `../../memory/methodology.md`
- **當前任務**: `../../backlog/index.md`
- **當前 Run**: `../../context/current-run.md`

---

**最後更新**: 2025-11-05

