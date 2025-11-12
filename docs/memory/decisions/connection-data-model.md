# Connection 資料模型決策

**決策日期**: 2025-11-07  
**狀態**: ✅ 已決策

---

## 決策結論

採用「Connection（平台 × 帳戶）」為核心實體，建立下列核心資料表：

- `integration_accounts`（Connection）：儲存使用者對特定平台帳戶的授權結果。
- `connection_items`（原 stores）：掛在 Connection 之下的細部資源（例如商店、店舖）。
- `platform_apps`（可選）：集中管理平台級別的 connector app key 與設定。

---

## 決策內容

### 資料表與主要欄位

1. `integration_accounts`
   - `id` (cuid)
   - `userId`：擁有此連線的 Admin
   - `platform`：平台識別（enum / string）
   - `externalAccountId`：平台層帳戶 ID（Shopline handle、NextEngine uid 等）
   - `displayName`：顯示名稱（可用 handle 或平台原生命名）
   - `authPayload`：JSON，儲存 access token、refresh token、scope、expiresAt 等授權資訊
   - `status`：`active` / `revoked` / `error`
   - `createdAt` / `updatedAt`

2. `connection_items`
   - `id` (cuid)
   - `integrationAccountId`：關聯到 Connection
   - `platform`：冗餘欄位，便於查詢
   - `externalResourceId`：平台資源 ID（Shopline store_id、NextEngine shop_id ...）
   - `displayName` / `metadata`：顯示名稱與平台特定欄位
   - `status`：`active` / `disabled`
   - `createdAt` / `updatedAt`

3. `platform_apps`（可選，但建議先建立結構）
   - `platform`
   - `clientId` / `clientSecret`
   - `settings`：JSON（callback URL、授權 scope、備註）

### Migration 策略（Shopline → Connection）

1. 由每位使用者現有的 stores 建立 `integration_accounts`：
   - `platform = shopline`
   - `externalAccountId = handle`
   - `displayName = handle`
   - `authPayload`：塞入原 `accessToken`、`expiresAt`、`scope`

2. `stores` 重命名為 `connection_items` 並新增欄位：
   - `integrationAccountId`：指向上一步建立的 Connection
   - `platform`、`externalResourceId`

3. 建立對應的外鍵、索引。

### Query 與服務層模式

- 前端與後端 API 皆以 Connection 為入口：`/api/connections` → 取得所有 Connection 及底下項目。
- Service 層透過 `PlatformServiceFactory` 依 `platform` 取得對應 Adapter。
- Data access 層提供：`findConnectionsByUser(userId)`、`findConnectionItems(connectionId)`、`findActiveTokens(connectionId)`。

### 命名與顯示原則

- 內部實作名稱統一使用 `Connection` 與 `ConnectionItem`。
- UI 顯示仍可依平台語彙（Store、Shop、Account），但皆由 Connection 的 `displayName`/`metadata` 控制。
- Next Engine 平台映射：`integration_accounts.externalAccountId` 對應 Next Engine 的 `companyId`，`connection_items.externalResourceId` 對應 Next Engine 的 `shopId`。詳細欄位對應與 metadata 規範見 `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`。

---

## 關鍵理由

1. **支援多平台多帳戶**：一位 Admin 可以同時建立多個平台、多個帳戶的連線。
2. **遷移成本可控**：保留原 `stores` 資料，透過 `connection_items` 兼容現有功能。
3. **擴充性**：未來可在 Connection 層加入資料流設定、授權狀態監控、審計紀錄。

---

## 待辦與依賴

- Refactor 3 Story R3.0 將依此決策執行 migration 與 schema 調整。
- `docs/memory/architecture/current.md` 需同步更新資料結構描述。
- Epic 4 需在 Refactor 完成後引用此模型規劃後續 Stories。

---

## 相關文件

- 討論紀錄：`docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`
- 長期架構 Backlog：`docs/archive/discussions/discussion-2025-11-07-multi-platform-architecture-backlog.md`
- Issues：`docs/backlog/issues/issue-2025-11-06-001.md`, `docs/backlog/issues/issue-2025-11-07-001.md`
- Next Engine 平台規格：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`

---

**最後更新**: 2025-11-07



