# 多平台／多商店長期架構討論 Backlog（2025-11-07 建立）

> 目的：收納在導入 Next Engine 之後，需要展開的完整多平台／多商店／多帳戶架構議題，避免在近期 Run 的精簡決策中遺漏。

## 整體背景
- 目前正式環境僅串接 Shopline，一個使用者可授權多個 Shopline 商店
- 下一階段將導入 Next Engine 作為第二個平台
- 長期願景：單一 Admin 帳號可管理多平台、多商店，並支援角色權限、跨平台資料流

## 待討論主題一覽
1. **平台抽象與跨平台資料模型**
   - 是否建立 `PlatformAccount` / `Integration` 抽象層（多平台共用欄位 vs 平台自定欄位）
   - 多平台商店 ID 命名策略（`externalId` vs platform-specific columns）
   - 跨平台資料聚合需求（例如：統一報表、指標）

2. **角色與權限體系**
   - 定義角色類型（Owner / Admin / Operator）與可操作範圍
   - 平台、商店、功能權限的繼承與覆寫策略
   - API scope 與 UI 權限對應關係

3. **Token Lifecycle & 安全治理**
   - 不同平台的 refresh token / webhook secret / API key 管理方式
   - Token 撤銷、輪替、失敗重試與審計紀錄
   - Multi-tenant secret 管理（加密、key rotation）

4. **狀態同步與使用者體驗**
   - 多平台、多商店切換時的狀態一致性（URL、全域 store、component state）
   - 跨平台操作流程設計（例：一次查看所有平台的 webhook 事件）
   - 多平台錯誤訊息統一化與本地化

5. **資料遷移與版本管理**
   - 從 Shopline-only schema 過渡到多平台的 migration 計畫
   - 歷史資料備份與 rollback 策略
   - 資料稽核（Audit Log）與自動化驗證

6. **營運／冷啟動應對**
   - Render 冷啟動策略（對應 `note-2025-11-06-001`）
   - 多平台心跳檢查、健康狀態監控設計
   - 失敗通知與客戶提示流程

7. **測試策略與工具鏈**
   - 多平台整合測試矩陣、fixtures、模擬環境
   - 自動化測試覆蓋（E2E、合約測試、mock servers）
   - Data seeding / sandbox 同步機制

## 相關資料來源
- `docs/backlog/epics/epic-4-multi-store-management.md`
- `docs/backlog/epics/epic-5-multi-api-types.md`
- `docs/archive/inbox/processed/note-2025-11-06-001.md`
- `docs/archive/inbox/processed/note-2025-11-06-002.md`
- `docs/archive/inbox/processed/note-2025-11-07-001.md`
- `docs/backlog/issues/issue-2025-11-06-001.md`
- `docs/backlog/issues/issue-2025-11-07-001.md`
- `docs/memory/architecture/current.md`
- `docs/memory/decisions/state-management.md`

## 下一步（待排程）
- 待 Next Engine PoC 完成並穩定後，安排專場工作坊審視上述議題
- 會議產出預期：完整架構藍圖、分階段實作計畫、對應的 Epic / Story / Refactor 更新


