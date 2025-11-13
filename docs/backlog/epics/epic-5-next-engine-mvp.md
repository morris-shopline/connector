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

| Story | 狀態 | 說明 |
|-------|------|------|
| [Story 5.1: Next Engine OAuth Flow 與 Platform Adapter](../stories/story-5-1-next-engine-oauth.md) | ✅ completed | 建立 Next Engine Adapter、授權 / refresh API、錯誤碼映射 |
| [Story 5.2: Next Engine Connection Item 與資料讀取 MVP](../stories/story-5-2-next-engine-connection-data.md) | ✅ completed | 將公司 / 店舖寫入 Connection 模型並提供資料讀取 API |
| [Story 5.3: 前端 Connection UX 延伸與重新授權整合](../stories/story-5-3-next-engine-ux.md) | ✅ completed | 前端切換與重新授權體驗、平台文案與錯誤提示 |
| [Story 5.3.1: 多平台測試頁面整合](../stories/story-5-3-1-multi-platform-test-pages.md) | ✅ ready-for-user-test | 修正 Webhook、Event、API 測試頁面，支援多平台運作並實作 Next Engine API 測試 |
| [Story 5.4: Shopline Platform Adapter 重構](../stories/story-5-4-shopline-adapter-refactor.md) | ⏳ 待檢視 | 已完成 User Test，但需回頭檢視架構是否徹底移除雙軌痕跡 |
| [Story 5.5: Next Engine 庫存與倉庫 API 補強](../stories/story-5-5-next-engine-inventory-apis.md) | ✅ completed | 已完成並通過地端 + 正式機測試 |
| [Story 5.6: Next Engine 訂單 API 補強](../stories/story-5-6-next-engine-order-apis.md) | ✅ completed | 查詢相關 API 已完成並通過 User Test |
| [Story 5.7: Next Engine 店舖建立改進與在庫連携接收端點](../stories/story-5-7-next-engine-shop-creation-and-stock-webhook.md) | ⚪ pending | 待 Story 5.6 完成後啟動 |
| [Story 5.8: Next Engine 建立訂單 API](../stories/story-5-8-next-engine-create-order.md) | ⚪ pending | 待 Story 5.7 完成後啟動，API 文件待用戶補充 |

---

## Story 相依性與建議開發順序

1. **Story 5.1 → Story 5.2 → Story 5.3 → Story 5.3.1**：
   - 5.1 提供 OAuth / Token 能力，為 5.2 的資料抓取與 5.3 的前端顯示基礎。
   - 5.2 提供後端 API / 資料模型，前端才能取得 Next Engine 的店舖 / 商品資料。
   - 5.3 依賴前兩項完成後再串接 UI 與 Activity Dock。
   - 5.3.1 修正測試頁面，讓它們能夠配合多平台運作，並實作 Next Engine API 測試功能。
2. **Story 5.4**：需待 5.1～5.3.1 開發完成、實機測試與 User Test 通過後再啟動，以確保架構穩定再進行 Shopline 重構。
3. **Story 5.5**：在上述流程穩定後（或同一 Run 內有餘裕時）再補齊庫存／倉庫 API，避免在架構未確認前實作過多端點。
4. **Story 5.6**：補強訂單查詢相關 API（查詢 base、查詢 rows、扣庫分析）。
5. **Story 5.7**：改進店舖建立 API 並實作在庫連携接收端點。
6. **Story 5.8**：實作建立訂單 API（需待用戶補充 API 文件後再進行詳細規劃）。
7. **共用決策與文件**：所有 Story 按需引用 `NEXT_ENGINE_PLATFORM_SPEC.md`，若在實作過程中新增欄位或錯誤碼，需同步更新並通知其他 Story。
8. **測試協作**：
   - 5.1 與 5.2 完成後，提供必要的測試腳本給 5.3 驗證。
   - 5.3.1 需要修正現有測試頁面的問題，確保多平台運作正常。
   - 人類夥伴僅於最終 UI 驗收（授權流程與資料瀏覽）進行操作。

---

## 暫緩議題（Phase 2 再檢視）
- Admin x Connection 綁定策略、Webhook 路由等議題請參考 `docs/backlog/inbox/note-2025-11-11-001-admin-connection-isolation.md`，目前標記為「暫緩至 Phase 2」。
- 多平台共用抽象與動態路由重構已收錄於 `discussion-2025-11-07-multi-platform-architecture-backlog.md`，Epic 5 不須處理。

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
- Next Engine 串接指南：`docs/reference/guides/NE-OVERVIEW.md`
- Next Engine 平台規格：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
- Next Engine API 參考：`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
- 🔧 **Next Engine 實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含 OAuth、API、在庫連携的端到端流程，可直接複製到其他專案使用）

---

**最後更新**: 2025-11-11
