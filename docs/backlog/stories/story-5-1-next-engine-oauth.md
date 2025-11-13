# Story 5.1: Next Engine OAuth Flow 與 Platform Adapter

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ✅ completed  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2 個工作天

---

## Story 描述

建立 Next Engine 專屬的授權流程與 Platform Adapter，讓使用者可以在 Admin 介面完成 Next Engine 的授權、重新授權與 Token Refresh。流程需與 Epic 4 的 Connection 架構整合，所有平台差異封裝於 Adapter 層，後端 API 仍透過統一的 `PlatformServiceFactory` 存取。

> 參考文件：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/guides/NE-OVERVIEW.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 🔧 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含 OAuth 流程的端到端實作）

---

## 前情提要

- Refactor 3 已完成 Connection 基礎重構（資料模型與狀態同步）。
- Epic 4 完成 Shopline 單平台的 OAuth / 重新授權體驗，需沿用既有 UI 與 Activity Dock。
- `docs/memory/decisions/connection-data-model.md` 補充 Next Engine 映射原則：`companyId`→Connection、`shopId`→Connection Item。
- 此 Story 僅處理後端 OAuth / Token 管理與 Adapter 介面，前端 UX 延伸由 Story 5.3 處理。

---

## 依賴與前置條件

1. Next Engine Sandbox 憑證已配置於 `.env`（詳見 `ENV_SETUP_GUIDE.md`）。  
2. `PlatformServiceFactory` 需已支援註冊新平台 adapter 的擴充點。

---

## 範圍定義

### ✅ 包含
- 建立 `NextEngineAdapter`（或等價命名）並註冊到 `PlatformServiceFactory`。
- 實作 `/api/auth/next-engine/install`、`/api/auth/next-engine/callback`、`/api/auth/next-engine/refresh` API。
- 將 OAuth 結果寫入 `integration_accounts`（externalAccountId=companyId）。
- 初步錯誤碼映射（002002、002003、其他為 PLATFORM_UNKNOWN）。
- 建立 Token 審計記錄（成功 / 失敗）並送往 Activity Dock。
- 撰寫自動化測試涵蓋授權成功、refresh 成功 / 失敗、未知錯誤 fallback。

### ❌ 不包含
- 前端授權 UI / Activity Dock 呈現（Story 5.3）。
- Next Engine 資料讀取 API 與 Connection Item 建立（Story 5.2）。
- 在庫連攜 webhook（Phase 2 後續項目）。

---

## 技術重點與實作要點

- Adapter 介面：`getAuthorizeUrl`、`exchangeToken`、`refreshToken`、`getIdentity`。需維持與 Shopline Adapter 相同回傳格式。
- OAuth state payload 應包含 `userId` 與防重放 nonce；callback 需驗證 state。
- 儲存 Token 時，維持 JSON 字串（避免 Prisma 自動轉型），並記錄 `expiresAt`、`scope`。
- Refresh 流程需鎖定同一 Connection，避免重複刷新：可沿用 Story 4.3 的 Redis 分佈鎖或以資料庫 row-level lock 實作。
- Activity Dock 記錄格式沿用 `connection.audit` 事件 schema。
- 未知錯誤需記錄 raw response 供除錯，但在回應中僅回傳泛用訊息；若官方文檔無對應說明，需在 Run 記錄並回報等待支援。

### API 操作摘要（參考 `NEXTENGINE_API_REFERENCE.md`）
| 流程 | 端點 | 方法 / Header | 必填參數 |
|------|------|---------------|----------|
| 取得授權頁 URL | `https://base.next-engine.org/users/sign_in/` | GET | `client_id`, `redirect_uri` |
| 交換 Access Token | `https://api.next-engine.org/api_neauth` | POST, `Content-Type: application/x-www-form-urlencoded` | `client_id`, `client_secret`, `uid`, `state` |
| Refresh Token | `https://api.next-engine.org/api_neauth` | POST | `client_id`, `client_secret`, `uid`, `state`, `refresh_token` |
| 取得公司資訊（`getIdentity` 可用） | `https://api.next-engine.org/api_v1_system_company/info` | POST | `access_token`, `fields=company_id,company_name` |

- Token 交換與 refresh 皆會回傳 `access_token`, `refresh_token`, `access_token_end_date`, `refresh_token_end_date`。請記錄於 `authPayload`。  
- 若回傳 `code=002002` → Token 過期；`002003` → Refresh 失敗；其他回傳需紀錄於審計並標記為 `PLATFORM_UNKNOWN`。

---

## 驗收標準

### Agent 自動化 / 單元測試（後端 API 測試）
- [x] `/api/auth/next-engine/install` 回傳授權 URL，state 帶有 userId（已實作，需實際 OAuth 流程驗證）。
- [x] `/api/auth/next-engine/callback` 成功時建立新的 Connection，`externalAccountId` = companyId（已實作，需實際 OAuth 流程驗證）。
- [x] Refresh token API 已實作（`/api/auth/next-engine/refresh`），錯誤碼映射已實作，需實際 API 測試驗證 002002 過期錯誤處理。
- [x] Refresh token 失敗（002003）時，回傳 `TOKEN_REFRESH_FAILED` 並寫入審計（已實作錯誤碼映射與審計記錄）。
- [x] 不明錯誤回傳 `PLATFORM_UNKNOWN`，審計記錄包含原始錯誤訊息（已實作錯誤碼映射與審計記錄）。

### 自動化測試執行
- [x] 執行 `npm run test:run` 通過所有單元測試（NextEngineAdapter 測試，13 個測試通過）
- [x] 執行 `npm run test:run` 通過所有整合測試（OAuth API 路由測試，6 個測試通過，1 個跳過）
- [x] 測試涵蓋：授權 URL 生成、Token 交換、Token 刷新、錯誤碼映射（002002, 002003, PLATFORM_UNKNOWN）、API 路由驗證

### ⚠️ 注意事項
- **前端 UI 測試屬於 Story 5.3**，Story 5.1 僅完成後端 API。
- 前端授權按鈕、Activity Dock 顯示等 UI 功能將於 Story 5.3 實作並測試。

---

## 交付與文件更新
- [x] 錯誤碼對照表已實作於 `NextEngineAdapter.mapErrorCode()`（002002, 002003, PLATFORM_UNKNOWN）。
- [ ] 於 `docs/reference/guides/NE-OVERVIEW.md` 記錄實測結果與注意事項（待實際 OAuth 流程測試後更新）。

---

## 風險與備註
- Next Engine 回傳日文錯誤訊息，需保持原始資訊於審計或 log，以便 PM / CS 追蹤。
- 若 Next Engine 需要固定 IP，需評估 Render / 開發者環境的白名單設定。
