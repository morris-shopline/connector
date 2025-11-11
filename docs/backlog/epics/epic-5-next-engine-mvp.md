# Epic 5: Next Engine 多平台 MVP（Phase 1.3）

**狀態**: ⏳ planned（等待 Epic 4 完成後進入 Story 建立）  
**對應 Roadmap**: Phase 1.3 - 多平台 MVP（Next Engine PoC）  
**開始日期**: -

---

## Epic 描述

在 Phase 1.2 完成 Connection baseline 後，本 Epic 目標是把 Next Engine 作為第二個平台導入系統，驗證多平台架構可支援 OAuth、資料讀取與錯誤處理。主要聚焦於：

- 實作 Next Engine OAuth Flow（Authorize / Callback / Token Refresh）
- 把 Next Engine 納入既有 Connection / Connection Item 模型與前端 Connection 選取流程
- 補齊多平台狀態同步、錯誤碼映射與重新授權 UX（延伸 Epic 4 的工作流）
- 建立最小資料讀取入口（店鋪 / 訂單等）確保跨平台 API 可用

> ⚠️ Phase 2（多平台架構補齊）才會擴充完整的跨平台治理、動態路由重構與多平台指標洞察，本 Epic 先聚焦 PoC 所需的最小面。

---

## 現況摘要
- ✅ Roadmap Phase 1.2 需求已在 Epic 4 中定義（待完成）
- ✅ Connection 資料模型、狀態同步、Token Lifecycle 決策已落地（Refactor 3）
- ⏳ Next Engine OAuth / API 還未接觸，需要收集官方文件與測試帳號
- 📝 背景資訊：
  - `docs/memory/roadmap.md` Phase 1.3 說明
  - `docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`

---

## 前置條件
- ✅ Epic 4 完成並驗證多 Connection 在 Shopline 單平台的運作
- ✅ Refactor 3 R3.0 / R3.1 / R3.2 於正式環境穩定運作
- ✅ 平台設定（`platform_apps`）具備 Next Engine clientId / clientSecret 管理能力
- ⏳ 取得 Next Engine sandbox 帳號與 OAuth 憑證

---

## 核心目標（Phase 1.3 MVP）
- 管理介面可新增、查看 Next Engine Connection 與其 Connection Items
- 完成 Next Engine OAuth Flow 與 Token Refresh，納入統一錯誤碼處理與重新授權 UX
- 前端 Connection 選取流程支援 Shopline + Next Engine 並行，維持單一 Source of Truth 策略
- 至少完成一組 Next Engine API 讀取流程（店鋪或訂單）驗證資料隔離與錯誤處理

---

## Stories

### ⏳ Story 5.1: Next Engine OAuth Flow 與 Platform Adapter
- **描述**: 建立 Next Engine OAuth Flow，包含 Authorize、Callback、Token Refresh 與錯誤碼映射
- **範圍 / 要點**:
  - 建立 Next Engine Platform Adapter，整合於 `PlatformServiceFactory`
  - 實作 `/api/auth/next-engine/install`、`/api/auth/next-engine/callback`、Token Exchange / Refresh
  - 錯誤碼標準化：對應 R3.2 的 `TOKEN_*`、Session 錯誤；加入必要的 Next Engine 特殊情境
  - 測試：含 sandbox 授權流程、簽名驗證、錯誤流程 UAT

### ⏳ Story 5.2: Next Engine Connection Item 與資料讀取 MVP
- **描述**: 將 Next Engine 資料結構納入 Connection / Connection Item 模型，完成最小資料讀取
- **範圍 / 要點**:
  - 定義 Next Engine Connection Item 欄位與 metadata 映射（如 shopId, companyId）
  - 實作至少一個資料讀取 API（例如店鋪列表或訂單列表），前端顯示基礎資訊
  - 驗證多平台資料隔離與權限控制（沿用 Story 4.3 測試策略）
  - 補齊 Prisma schema / Migration，更新測試 fixtures

### ⏳ Story 5.3: 前端 Connection UX 延伸與重新授權整合
- **描述**: 把 Next Engine 納入前端 Connection 選取 / 重新授權流程，確保多平台狀態切換順暢
- **範圍 / 要點**:
  - 擴充 Connection Dashboard，顯示平台徽章、授權狀態與平台特定操作（重新授權 / 重新整理）
  - 驗證 useConnection store 與 URL 初始化策略在多平台情境下運作正常（依 `connection-state-sync` 決策）
  - 重新授權 UX：共用提示但允許平台差異化文案，測試包含 Token 過期 / revoke
  - 文件：更新操作手冊與測試指引，納入 sandbox 使用流程

---

## 移轉至 Phase 2 的項目
- 多平台共用抽象（Platform Capability Flags、Topic Mapping、Payload Normalizer）
- 動態路由重構與 URL 分享上下文（Refactor Story R3.3）
- 多平台健康檢查與 Insight 指標
- 多裝置登入與跨平台同步策略（Roadmap Phase 2.2 之後）

---

## 相關決策 / 文件
- Roadmap：`docs/memory/roadmap.md`（Phase 1.3）
- Connection 資料模型：`docs/memory/decisions/connection-data-model.md`
- Connection 狀態同步：`docs/memory/decisions/connection-state-sync.md`
- Token Lifecycle：`docs/memory/decisions/token-lifecycle-handling.md`
- 多平台架構 backlog：`docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`
- 平台設定：`docs/backlog/refactors/refactor-3-connection-foundation.md`

---

**最後更新**: 2025-11-11
