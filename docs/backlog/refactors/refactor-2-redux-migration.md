# Refactor 2: 狀態管理階段 2 Redux 遷移（Phase 3.2 觸發）

**狀態**: ⏳ planned  
**對應 Roadmap**: Phase 3.2 準備（Job 管理系統）  
**開始日期**: -
**觸發條件**: Phase 3.2 Job 管理系統開始前

---

## Refactor 描述

將狀態管理從階段 1（Zustand）遷移到階段 2（Redux），以支援 Phase 3.2（Job 管理系統）的複雜狀態管理需求。

**觸發條件**（見 `docs/memory/decisions/state-management.md`）：
- **Job Queue 功能上線**（關鍵觸發點）
- 需要複雜的 Job 管理（監測、暫停、重啟）
- 需要即時狀態更新（多裝置同步）
- 需要複雜的狀態同步

**不觸發的情況**：
- ❌ 多租戶本身不需要階段 2（Zustand 足夠）
- ❌ 多平台本身不需要階段 2（Zustand 足夠）
- ❌ 簡單資料流不需要階段 2（Zustand 足夠）

---

## Stories

### ⏳ Story R2.1: Redux 架構規劃與遷移策略
- **狀態**: planned
- **描述**: 規劃 Redux 架構，制定 Zustand → Redux 遷移策略
- **技術需求**:
  - Redux Toolkit 架構設計
  - 遷移路徑規劃
  - 狀態映射策略

### ⏳ Story R2.2: Redux Store 建立與核心功能
- **狀態**: planned
- **描述**: 建立 Redux Store，實作核心狀態管理功能
- **技術需求**:
  - Redux Toolkit 設定
  - 核心 Slices 建立
  - Middleware 配置

### ⏳ Story R2.3: Job 管理狀態實作
- **狀態**: planned
- **描述**: 實作 Job 管理相關的狀態管理（Phase 3.2 核心需求）
- **技術需求**:
  - Job 狀態管理（監測、暫停、重啟）
  - Job Queue 狀態管理
  - 即時狀態更新機制

### ⏳ Story R2.4: Zustand → Redux 遷移
- **狀態**: planned
- **描述**: 將現有 Zustand Store 遷移到 Redux
- **技術需求**:
  - 狀態遷移
  - 組件更新
  - 移除 Zustand 依賴

---

## 相關決策

- 見 `docs/memory/decisions/state-management.md`
- 階段 2 觸發條件明確（Phase 3.2）
- 遷移路徑：見 `archive/discussions/state-management-strategy-2025-11-04.md`

---

**最後更新**: 2025-11-05

