# Story R3.0: Connection 資料模型與 Migration

**所屬 Refactor**: [Refactor 3: Connection 基礎重構（Phase 1.2 前置）](../refactors/refactor-3-connection-foundation.md)  
**狀態**: ✅ completed  
**完成日期**: 2025-11-10  
**User Test**: ✅ 通過（2025-11-10）  
**建立日期**: 2025-11-07  
**安排 Run**: run-2025-11-10-01（統一開發）  
**對應 Roadmap**: Phase 1.2 之前的基礎架構調整  
**相關決策**: 
- `docs/memory/decisions/connection-data-model.md`

---

## 前情提要

- 現有 `stores` 表以單一商店為核心，無法支援多平台 × 多帳戶的 Connection 模型。
- Epic 4 需要 Connection 架構才能規劃多平台管理 UI 與權限。
- 決策已確立新的資料模型（Connection / Connection Item / Platform App）。

---

## Story 描述

建立 Connection 資料模型與 Migration，具體包含：

1. Prisma schema 調整：新增 `integration_accounts`、`connection_items`、`platform_apps`（可選） 等模型。
2. 將現有 `stores` 資料遷移到新的結構（含向後相容的 view 或 API）。
3. 更新 Repository / Service，改以 Connection 為入口供後端 API 使用。
4. 提供 Data Access Helper：`findConnectionsByUser`、`findConnectionItems`、`upsertConnection` 等。

---

## 🚨 前置條件

- 確認資料庫備份策略可用（staging & production）
- 決策文件已審閱並確認（見上方連結）
- Story R1.1 已於 Phase A 完成並通過架構師 Final Review，前端 Query / Store 命名需與此 Story 保持一致

---

## 架構師協作

- **Kickoff Review（與 PM/DBA 共同執行）**
  - 確認資料表命名、欄位型別、索引策略與 Migration 拆分方案
  - 確認 `integration_accounts` 與 `connection_items` 與既有報表 / webhook log 的外鍵映射方式
  - Kickoff 結論記錄於 `docs/context/current-run.md`
- **Schema Checkpoint（Migration 草稿完成後）**
  - 邀請架構師針對 Prisma schema PR 進行早期審查（避免服務層重工）
  - 與 DBA 共同確認資料備份 / 回滾流程
- **Final Review（Run 收尾）**
  - 架構師確認：
    - `docs/memory/architecture/current.md` 的資料模型圖已同步更新
    - Migration 演練紀錄完整（含執行時間、風險備忘）
  - 在 Story 驗收區塊勾選並註記 reviewer

---

## 實作項目

1. **Schema 與 Migration**
   - 更新 `prisma/schema.prisma`
   - 撰寫 migration script（包含資料重寫與索引建立）。建議拆成「schema 定義」與「資料搬移」兩個 migration，並提供 dry-run 模式。
   - 演練：本機 / staging 先跑 migration，再記錄時間與注意事項（含 rollback 指令）

2. **資料遷移腳本**
   - 將 `stores` 每筆資料轉換為：
     - `integration_accounts`：`platform=shopline`, `externalAccountId=handle`, `authPayload` 帶 accessToken 等
     - `connection_items`：對應原 `stores`
   - 確保 webhook 事件、Log 等外鍵同步更新

3. **Service 層調整**
   - 建立 `connectionRepository`
   - 更新 `ShoplineService` → `ShoplineAdapter`（或 equivalent）以符合新的資料介面
   - 預留 `PlatformServiceFactory` 介面

4. **API 更新**
   - `/api/connections` 新增/調整
   - `/api/stores` 與相關端點遷移到新的資料來源（保留相容性）

5. **測試**
   - 單元測試：Repository、Service
   - E2E：註冊 → 授權 → 檢視 Connection List
   - Migration 驗證：重複執行具備 idempotent 能力
   - 提供 `npm run migrate:connections -- --sample` 以對 10 筆資料進行試跑

---

## 驗收標準

- [ ] Prisma schema 與 migration 文件通過 peer review
- [ ] 本機 / staging migration 演練紀錄已附在 PR 描述
- [ ] `/api/connections` 回傳包含 Connection 與 Connection Item 結構（符合 R1.1 定義的欄位命名）
- [ ] `webhook_events` 及其他資料正確關聯到新欄位
- [ ] `docs/memory/architecture/current.md` 中的資料表描述與實作一致
- [ ] Tooling：提供 `npm run migrate:connections` 或等效指令，並寫在 README / Run 說明
- [ ] 架構師 Final Review ✅，於此區塊標註 reviewer 與日期

---

## 風險與備註

- 需密切注意資料遷移期間可能的 Downtime，建議先在 Run 策略中安排 maintenance window
- 若後續新增平台欄位，請於 PR 中標註對應 metadata 的來源與格式
- 大型 Migration 執行超過 5 分鐘時，需在腳本中加入 progress log、checkpoint 以及 `--resume` 支援
- 若現有 `stores` 資料出現資料品質問題（缺欄位、null），需在資料遷移腳本中提前驗證並輸出報表（附於 PR）

---

**最後更新**: 2025-11-10


