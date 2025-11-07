# Story R3.0: Connection 資料模型與 Migration

**所屬 Refactor**: [Refactor 3: Connection 基礎重構（Phase 1.2 前置）](../refactors/refactor-3-connection-foundation.md)  
**狀態**: ⏳ planned  
**建立日期**: 2025-11-07  
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
2. 將現有 `stores` 資料遷移到新的結構。
3. 更新 Repository / Service，改以 Connection 為入口供後端 API 使用。
4. 提供 Data Access Helper：`findConnectionsByUser`、`findConnectionItems`、`upsertConnection` 等。

---

## 🚨 前置條件

- 確認資料庫備份策略可用（staging & production）
- 決策文件已審閱並確認（見上方連結）

---

## 實作項目

1. **Schema 與 Migration**
   - 更新 `prisma/schema.prisma`
   - 撰寫 migration script（包含資料重寫與索引建立）
   - 演練：本機 / staging 先跑 migration，再記錄時間與注意事項

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

---

## 驗收標準

- [ ] Prisma schema 與 migration 文件通過 peer review
- [ ] 本機 / staging migration 演練紀錄已附在 PR 描述
- [ ] `/api/connections` 回傳包含 Connection 與 Connection Item 結構
- [ ] `webhook_events` 及其他資料正確關聯到新欄位
- [ ] `docs/memory/architecture/current.md` 中的資料表描述與實作一致
- [ ] Tooling：提供 `npm run migrate:connections` 或等效指令，並寫在 README / Run 說明

---

## 風險與備註

- 需密切注意資料遷移期間可能的 Downtime，建議先在 Run 策略中安排 maintenance window
- 若後續新增平台欄位，請於 PR 中標註對應 metadata 的來源與格式

---

**最後更新**: 2025-11-07


