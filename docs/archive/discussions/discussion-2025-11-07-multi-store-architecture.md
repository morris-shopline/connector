# Connection 基礎架構討論（2025-11-07）

## 背景
- Phase 1.1（Epic 3）已完成登入 + 單商店授權串接
- Phase 1.2（Epic 4）準備啟動，短期目標：建立「可支援多 Connection 的最小可行架構」，並緊接著導入第二個平台（Next Engine）
- 目前手動測試下，單一帳號建立多個 Shopline Connection 可成功，但仍存在權限、狀態與 token 處理缺口

## 本次討論目的（針對近期 Run）
1. 對齊「最小可行的多 Connection / 多平台 baseline」：確定 schema 命名、平台識別欄位、共用查詢模式
2. 決定需在下一個 Run 完成的 Issue 修復與實作重點（URL/Zustand、Token 過期）
3. 規劃 Run 順序：
   - Run A：基礎模型 + 狀態管理修整（仍以 Shopline 為主要平台）
   - Run B：Next Engine PoC，使用 Run A 的共用架構上線

> ⚠️ 大型、長期的權限治理與多平台統一架構議題已移至：
> `docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`

## 討論議程
1. **資料 & Domain 最小調整**
   - Schema 抽象：`platform`、`connectionId`、`externalAccountId`、`externalStoreId` 等欄位命名
   - 現有資料遷移方式與 fallback（Shopline-only → 多平台 / 多 Connection）
   - 服務層/Repository 需要的 interface or factory 調整

2. **狀態同步 & Issue 收斂**
   - Router 事件驅動的 Connection selection（對應 Issue 2025-11-06-001）
   - Refactor 1 未完成的 Connection 狀態任務怎麼納入 Run A

3. **Token Lifecycle 最小處理**
   - 錯誤碼分類：Session vs Token 過期（Issue 2025-11-07-001）
   - 前端重新授權 UX：toast / modal、保留登入狀態

4. **Run 排程與產出**
   - Run A 的 Story 列表：Story 4.1、4.2、4.5（最小版）
   - Run B 的 Story：Next Engine OAuth + API PoC（新 Story 草稿）
   - 決定需要新增的測試腳本、fixtures

## 預期產出
- `docs/memory/decisions/`：新增「多商店最小資料模型」、「平台識別策略」、「Token 過期與重新授權處理」三份決策紀錄
- `docs/memory/architecture/`：補充多平台基礎圖（以 Shopline + Next Engine 為例）
- 更新 Epic 4 Story 的前置條件與 acceptance criteria（同步在 Story 4.1/4.2/4.5 上）
- 確認 Run A/RUN B 的初步任務清單後，同步給 Run Owner 規劃

## 參考資料
- `docs/backlog/epics/epic-4-multi-store-management.md`
- `docs/backlog/issues/issue-2025-11-06-001.md`
- `docs/backlog/issues/issue-2025-11-07-001.md`
- `docs/archive/inbox/processed/note-2025-11-06-001.md`
- `docs/archive/inbox/processed/note-2025-11-06-002.md`
- `docs/archive/inbox/processed/note-2025-11-07-001.md`
- `docs/memory/decisions/state-management.md`

