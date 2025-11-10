# 專案 Roadmap

> 📋 **重要說明**: 本文件記錄專案的長期發展規劃，是所有技術決策的重要依據。  
> 任何技術選型、架構設計、實作方案都應該參考此 Roadmap 進行評估。

**建立日期**: 2025-11-04  
**最後更新**: 2025-11-10  
**狀態**: 📝 規劃中（快速迭代）

---

## 🎯 Roadmap 概述

本專案將快速迭代，從單一平台（Shopline）的基礎整合，逐步發展為多平台、多租戶的企業級資料流整合平台。

### 核心發展方向

1. **多租戶系統**: 支援多個 Admin 使用者，每個使用者管理多個商店
2. **多平台整合**: 支援多個電商平台與行銷平台
3. **資料流引擎**: 模組化的資料同步與轉換系統
4. **可視化編輯器**: Flow Editor 讓使用者自定義資料流

---

## 📅 Roadmap 詳細規劃

### Phase 0: 基礎架構（已完成）✅

#### 0.1 專案基礎架構 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-11-03
- **功能**:
  - ✅ 後端框架設定（Fastify + TypeScript）
  - ✅ 前端框架設定（Next.js + TypeScript）
  - ✅ 資料庫整合（Prisma + Neon PostgreSQL）
  - ✅ 開發環境配置

#### 0.2 OAuth 授權流程 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-11-03
- **功能**:
  - ✅ Shopline OAuth 2.0 授權流程
  - ✅ 安裝請求驗證
  - ✅ 授權碼交換 Access Token
  - ✅ JWT Token 解析與儲存
  - ✅ 商店資訊管理

#### 0.3 安全機制 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-11-03
- **功能**:
  - ✅ HMAC-SHA256 簽名驗證
  - ✅ 時間戳驗證
  - ✅ 防時序攻擊機制
  - ✅ Token 過期檢查機制

#### 0.4 前端基礎介面 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-11-04
- **功能**:
  - ✅ 商店列表展示
  - ✅ 授權對話框
  - ✅ 統一 Header 組件
  - ✅ Webhook 測試介面
  - ✅ Admin API 測試介面

#### 0.5 Webhook 基礎功能 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-11-03
- **功能**:
  - ✅ Webhook 訂閱/取消訂閱
  - ✅ Webhook 事件接收與儲存
  - ✅ Webhook 事件展示

#### 0.6 Admin API 封裝 ✅
- **狀態**: ✅ 已完成
- **完成日期**: 2025-01-XX
- **功能**:
  - ✅ Products API（Get, Get By Id, Create）
  - ✅ Orders API（Get, Create）
  - ✅ Store Info API
  - ✅ Locations API（Get）
  - ✅ 前端測試介面

---

### Phase 1: 多租戶與多平台管理

#### 1.1 導入 Admin 管理系統
- **目標**: 建立多租戶基礎架構
- **狀態**: ✅ 已完成（run-2025-11-06-01）
- **功能**:
  - ✅ 登入後才能使用介面並檢視資料
  - ✅ 不同 Admin 看到各自資料
  - ✅ 基礎權限檢查與資料隔離
- **技術成果**:
  - Story 3.1 ~ 3.5 完成（後端認證、權限驗證、多租戶隔離、Admin 介面、OAuth 串接）
  - 測試策略：核心 API 實機測試完備，前端與 OAuth 實機流程 2025-11-10 由使用者簽核結案，需時再排 Human run 覆測

#### 1.2 多商店管理
- **目標**: 支援單一 Admin 管理多個商店與跨平台 Connection
- **狀態**: 🔄 規劃中（Run A 籌備中）
- **近期里程碑**:
  - 🧱 **Run A（Connection baseline）**：完成 Connection 資料模型與狀態同步基礎，預計涵蓋 Story 4.1、4.2、4.5，並同步執行 Refactor 3 `R3.0`、`R3.1`、`R3.2`
  - 🔄 **Run B**：銜接到 1.3 多平台 MVP（Next Engine），延續 Run A 架構成果
- **MVP 功能**:
  - 🎯 Admin 可以管理同平台多個 Connection（Shopline 多商店）
  - 🎯 Connection / Connection Item 選擇與切換（URL 單一真實來源）
  - 🎯 Connection 層級權限與狀態顯示（Active / Expired / Error）
- **技術前提**:
  - 遵循 `docs/memory/decisions/connection-data-model.md` 的 schema 調整
  - 實作 `docs/memory/decisions/connection-state-sync.md` 所述的 URL → Router → Store 單向同步策略
  - 導入 `docs/memory/decisions/token-lifecycle-handling.md` 規範的錯誤碼與重新授權 UX

#### 1.3 多平台 MVP（Next Engine PoC）
- **目標**: 在 Phase 1 結尾導入第二個平台（Next Engine）作為多平台打底，驗證 Connection 架構可支援跨平台
- **狀態**: ⏳ planned（Run B 預計執行）
- **MVP 範圍**:
  - 🚀 建立 Next Engine OAuth Flow（Authorize / Callback / Token Refresh）
  - 🚀 實作最小封裝的 API（店鋪/訂單資訊查詢）與錯誤處理
  - 🚀 將 Next Engine 納入 Connection / Connection Item 模型與前端 Connection 選取流程
  - 🚀 提供重新授權與錯誤碼對應（沿用 Run A 的 Token Lifecycle 規範）
- **技術前提**:
  - Run A（Connection baseline）完成資料模型、狀態同步、Token Lifecycle Refactor
  - 平台設定（`platform_apps`）可註冊 Next Engine 憑證
  - Adapter / Service Factory 介面明確定義
- **驗收指標**:
  - 新增/查看 Next Engine Connection 與對應 Items
  - 同一使用者可並行管理 Shopline + Next Engine 連線
  - OAuth 錯誤提示與重新授權流程可正常操作

#### Phase 1 Refactor / 決策對照
- `docs/memory/decisions/connection-data-model.md` → 對應 Refactor 3 `R3.0`，先行調整 schema 與 migration
- `docs/memory/decisions/connection-state-sync.md` → 對應 Refactor 3 `R3.1`，統一 Connection 選取同步策略
- `docs/memory/decisions/token-lifecycle-handling.md` → 對應 Refactor 3 `R3.2` 及 Story 4.5，調整錯誤碼與重新授權流程
- Run A 完成後，Epic 4 主線 Story 才能進入實作；若 Refactor 延遲，需先排除在 Run 內容外

---

### Phase 2: 多平台擴展與全域體驗

#### 2.1 多 API 類型支援
- **目標**: 統一管理不同 API 類型（REST / GraphQL / Webhook / Batch Job），讓平台擴展可共用呼叫介面
- **狀態**: 🔄 部分完成（REST / Webhook 既有，GraphQL 與 Batch 待開發）
- **功能**:
  - ✅ Admin REST API（已完成）
  - ✅ Webhook 事件接收與儲存（已完成）
  - ⏳ GraphQL / Bulk API 支援
  - ⏳ API 類型切換與對應 UI/CLI
- **技術需求**:
  - API 類型能力矩陣與共用抽象層
  - Token / Scope / Permission 對應表
  - Error & Retry 策略（同步 API / 非同步 Job）

#### 2.2 多裝置登入
- **目標**: 支援多裝置同時登入與狀態同步
- **功能**:
  - 支援多裝置 Session 並行、強制登出、裝置列表管理
  - 跨裝置共享 Connection / 運維狀態
  - 裝置級別通知與 MFA（可選）
- **技術需求**:
  - Session 管理（Redis Cluster）、裝置識別、Token 刷新流程
  - 事件通知（WebSocket / SSE / Push）與裝置同步
  - 安全防護（IP 白名單、登入告警、MFA 擴充點）

#### 2.3 多平台架構補齊
- **目標**: 在 Next Engine MVP 基礎上，整合 2.1 / 2.2 的成果，擴展為可插拔多平台架構，落實跨平台共用的授權、Webhook、API、資料模型
- **狀態**: ⏳ planned
- **範圍**:
  - 📦 導入第二批平台（Shopline 2.0 / Shopify / LINE 等）所需的共用 Adapter 介面與 Lifecycle
  - 📦 建立平台組態中心（`platform_apps` 擴充、Secrets 管理、環境差異設定）
  - 📦 定義跨平台 Webhook / API 規格抽象（Topic Mapping、Payload Normalizer），納入多 API 能力矩陣
  - 📦 完備 retry / rate-limit / healthcheck 機制，結合多裝置事件同步與平台監控指標
- **技術需求**:
  - 平台模組化設計（Factory + Adapter + Capability Flags）
  - OAuth / Token lifecycle 模組化與加密憑證管理（含多裝置 Session 與重新授權流程）
  - 平台層級的資料驗證與錯誤碼標準化，回饋到 API 抽象與裝置體驗

---

### Phase 3: 資料流系統

#### 3.1 資料流引擎
- **目標**: 建立模組化的資料同步系統
- **功能**:
  - 固定制資料流：A 平台 product updated -> B 平台 post update product
  - 資料轉換與映射
  - 逐步模組化（從固定制到可配置）
- **技術需求**:
  - 資料流狀態管理
  - 資料流配置管理
  - 執行狀態追蹤
  - 錯誤處理與重試機制

#### 3.2 Job 管理系統
- **目標**: 將資料流轉換為可管理的 Job
- **功能**:
  - 多個資料流可設定成 Job
  - Job 可監測、可暫停、可重啟
  - Job 執行歷史與統計
- **技術需求**:
  - Job 狀態管理（Redis 必要）
  - Job Queue 管理（Redis Queue）
  - Job 執行歷史與監測
  - Job 排程與觸發機制

---

### Phase 4: 模組化與擴展

#### 4.1 模組化架構
- **目標**: 快速導入更多不同平台的串接
- **功能**:
  - 快速整合新平台（GA4、LINE、Shopify、Meta Ads、Google Ads、TikTok...）
  - 模組化的平台實作
  - 動態配置管理
- **技術需求**:
  - 平台模組管理系統
  - 動態配置管理
  - 擴展性架構設計
  - 統一的平台介面規範

#### 4.2 Flow Editor
- **目標**: 提供可視化的資料流編輯器
- **功能**:
  - 整合 React Flow
  - 視覺化資料流設計
  - 開放自定義彈性
  - 協同編輯（未來）
- **技術需求**:
  - Flow 配置狀態管理
  - 編輯器狀態管理
  - Flow 執行狀態追蹤
  - 即時協同編輯（WebSocket/SSE）

#### 4.3 JS Tracking
- **目標**: 導入前端追蹤功能
- **功能**:
  - JavaScript 追蹤代碼
  - 事件追蹤
  - 資料收集與分析
- **技術需求**:
  - 追蹤代碼管理
  - 事件收集系統
  - 資料分析與處理

---

## 🎯 Roadmap 對技術決策的關鍵影響

### 架構層面

#### 1. 狀態複雜度急劇增加
- **多租戶層級**: Admin × 商店 × 平台 × API 類型
- **多層級狀態**: 使用者、商店、平台、API、資料流、Job
- **狀態關聯性**: Admin → 商店 → 平台 → API → 資料流 → Job

#### 2. 持久化成為必要需求
- ✅ **多裝置登入**: 需要 Session 持久化（Redis）
- ✅ **Job 管理**: 需要 Job Queue 與狀態持久化（Redis）
- ✅ **資料流狀態**: 需要執行狀態追蹤與持久化
- ✅ **Flow 配置**: 需要配置持久化

#### 3. 後端參與狀態管理成為必要
- ✅ **多租戶隔離**: 必須在後端驗證權限與資料隔離
- ✅ **安全性**: Token 管理必須在後端（不能暴露到前端）
- ✅ **狀態一致性**: 多裝置同步需要後端協調
- ✅ **Job 管理**: 必須在後端執行與管理

#### 4. Redis 成為必要基礎設施
- ✅ **Session 管理**: 多裝置登入、Session 共享
- ✅ **Job Queue**: 資料流執行、Job 管理
- ✅ **狀態快取**: 平台配置、Token 快取、執行狀態
- ✅ **分散式鎖**: 多裝置操作、Job 執行鎖定

#### 5. 擴展性架構要求
- ✅ **模組化設計**: 快速整合新平台
- ✅ **統一狀態管理接口**: 不同平台使用統一介面
- ✅ **可插拔架構**: 新平台、新 API 類型容易擴展
- ✅ **效能考量**: 大量商店、大量資料流、大量 Job

---

## 📋 技術決策參考

### 必須滿足的核心需求

1. ✅ **多租戶支援**: Admin → 商店 → 平台 → API 的完整層級管理
2. ✅ **持久化**: Session、Job、資料流狀態持久化
3. ✅ **多裝置同步**: 多裝置登入、狀態同步
4. ✅ **安全性**: Token 管理、權限驗證、資料隔離
5. ✅ **擴展性**: 快速整合新平台、新 API 類型
6. ✅ **效能**: 大量資料下的高效能狀態管理

### 技術基礎設施需求

1. ✅ **Redis**: Session、Job Queue、狀態快取、分散式鎖
2. ✅ **後端狀態管理**: 多租戶隔離、安全性、狀態一致性
3. ✅ **前端狀態管理**: UI 狀態、使用者互動、即時更新
4. ✅ **狀態同步機制**: 前後端狀態同步、多裝置同步

### 架構設計原則

1. **模組化**: 所有平台、API 類型都應該模組化設計
2. **可擴展**: 新功能應該容易整合，不影響現有系統
3. **可維護**: 清晰的架構設計，容易理解和維護
4. **高效能**: 考慮大量資料和大規模並發的場景
5. **安全性**: 多租戶隔離、Token 管理、權限驗證

---

## 🔗 相關文件

- [狀態管理架構決策](./decisions/state-management.md) - 基於本 Roadmap 的狀態管理方案決策
- [部署策略決策](./decisions/deployment-strategy.md) - 部署架構分析與 AWS 遷移規劃（基於本 Roadmap）
- [系統架構](./architecture/current.md) - 整體系統架構設計
- [專案結構與部署架構](./architecture/project-structure.md) - 專案結構說明
- [Backlog 索引](../backlog/index.md) - 任務管理與進度追蹤

---

## 📝 更新記錄

| 日期 | 更新內容 | 更新者 |
|------|---------|--------|
| 2025-11-04 | 建立 Roadmap 文件 | System |
| 2025-11-10 | 更新 Phase 1 進度、納入 Connection 架構決策與 Refactor 對應 | Agent |

---

**重要提醒**: 
- 本 Roadmap 是技術決策的重要依據
- 任何技術選型、架構設計都應該參考此 Roadmap
- Roadmap 會隨著專案發展持續更新

