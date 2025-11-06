# Sprint 3: 狀態管理架構重構

## ⚠️ 重要提醒（給 Agent）

> **🚨 請在開始下一個 Sprint 前，務必先與用戶溝通文件管理方式！**

**當前狀況**:
- Sprint 3 正在進行中（狀態管理架構重構 - 階段 1）
- 本 Sprint 文件塞入太多內容，結構需要重新整理

**請 Agent 注意**:
1. ✅ **下個 Sprint 開始前，必須先與用戶溝通文件管理方式**
2. ✅ **不要直接進入實作**（除非用戶明確要求解 issue）
3. ✅ **主動提醒用戶**：需要重新討論、定義軟體開發思維與流程
4. ✅ **協助用戶重新調整文件管理架構**，確保未來可以順暢進行人與多 agent 的開發協作

**關鍵問題需要討論**:
- 目前 Sprint 文件結構是否適合多 agent 協作？
- 文件管理方式是否需要調整？
- 軟體開發流程是否需要重新定義？

---

## 📋 Sprint 概述

**目標**: 實作狀態管理架構重構（方案 A 階段 1），解決 handle/token 一致性問題，建立可擴展的狀態管理基礎架構。

**狀態**: 🚀 進行中（實作階段）  
**開始日期**: 2025-11-04  
**完成日期**: 待定  
**持續時間**: 預計 3-5 天

**前置 Sprint**: [Sprint 2: Admin API 測試功能](./02-admin-api-testing.md)  
**後續 Sprint**: 待定（將實作 SL get product -> NE update product 關鍵 milestone）

**最終決策**: ✅ **採用方案 A（Zustand 漸進式 → Redux）階段 1**
- 詳細決策記錄請參考：[狀態管理策略：Agent-Based 開發視角](../STATE_MANAGEMENT_AGENT_STRATEGY.md)

---

## 🎯 Sprint 目標

### 核心目標

1. ✅ **完成狀態管理架構重構**（方案 A 階段 1）
   - 實作 Zustand 統一狀態管理
   - 實作後端 Session 管理
   - 整合 Redis 快取

2. ✅ **解決 Handle/Token 一致性問題**
   - 統一的前端狀態管理（Zustand）
   - 後端 Session 驗證機制
   - 確保跨頁面狀態一致性

3. ✅ **建立可擴展的基礎架構**
   - 為多租戶、多平台、資料流等功能做好準備
   - 階段 1 架構可以維持到完成 SL get product -> NE update product 關鍵 milestone

4. ✅ **確保既有功能穩定運作**
   - 所有既有功能正常運作
   - 不再發生 state 不一致造成的 issue
   - 更穩定的系統架構

### 階段 1 適用範圍

✅ **階段 1 將維持到**:
- Phase 1 完成（多租戶 + 多平台）
- Phase 2 完成（多平台整合）
- Phase 3.1 簡單資料流（SL get product -> NE update product）✅ **關鍵 milestone**
- Phase 3.2 Job 管理系統開始前（需要重新評估）

---

## 🔍 問題背景

### 當前問題（Sprint 2 已用方案 B 暫時解決）

- Handle/Token 狀態管理分散在多個頁面
- 沒有統一的狀態管理機制
- 異步操作可能出現 handle/token 不一致
- 多步驟操作需要手動鎖定 handle

### 方案 B 的限制

- 僅在前端 Hook 層級處理，無法跨頁面共享狀態
- 沒有持久化機制
- 擴展性有限，未來新增功能仍需重複處理

---

## 🚀 Roadmap 分析與需求預估

> 📋 **Roadmap 文件**: 完整的專案 Roadmap 請參考 [PROJECT_ROADMAP.md](../PROJECT_ROADMAP.md)

### 專案 Roadmap（快速迭代）

根據 [PROJECT_ROADMAP.md](../PROJECT_ROADMAP.md)，專案將快速迭代以下功能：

#### Phase 1: 多租戶與多平台管理
- ✅ **導入 Admin 管理系統**
  - 需要登入才能使用與檢視
  - 不同 Admin 可以看到不同資料
  - **狀態管理需求**: 使用者 Session、權限管理、資料隔離

- ✅ **多商店管理**
  - Admin 可以管理同一個平台（Shopline）多個店家
  - **狀態管理需求**: 商店選擇、多商店狀態切換、權限驗證

- ✅ **多 API 類型支援**
  - 現有：Admin API、Webhook
  - 未來：GraphQL、其他 API
  - **狀態管理需求**: API 類型管理、不同 API 的 Token/配置管理

#### Phase 2: 多平台整合
- ✅ **多平台授權**
  - 下一步：Shopline 2.0、NE
  - 未來：GA4、LINE、Shopify、Meta Ads、Google Ads、TikTok...
  - **狀態管理需求**: 
    - 不同平台的 Auth Flow 管理
    - 不同平台的 API/Webhook 規格管理
    - 平台配置與 Token 管理

- ✅ **多裝置登入**
  - 支援多裝置同時登入使用
  - **狀態管理需求**: 
    - Session 管理（Redis 必要）
    - 多裝置狀態同步
    - Token 刷新與失效管理

#### Phase 3: 資料流系統
- ✅ **資料流引擎**
  - 固定制資料流：A 平台 product updated -> B 平台 post update product
  - 逐步模組化
  - **狀態管理需求**: 
    - 資料流狀態管理
    - 資料流配置
    - 執行狀態追蹤

- ✅ **Job 管理系統**
  - 多個資料流可設定成 Job
  - 可監測、可暫停
  - **狀態管理需求**: 
    - Job 狀態管理（Redis 必要）
    - Job Queue 管理
    - Job 執行歷史與監測

#### Phase 4: 模組化與擴展
- ✅ **模組化架構**
  - 快速導入更多不同平台的串接
  - **狀態管理需求**: 
    - 平台模組管理
    - 動態配置管理
    - 擴展性架構

- ✅ **Flow Editor**
  - 整合 React Flow
  - 開放自定義彈性
  - **狀態管理需求**: 
    - Flow 配置狀態
    - 編輯器狀態管理
    - Flow 執行狀態

### Roadmap 對狀態管理的關鍵影響

#### 1. **狀態複雜度急劇增加**
- 多租戶（Admin × 商店 × 平台 × API 類型）
- 多層級狀態（使用者、商店、平台、API、資料流、Job）
- 狀態關聯性複雜（Admin → 商店 → 平台 → API → 資料流 → Job）

#### 2. **持久化成為必要需求**
- ✅ **多裝置登入**: 需要 Session 持久化（Redis）
- ✅ **Job 管理**: 需要 Job Queue 與狀態持久化（Redis）
- ✅ **資料流狀態**: 需要執行狀態追蹤與持久化
- ✅ **Flow 配置**: 需要配置持久化

#### 3. **後端參與狀態管理成為必要**
- ✅ **多租戶隔離**: 必須在後端驗證權限與資料隔離
- ✅ **安全性**: Token 管理必須在後端（不能暴露到前端）
- ✅ **狀態一致性**: 多裝置同步需要後端協調
- ✅ **Job 管理**: 必須在後端執行與管理

#### 4. **Redis 成為必要基礎設施**
- ✅ **Session 管理**: 多裝置登入、Session 共享
- ✅ **Job Queue**: 資料流執行、Job 管理
- ✅ **狀態快取**: 平台配置、Token 快取、執行狀態
- ✅ **分散式鎖**: 多裝置操作、Job 執行鎖定

#### 5. **擴展性架構要求**
- ✅ **模組化設計**: 快速整合新平台
- ✅ **統一狀態管理接口**: 不同平台使用統一介面
- ✅ **可插拔架構**: 新平台、新 API 類型容易擴展
- ✅ **效能考量**: 大量商店、大量資料流、大量 Job

### 狀態管理架構必須滿足的需求

#### 核心需求
1. ✅ **多租戶支援**: Admin → 商店 → 平台 → API 的完整層級管理
2. ✅ **持久化**: Session、Job、資料流狀態持久化
3. ✅ **多裝置同步**: 多裝置登入、狀態同步
4. ✅ **安全性**: Token 管理、權限驗證、資料隔離
5. ✅ **擴展性**: 快速整合新平台、新 API 類型
6. ✅ **效能**: 大量資料下的高效能狀態管理

#### 技術需求
1. ✅ **Redis**: Session、Job Queue、狀態快取、分散式鎖
2. ✅ **後端狀態管理**: 多租戶隔離、安全性、狀態一致性
3. ✅ **前端狀態管理**: UI 狀態、使用者互動、即時更新
4. ✅ **狀態同步機制**: 前後端狀態同步、多裝置同步

---

## 🎯 Sprint 目標與關鍵決策

### 核心目標

建立可靠的狀態管理架構，確保：
1. ✅ **Handle/Token 一致性**（當前需求）
2. ✅ **跨頁面狀態共享**（當前需求）
3. ✅ **多租戶支援**（Roadmap 需求）
4. ✅ **持久化機制**（Roadmap 需求：Session、Job、資料流）
5. ✅ **多裝置同步**（Roadmap 需求）
6. ✅ **安全性**（Roadmap 需求：Token 管理、權限驗證）
7. ✅ **可擴展性**（Roadmap 需求：快速整合新平台）
8. ✅ **可維護性**（清晰的架構設計）

### 關鍵決策點（基於 Roadmap 重新評估）

#### 1. **Redis 使用（已確定為必要）**
- ✅ **Redis 已開好備用**
- ✅ **Roadmap 明確需求**：
  - Session 管理（多裝置登入）
  - Job Queue（資料流執行）
  - 狀態快取（平台配置、Token 快取）
  - 分散式鎖（多裝置操作、Job 執行鎖定）
- **決策**: Redis 是必要基礎設施，不是可選項

#### 2. **後端狀態管理（已確定為必要）**
- ✅ **Roadmap 明確需求**：
  - 多租戶隔離（必須在後端驗證權限與資料隔離）
  - 安全性（Token 管理必須在後端，不能暴露到前端）
  - 狀態一致性（多裝置同步需要後端協調）
  - Job 管理（必須在後端執行與管理）
- **決策**: 後端必須參與狀態管理，不是可選項

#### 3. **前端狀態管理技術選型**
- **需要重新評估**：
  - Context API：可能不夠用（複雜度、效能問題）
  - Zustand：輕量級，適合 UI 狀態，但需要配合後端
  - Redux：需要重新考慮（雖然複雜，但適合大型系統）
- **決策**: 需要根據 Roadmap 需求選擇合適的前端狀態管理方案

#### 4. **狀態管理架構層級**
- ✅ **必須採用混合架構**：
  - **前端層級**: UI 狀態、使用者互動、即時更新
  - **後端層級**: 多租戶隔離、安全性、狀態一致性、Job 管理
  - **Redis 層級**: Session、Job Queue、狀態快取、分散式鎖
  - **資料庫層級**: 持久化配置、歷史記錄
- **決策**: 必須採用多層級混合架構

---

## 📊 前置條件

### 依賴的 Sprint 2 功能

- ✅ Admin API 測試功能已完成
- ✅ 方案 B（最小改動）已實作並測試通過
- ✅ Handle/Token 問題已暫時解決

### 現有資源

- ✅ Redis 已開好備用
- ✅ 前後端分離架構（Vercel + Render）
- ✅ 現有狀態管理：分散在各頁面的 `useState`

---

## 🔄 關鍵流程

### Phase 1: 架構分析與方案提案

1. **需求分析**
   - 當前狀態管理現況
   - 未來擴展需求預估
   - 技術約束條件

2. **方案設計**
   - 方案 A：純前端 Context API
   - 方案 B：前端 + 後端 Session
   - 方案 C：前端 + Redis 快取
   - 方案 D：混合方案（前端 Context + 後端 Redis）

3. **方案比較**
   - 優缺點分析
   - 實作複雜度
   - 維護成本
   - 擴展性評估

### Phase 2: 決策與定案

1. **方案討論**
   - 與用戶討論各方案
   - 回答技術問題
   - 考量實際需求

2. **決策定案**
   - 確定最終方案
   - 記錄決策理由
   - 更新架構文件

### Phase 3: 架構設計（定案後）

1. **詳細設計**
   - 架構圖
   - 資料流設計
   - API 設計
   - 狀態管理設計

2. **Review**
   - 用戶 Review 設計文件
   - 確認無誤後才進實作

### Phase 4: 實作（Review 後）

1. **實作階段**
   - 根據設計文件實作
   - 逐步遷移現有功能
   - 確保不影響現有功能

2. **測試與驗證**
   - 單元測試
   - 整合測試
   - 正式環境測試

---

## 📝 方案提案（待討論）

> 📋 **Agent-Based 開發視角**: 本文件從傳統開發視角評估方案，如需從 Agent-Based 開發視角（文件維護性、Agent 協作、重構成本）評估，請參考 [狀態管理策略：Agent-Based 開發視角](../STATE_MANAGEMENT_AGENT_STRATEGY.md)

### 技術選型分析

#### 前端狀態管理技術評估

**1. Context API (React 內建)**
- ✅ **納入考慮** - 適合簡單的全域狀態共享
- **優點**:
  - React 內建，無需額外依賴
  - 實作簡單，學習成本低
  - 適合中小型應用
- **缺點**:
  - 效能問題（所有消費者都會 re-render）
  - 沒有內建的選擇性訂閱機制
  - 複雜狀態管理需要手動優化（useMemo, useCallback）
- **適用場景**: 簡單的全域狀態（如 selectedHandle、UI 狀態）

**2. Redux**
- ⚠️ **重新評估** - 基於 Roadmap，需要重新考慮
- **Roadmap 帶來的變化**:
  - ✅ **狀態複雜度急劇增加**: 多租戶（Admin × 商店 × 平台 × API 類型）
  - ✅ **大型系統需求**: 多平台、多資料流、Job 管理、Flow Editor
  - ✅ **狀態同步需求**: 多裝置同步、前後端狀態同步
  - ✅ **Middleware 需求**: 可能需要 Redux Middleware 處理複雜邏輯
- **優點**（針對 Roadmap）:
  - 成熟穩定，適合大型複雜應用
  - 強大的 Middleware 生態（Redux Thunk、Redux Saga）
  - 時間旅行、狀態快照等開發工具
  - 可預測的狀態更新流程
  - 適合複雜的狀態同步場景
- **缺點**:
  - 學習成本高
  - 樣板代碼多（但可用 Redux Toolkit 簡化）
  - 實作成本高
- **適用場景**: 大型複雜應用，需要複雜的狀態同步、時光旅行、middleware
- **決策建議**: 需要與 Zustand 比較，評估是否值得引入 Redux

**3. Zustand**
- ✅ **納入考慮** - 輕量級，適合我們的場景
- **優點**:
  - 輕量級（~1KB），學習成本低
  - 無樣板代碼，API 簡潔
  - 效能好（選擇性訂閱）
  - 支援 TypeScript，型別安全
  - 可以與 SWR 共存（SWR 處理資料獲取，Zustand 處理 UI 狀態）
- **缺點**:
  - 需要額外依賴（但很小）
  - 社群較 Redux 小（但足夠成熟）
- **適用場景**: 需要輕量級全域狀態管理，配合 SWR 使用

**4. React Query (TanStack Query)**
- ⚠️ **部分納入考慮** - 但專案已使用 SWR
- **原因**:
  - **功能重疊**: 專案已使用 SWR，兩者功能高度重疊（資料獲取、快取、同步）
  - **不適合當前需求**: React Query 主要解決資料獲取問題，不是狀態管理問題
  - **遷移成本**: 如果要引入，需要替換現有的 SWR，成本高且不必要
  - **建議**: 繼續使用 SWR，專注於解決狀態管理問題（handle/token 一致性）
- **適用場景**: 如果專案還沒選擇資料獲取庫，React Query 是很好的選擇

**5. SWR (現有)**
- ✅ **保持使用** - 已在使用，效果良好
- **說明**:
  - 專案已使用 SWR 處理資料獲取和快取（`useStores`, `useWebhookEvents`）
  - SWR 負責：資料獲取、快取、同步、重新驗證
  - 不需要替換，只需要補充狀態管理方案

---

### 方案提案（基於 Roadmap 重新設計）

#### 方案 A: Zustand + 後端 Session + Redis（推薦）

**架構**:
- **前端層級**:
  - Zustand 統一管理 UI 狀態（selectedStore, selectedPlatform, selectedAPI）
  - SWR 處理資料獲取（stores, events, webhooks）
  - 操作鎖定機制在 Zustand 層級實現
- **後端層級**:
  - Session 管理（多租戶隔離、權限驗證）
  - Token 管理（安全性、後端驗證）
  - 狀態一致性驗證
- **Redis 層級**:
  - Session 快取（多裝置登入）
  - Token 快取（加速查詢）
  - 分散式鎖（多裝置操作、Job 執行鎖定）

**優點**:
- ✅ 輕量級前端狀態管理（Zustand）
- ✅ 效能好（選擇性訂閱）
- ✅ 與現有 SWR 完美配合
- ✅ 後端參與狀態管理（多租戶、安全性）
- ✅ Redis 支援（Session、快取、分散式鎖）
- ✅ TypeScript 支援良好
- ✅ **符合 Roadmap 需求**: 多租戶、多裝置、持久化、安全性

**缺點**:
- 需要後端改動（Session 管理）
- 需要 Redis 維護
- 實作複雜度較高

**實作複雜度**: ⭐⭐⭐ (中)

**Roadmap 適用性**: ✅✅✅✅✅ (極高)
- ✅ 多租戶支援
- ✅ 多裝置登入
- ✅ 持久化機制
- ✅ 安全性
- ✅ 擴展性

---

#### 方案 B: Redux + 後端 Session + Redis

**架構**:
- **前端層級**:
  - Redux (Redux Toolkit) 統一管理所有狀態
  - SWR 處理資料獲取（可整合到 Redux）
  - Redux Middleware 處理複雜邏輯
- **後端層級**:
  - Session 管理（多租戶隔離、權限驗證）
  - Token 管理（安全性、後端驗證）
  - 狀態一致性驗證
- **Redis 層級**:
  - Session 快取（多裝置登入）
  - Token 快取（加速查詢）
  - 分散式鎖（多裝置操作、Job 執行鎖定）
  - Job Queue（資料流執行）

**優點**:
- ✅ 成熟穩定，適合大型複雜應用
- ✅ 強大的 Middleware 生態
- ✅ 時間旅行、狀態快照等開發工具
- ✅ 可預測的狀態更新流程
- ✅ 適合複雜的狀態同步場景
- ✅ 後端參與狀態管理（多租戶、安全性）
- ✅ Redis 支援（Session、快取、分散式鎖、Job Queue）
- ✅ **符合 Roadmap 需求**: 大型系統、複雜狀態同步

**缺點**:
- 學習成本高
- 樣板代碼多（Redux Toolkit 可簡化）
- 實作成本高
- 維護成本高

**實作複雜度**: ⭐⭐⭐⭐ (中高)

**Roadmap 適用性**: ✅✅✅✅✅ (極高)
- ✅ 多租戶支援
- ✅ 多裝置登入
- ✅ 持久化機制
- ✅ 安全性
- ✅ 擴展性
- ✅ 複雜狀態同步（Job、資料流、Flow Editor）

---

#### 方案 C: Context API + 後端 Session + Redis

**架構**:
- **前端層級**:
  - React Context 統一管理狀態
  - SWR 處理資料獲取
  - 需要手動優化（useMemo, useCallback）
- **後端層級**:
  - Session 管理（多租戶隔離、權限驗證）
  - Token 管理（安全性、後端驗證）
  - 狀態一致性驗證
- **Redis 層級**:
  - Session 快取（多裝置登入）
  - Token 快取（加速查詢）
  - 分散式鎖（多裝置操作、Job 執行鎖定）

**優點**:
- ✅ React 內建，無需額外依賴
- ✅ 實作簡單
- ✅ 後端參與狀態管理（多租戶、安全性）
- ✅ Redis 支援（Session、快取、分散式鎖）

**缺點**:
- 效能問題（需要手動優化）
- 複雜度較高時難以維護（Roadmap 會讓複雜度急劇增加）
- 沒有內建的選擇性訂閱機制
- **不符合 Roadmap 需求**: 狀態複雜度會超出 Context API 的適用範圍

**實作複雜度**: ⭐⭐⭐ (中)

**Roadmap 適用性**: ⚠️⚠️ (低)
- ⚠️ 多租戶支援（效能問題）
- ⚠️ 複雜狀態同步（難以維護）
- ⚠️ Flow Editor（狀態複雜度高）

---

#### 方案 B: Context API + SWR

**架構**:
- 前端使用 React Context 統一管理 `selectedHandle`
- 操作鎖定機制在 Context 層級實現
- 繼續使用 SWR 處理資料獲取
- 後端不參與狀態管理

**優點**:
- ✅ React 內建，無需額外依賴
- ✅ 實作簡單
- ✅ 不需要後端改動
- ✅ 不需要 Redis

**缺點**:
- 效能問題（需要手動優化）
- 複雜度較高時難以維護
- 刷新頁面狀態會丟失

**實作複雜度**: ⭐⭐ (中低)

---

#### 方案 C: Zustand + 後端 Session

**架構**:
- 前端 Zustand 管理 UI 狀態
- 後端 Session 管理 handle/token 對應關係
- 每次 API 調用從 Session 讀取 token
- SWR 處理資料獲取

**優點**:
- ✅ 狀態持久化（Session）
- ✅ 後端可以驗證 handle/token 一致性
- ✅ 不需要 Redis
- ✅ 效能好（Zustand）

**缺點**:
- 需要後端 Session 管理
- 實作複雜度較高

**實作複雜度**: ⭐⭐⭐ (中)

---

#### 方案 D: Zustand + 後端 Session + Redis（分階段實作）

**架構**:
- **Phase 1（當前 Sprint）**:
  - 前端 Zustand 統一管理 UI 狀態
  - 後端 Session 管理 handle/token（最小改動）
  - Redis 快取 Token（加速）
  - SWR 處理資料獲取
- **Phase 2（後續 Sprint）**:
  - 擴展到多租戶支援
  - 加入多裝置登入
  - 加入 Job Queue
- **Phase 3（後續 Sprint）**:
  - 加入資料流狀態管理
  - 加入 Flow Editor 狀態管理

**優點**:
- ✅ 分階段實作，降低風險
- ✅ 符合 Roadmap 的迭代需求
- ✅ 輕量級開始，逐步擴展
- ✅ 後端參與狀態管理（多租戶、安全性）
- ✅ Redis 支援（Session、快取、分散式鎖、Job Queue）

**缺點**:
- 需要多次重構
- 可能面臨技術債務

**實作複雜度**: ⭐⭐⭐ (中，分階段)

**Roadmap 適用性**: ✅✅✅✅ (高，分階段)

---

### 技術選型總結（基於 Roadmap 重新評估）

| 技術 | 納入考慮？ | 原因（基於 Roadmap） |
|------|-----------|---------------------|
| **Context API** | ⚠️ 不建議 | Roadmap 狀態複雜度會超出適用範圍，效能問題 |
| **Redux** | ✅ 是 | 需要重新考慮，Roadmap 顯示會是大型複雜系統 |
| **Zustand** | ✅ 是 | 輕量級，效能好，適合 UI 狀態，需要配合後端 |
| **React Query** | ⚠️ 部分 | 功能與 SWR 重疊，不適合當前需求 |
| **SWR** | ✅ 保持 | 已在使用，效果良好，繼續使用 |
| **後端 Session** | ✅ 必要 | Roadmap 明確需求：多租戶、安全性、狀態一致性 |
| **Redis** | ✅ 必要 | Roadmap 明確需求：Session、Job Queue、快取、分散式鎖 |

### 方案比較總結（基於 Roadmap）

| 方案 | Roadmap 適用性 | 實作複雜度 | 維護成本 | 擴展性 | 推薦度 |
|------|--------------|-----------|---------|--------|--------|
| **A: Zustand + 後端 + Redis** | ✅✅✅✅✅ | ⭐⭐⭐ | 中 | 高 | ⭐⭐⭐⭐⭐ |
| **B: Redux + 後端 + Redis** | ✅✅✅✅✅ | ⭐⭐⭐⭐ | 高 | 極高 | ⭐⭐⭐⭐ |
| **C: Context + 後端 + Redis** | ⚠️⚠️ | ⭐⭐⭐ | 中高 | 中 | ⭐⭐ |
| **D: Zustand + 後端 + Redis（分階段）** | ✅✅✅✅ | ⭐⭐⭐ | 中 | 高 | ⭐⭐⭐⭐⭐ |

### 推薦方案（基於 Agent-Based 開發視角）

> 📋 **Agent-Based 評估**: 詳細的 Agent-Based 開發視角評估請參考 [狀態管理策略：Agent-Based 開發視角](../STATE_MANAGEMENT_AGENT_STRATEGY.md)

**推薦方案**: **Zustand 漸進式 → Redux** ⭐⭐⭐⭐⭐

**推薦理由**（Agent-Based 視角）:
1. ✅ **符合敏捷迭代**: 從簡單開始，逐步擴展（Zustand → Redux）
2. ✅ **文件維護性高**: Zustand 語法簡單，文件容易寫清楚
3. ✅ **Agent 協作友好**: 單一 Store 文件，上下文集中，容易理解
4. ✅ **重構成本低**: Zustand → Redux 有清晰遷移路徑，可以分模組遷移
5. ✅ **技術債務可追蹤**: 每個階段的決策都有記錄，方便未來重構
6. ✅ **符合 Roadmap 需求**: 多租戶、多裝置、持久化、安全性、擴展性

**重構點規劃**:
1. **重構點 1: Sprint 3**（當前）
   - 採用 Zustand + 後端 Session + Redis
   - 建立清晰的文件結構
2. **重構點 2: Phase 3 開始前**（資料流系統）
   - 評估複雜度，決定是否遷移到 Redux
   - 記錄決策理由
3. **重構點 3: Phase 4**（Flow Editor）
   - 如果還沒遷移，Phase 4 必須遷移到 Redux
   - Flow Editor 需要複雜的狀態管理

**替代方案**: **Redux 從頭開始**（不推薦，初期過度設計，不符合敏捷迭代原則）

**不推薦**: **Context API**（Roadmap 狀態複雜度會超出適用範圍，且 Agent 協作成本高）

---

## ✅ 決策記錄

### 最終決策（已完成）

#### 1. **前端狀態管理技術選型** ✅
- **決策**: Zustand（階段 1）
- **理由**: 
  - 符合當前需求，學習成本低
  - Agent-Based 開發視角評估：文件維護性高、協作友好、重構成本低
  - 階段 1 可以維持到完成 SL get product -> NE update product 關鍵 milestone
- **未來**: Phase 3.2 Job 管理系統開始前評估是否遷移到 Redux

#### 2. **實作策略** ✅
- **決策**: 方案 A（Zustand + 後端 Session + Redis）
- **理由**: 
  - 符合敏捷迭代原則
  - 階段 1 可以維持到完成關鍵 milestone
  - 為多租戶、多平台、資料流等功能做好準備

#### 3. **Redis 使用範圍** ✅
- **階段 1 範圍**: Token 快取（加速查詢）
- **未來擴展**: Session、Job Queue、分散式鎖（Phase 3.2 開始）

#### 4. **後端狀態管理範圍** ✅
- **階段 1 範圍**: Session 管理（handle/token 對應關係）
- **未來擴展**: 多租戶隔離、權限驗證、Job 管理（後續 Sprint）

#### 5. **狀態同步機制** ⏸️
- **階段 1**: 不需要複雜的狀態同步（前端 Zustand + 後端 Session）
- **未來**: Phase 3.2 Job 管理系統時再評估（WebSocket/SSE）

### 決策依據

- [狀態管理策略：Agent-Based 開發視角](../STATE_MANAGEMENT_AGENT_STRATEGY.md)
- [專案 Roadmap](../PROJECT_ROADMAP.md)

---

## 📋 交付成果

### ✅ Phase 1-2: 架構分析與決策（已完成）

- ✅ 架構分析文件
- ✅ 方案提案文件（含優缺點比較）
- ✅ 決策記錄（選擇的方案及理由）
- ✅ Agent-Based 開發視角評估文件

### 🚀 Phase 3: 實作階段（進行中）

#### 前端實作
- [ ] 安裝 Zustand
- [ ] 建立 Zustand Store（selectedStore, selectedPlatform, selectedAPI, lockedHandle）
- [ ] 遷移現有頁面到 Zustand Store
  - [ ] admin-api-test.tsx
  - [ ] webhook-test.tsx
  - [ ] index.tsx
- [ ] 移除現有的 `useState` 和 `lockHandle` 機制
- [ ] 更新相關 Hooks 使用 Zustand Store

#### 後端實作
- [ ] 實作 Session 管理（handle/token 對應關係）
- [ ] 整合 Redis 快取（Token 快取）
- [ ] 更新 API Routes 使用 Session 驗證
- [ ] 確保所有 API 調用從 Session 讀取 token

#### 文件與測試
- [ ] 更新文件結構（docs/state-management/）
- [ ] 建立 Store 使用說明文件
- [ ] 測試所有既有功能
- [ ] 驗證 Handle/Token 一致性

### Phase 4: 驗證與部署（待開始）

- [ ] 本地測試所有功能
- [ ] 正式環境測試
- [ ] 驗證不會再發生 state 不一致造成的 issue
- [ ] 更新部署文件

---

## 🎯 成功標準

### ✅ 決策階段（已完成）

- ✅ 方案提案完整
- ✅ 用戶參與決策
- ✅ 決策記錄清晰（已記錄在 STATE_MANAGEMENT_AGENT_STRATEGY.md）

### 🚀 實作階段（進行中）

#### 功能驗證
- [ ] ✅ 所有既有功能正常運作
  - [ ] 商店列表顯示正常
  - [ ] Admin API 測試功能正常
  - [ ] Webhook 管理功能正常
  - [ ] 所有 API 調用正常

#### 狀態一致性驗證
- [ ] ✅ Handle/Token 一致性保證
  - [ ] 跨頁面狀態共享正常
  - [ ] 多步驟操作不會出現 handle/token 不一致
  - [ ] 切換商店時狀態正確更新

#### 架構驗證
- [ ] ✅ Zustand Store 結構清晰
- [ ] ✅ 後端 Session 管理正常
- [ ] ✅ Redis 快取正常運作
- [ ] ✅ 文件完整且清晰

#### 穩定性驗證
- [ ] ✅ 不會再發生 state 不一致造成的 issue
- [ ] ✅ 所有功能穩定運作
- [ ] ✅ 正式環境測試通過

### 📋 階段 1 適用範圍確認

✅ **階段 1 將維持到**:
- Phase 1 完成（多租戶 + 多平台）
- Phase 2 完成（多平台整合）
- Phase 3.1 簡單資料流（SL get product -> NE update product）✅ **關鍵 milestone**
- Phase 3.2 Job 管理系統開始前（需要重新評估）

---

## 📚 相關文件

- [專案 Roadmap](../PROJECT_ROADMAP.md) - 專案長期發展規劃（技術決策重要依據）
- [狀態管理策略：Agent-Based 開發視角](../STATE_MANAGEMENT_AGENT_STRATEGY.md) - **Agent-Based 開發視角的狀態管理策略** ⭐
- [Handle/Token 狀態管理架構分析](../ARCHITECTURE_HANDLE_TOKEN_MANAGEMENT.md) - 問題分析與方案 B 實作記錄
- [系統架構](../ARCHITECTURE.md) - 整體系統架構
- [專案結構與部署架構](../PROJECT_STRUCTURE.md) - 部署架構說明

---

**Sprint 狀態**: 🚀 進行中（實作階段）  
**建立日期**: 2025-11-04  
**最後更新**: 2025-11-04  
**最終決策**: ✅ 採用方案 A（Zustand 漸進式 → Redux）階段 1

---

## 📌 重要說明

### Roadmap 對決策的關鍵影響

本文件已根據提供的 **Roadmap** 重新評估所有狀態管理方案。關鍵變化：

1. ✅ **Redis 從「可選」變成「必要」**
   - Roadmap 明確需求：Session、Job Queue、狀態快取、分散式鎖

2. ✅ **後端狀態管理從「可選」變成「必要」**
   - Roadmap 明確需求：多租戶隔離、安全性、狀態一致性、Job 管理

3. ✅ **前端狀態管理技術需要重新評估**
   - Context API：可能不夠用（Roadmap 狀態複雜度會超出適用範圍）
   - Redux：需要重新考慮（Roadmap 顯示會是大型複雜系統）
   - Zustand：仍然適合，但需要配合後端

4. ✅ **必須採用混合架構**
   - 前端層級：UI 狀態、使用者互動、即時更新
   - 後端層級：多租戶隔離、安全性、狀態一致性、Job 管理
   - Redis 層級：Session、Job Queue、狀態快取、分散式鎖
   - 資料庫層級：持久化配置、歷史記錄

### 推薦決策

**推薦方案**: **方案 A: Zustand + 後端 Session + Redis**

**原因**:
- ✅ 符合 Roadmap 需求（多租戶、多裝置、持久化、安全性、擴展性）
- ✅ 實作複雜度適中
- ✅ 維護成本合理
- ✅ 擴展性好（可以逐步擴展到 Job Queue、資料流、Flow Editor）

**替代方案**: **方案 B: Redux + 後端 Session + Redis**（如果預期狀態複雜度極高）

