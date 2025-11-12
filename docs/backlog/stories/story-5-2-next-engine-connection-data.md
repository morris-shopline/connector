# Story 5.2: Next Engine Connection Item 與資料讀取 MVP

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ✅ completed  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 3 個工作天

---

## Story 描述

在完成 OAuth 與 Adapter 後，將 Next Engine 的公司／店舖資料寫入既有的 Connection 模型，並提供最小可行的資料讀取 API（店舖列表 + 訂單摘要），以驗證多平台資料隔離、權限檢查與錯誤處理。

> 參考文件：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`、`docs/reference/guides/NE-OVERVIEW.md`、`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`

---

## 前情提要

- Story 5.1 完成後，系統已能取得 Next Engine access token 並建立 Connection。
- `connection-data-model` 決策已定義：companyId → Connection、shopId → Connection Item。
- Epic 4 的 API 權限與審計中介層已可套用到新平台。

---

## 依賴與前置條件

1. Story 5.1 的 Adapter 已提供授權、refresh 與 `getIdentity` 能力，憑證已配置於 `.env`。  
2. Prisma schema/migration 需調整，確保 `metadata` 可儲存 Next Engine 特有欄位（JSON）。  
3. Activity Dock 事件 schema 已於 Epic 4 定義，需沿用以紀錄資料同步狀態。

---

## 範圍定義

### ✅ 包含
- 在 callback 完成後，透過 Next Engine API 取得公司／店舖資訊，建立或更新 Connection Item。
- 實作後端 API：`GET /api/connections/:id/items`（支援平台差異）與 `GET /api/connections/:id/orders/summary`（最小讀取）。
- 確保 API 層驗證 Connection owner，並對 Next Engine API 錯誤進行統一轉換。
- 建立 Prisma migration（若需要）與自動化測試 fixture。
- 撰寫資料層與服務層測試，涵蓋成功、錯誤、權限驗證。

### ❌ 不包含
- 前端畫面顯示與 UX 調整（Story 5.3）。
- CSV/在庫連攜或其他批次 API（Phase 2）。

---

## 技術重點與實作要點

- 建議在 `backend/src/platforms/next-engine/` 建立 service 層，封裝 API 呼叫、資料轉換與錯誤碼檢查。
- Connection Item 欄位：
  - `externalResourceId = shopId`
  - `displayName = shopName`
  - `metadata` 包含 `mallId`, `mallName`, `warehouseIds`, `timezone` 等。
- 訂單摘要可先回傳總數、最近更新時間，後續 Story 再擴充詳細頁。
- 寫入流程需考慮 idempotent：同一公司重複授權時應更新，而非重複建立 item。
- 錯誤處理：Next Engine API 回應 `code != '000000'` 視為失敗，轉為 `PLATFORM_ERROR`，並寫入審計。若 API 文件未涵蓋的錯誤阻礙進度，請記錄並在 Run 中提出支援需求。

### API 操作摘要（參考 `NEXTENGINE_API_REFERENCE.md`）
| 用途 | 端點 | 方法 / 參數 | 備註 |
|------|------|-------------|------|
| 取得店舖列表 | `https://api.next-engine.org/api_v1_master_shop/search` | POST, `access_token`, `fields=shop_id,shop_name,...` | 回傳 `result`, `data`；`shop_id` 對應 Connection Item |
| 建立店舖 | `https://api.next-engine.org/api_v1_master_shop/create` | POST, `access_token`, `data=<XML>`, `wait_flag=1` | XML 欄位需參照官方格式，測試可建立 sandbox 店舖 |
| 建立商品 | `https://api.next-engine.org/api_v1_master_goods/upload` | POST, `access_token`, `data_type=csv`, `data=<CSV>`, `wait_flag=1` | 需提供最小 CSV 欄位； Story 需附測試範例 |
| 查詢商品 | `https://api.next-engine.org/api_v1_master_goods/search` | POST, `access_token`, `fields=goods_id,goods_name,...`, `goods_id-eq` | 用於驗證建立結果 |

**實作要求**：Story 完成時需附上上述操作的 happy path 測試腳本（或操作說明），確保能在 sandbox 中建立 / 查詢店舖與商品。其餘庫存 / 倉庫相關 API 將於後續 Story（5.5）再補強，以避免在架構尚未確認前實作過多。

- API 回傳內容包含 `access_token`、`refresh_token` 續期資訊；可由 Story 5.1 的 refresh 邏輯統一處理。

---

## 驗收標準

### Agent 自動化 / 測試
- [ ] Prisma migration 執行成功並通過 lint / type 檢查。
- [ ] 模擬 callback 後，`integration_accounts.externalAccountId = companyId`，`connection_items` 成功建立 shop 資料。
- [ ] `GET /api/connections/:id/items` 回傳包含 Next Engine shop，`metadata.mallId` 等欄位存在。
- [ ] `GET /api/connections/:id/orders/summary` 在成功與失敗情境皆可通過測試。
- [ ] 權限測試：非擁有者呼叫上述 API 回傳 403。

### 自動化測試執行（待 Story 5.2 實作後補齊）
- [ ] 建立單元測試驗證 Connection Item 建立邏輯
- [ ] 建立整合測試驗證 `GET /api/connections/:id/items` API
- [ ] 建立整合測試驗證 `GET /api/connections/:id/orders/summary` API
- [ ] 建立測試驗證錯誤處理與權限檢查
- [ ] 執行 `npm run test:run` 確認所有測試通過

### ⚠️ 注意事項
- **前端 UI 測試屬於 Story 5.3**，Story 5.2 僅完成後端 API。
- Toast 與 Activity Dock 顯示等 UI 功能將於 Story 5.3 實作並測試。

---

## 交付與文件更新
- [ ] 更新 `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md` 的資料欄位對照表（若有新增欄位）。
- [ ] 在 `docs/reference/guides/NE-OVERVIEW.md` 補充測試紀錄與 API 使用注意事項。
- [ ] 若新增環境變數或設定，更新 `ENV_SETUP_GUIDE.md`。

---

## 風險與備註
- Next Engine API 頻率限制與資料量需注意，建議 logging requestId 與回應時間。
- 需確保 Token 在呼叫前仍有效（可沿用 Story 5.1 的 refresh 邏輯）。
- 若 Next Engine 店舖眾多，需評估前端分頁或快取策略（後續 Story 覆蓋）。
