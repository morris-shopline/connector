# Current Run

**Run ID**: run-2025-11-07-01  
**類型**: Testing  
**開始時間**: 2025-11-07  
**完成時間**: 2025-11-07  
**狀態**: ✅ closed（2025-11-07，Story 3.4 / 3.5 測項以 code review 折衷完成）

---

## 任務類型

Story QA / Regression

---

## 目標任務

**Story 3.1: 使用者認證系統**  
- 文件: `docs/backlog/stories/story-3-1-user-authentication.md`  
- Story Review: `docs/archive/discussions/review-story-3-1-to-3-4.md`（✅ 完成）  
- 測試重點: 註冊、登入、登出、Session 與 JWT 驗證

**Story 3.2: 基礎權限驗證機制**  
- 文件: `docs/backlog/stories/story-3-2-basic-authorization.md`  
- Story Review: `docs/archive/discussions/review-story-3-1-to-3-4.md`（✅ 完成）  
- 測試重點: 認證中間件、保護端點、資料隔離（基礎）

**Story 3.3: 多租戶資料隔離**  
- 文件: `docs/backlog/stories/story-3-3-multi-tenant-data-isolation.md`  
- Story Review: `docs/archive/discussions/review-story-3-1-to-3-4.md`（✅ 完成）  
- 測試重點: 多租戶資料隔離、查詢過濾器、Webhook 事件過濾

**Story 3.4: Admin 管理介面（QA code review）**  
- 文件: `docs/backlog/stories/story-3-4-admin-management-interface.md`（新版 code review 副本：`docs/backlog/stories/story-3-4-admin-management-interface-code-review.md`）  
- Story Review: `docs/archive/discussions/review-story-3-1-to-3-4.md`（✅ 完成）  
- 折衷方式: 因缺乏完整瀏覽器操作管道，改以逐項 code review 核對 Zustand、路由保護與 UI 邏輯

**Story 3.5: OAuth 授權銜接（QA code review）**  
- 文件: `docs/backlog/stories/story-3-5-oauth-auth-integration.md`（新版 code review 副本：`docs/backlog/stories/story-3-5-oauth-auth-integration-code-review.md`）  
- Story Review: `docs/archive/discussions/review-story-3-1-to-3-4.md`（✅ 完成）  
- 折衷方式: Shopline OAuth 流程需實際平台授權，改以逐項 code review 驗證 state 參數、Session 綁定與回調處理

---

## 本 Run 要完成的 Stories

### Story 3.1: 使用者認證系統
- **目標**: 依驗收標準逐項執行功能測試並記錄結果
- **狀態**: ✅ agent-testing 完成
- **測試狀態**: ✅ 完成

### Story 3.2: 基礎權限驗證機制
- **目標**: 驗證認證中間件與保護端點行為，確保資料隔離
- **狀態**: ✅ agent-testing 完成
- **測試狀態**: ✅ 完成

### Story 3.3: 多租戶資料隔離
- **目標**: 驗證多租戶資料隔離與查詢過濾邏輯
- **狀態**: ✅ agent-testing 完成
- **測試狀態**: ✅ 完成（含新增 Story 3.4 / 3.5 code review 補充）

---

## 測試策略

- **環境**: 本地開發環境（前端 `http://localhost:3000/`、後端 `http://localhost:3001/`）
- **服務啟動**:
  - `brew services start redis`
  - `cd backend && REDIS_URL=redis://localhost:6379 npm run dev`
- **資料準備**:
  - 執行 `cd backend && npx tsx scripts/migrate-existing-data.ts`
  - 初次測試前確認 Redis 無殘留 Session（`redis-cli --scan --pattern "session:*"`）
- **工具**: `curl`/Postman、Prisma Studio、Redis CLI
- **測試帳號計畫**:
  - `qa-story31-user1@example.com`
  - `qa-story31-user2@example.com`
  - `qa-story32-user3@example.com`（必要時建立，用於額外資料隔離驗證）

---

## 測試進度

### Story 3.1 測試進度

#### 後端 API 功能測試
- [x] 註冊新使用者成功
- [x] 重複註冊阻擋（Email 已存在）
- [x] Email 格式錯誤阻擋
- [x] 密碼長度不足阻擋
- [x] 成功登入取得 JWT 與 Session ID
- [x] 錯誤密碼登入阻擋
- [x] 不存在的 Email 登入阻擋
- [x] `/api/auth/me` 使用有效 Token 成功
- [x] `/api/auth/me` 使用無效 Token 被拒
- [x] 登出後 Session/JWT 失效

#### Session 與 Redis 驗證
- [x] Redis 建立 `session:{id}` 紀錄
- [x] Session TTL 為 7 天
- [x] 登出後 Redis Session 刪除
- [x] Session 過期處理

#### 安全性與型別檢查
- [ ] TypeScript 編譯 / ESLint 無錯誤（未執行，本次僅進行功能驗證）
- [x] 密碼以 bcrypt 儲存（資料庫驗證）

---

### Story 3.2 測試進度

#### 認證中間件與端點保護
- [x] 未登入訪問 `/api/stores` 返回 401
- [x] 未登入訪問 `/api/stores/:shopId` 返回 401
- [x] 登入後 `/api/stores` 返回當前使用者的商店
- [x] 登入後 `/api/stores/:shopId` 返回自己的商店資訊
- [x] 嘗試訪問他人商店返回 403/404
- [x] 公開端點（`/api/auth/register` 等）保持可訪問
- [x] 登出後訪問保護端點為 401

#### 資料隔離 / 多帳號驗證
- [x] 使用者 A 建立商店後僅自身可見
- [x] 使用者 B 建立商店後僅自身可見
- [x] `/webhook/events` 等保護端點資料隔離（如適用）

### Story 3.1 測試紀錄

| 測試項目 | 結果 | 備註 |
| --- | --- | --- |
| 註冊新使用者 | ✅ | 200；建立 `qa-story31-user1@example.com`，回傳 id `cmhokp3rn00008hr1wdmthdhf` |
| 重複註冊阻擋 | ✅ | 第二次呼叫返回 400 `Email already exists` |
| Email 格式驗證 | ✅ | 無效 email 返回 400，含 zod error 訊息 |
| 密碼長度驗證 | ✅ | 密碼少於 8 碼返回 400 `Password must be at least 8 characters` |
| 成功登入 | ✅ | 200；取得 JWT 與 Session `2ff3e3...d85c` |
| 錯誤密碼登入 | ✅ | 401 `Invalid email or password` |
| 不存在使用者登入 | ✅ | 401 `Invalid email or password` |
| `/api/auth/me` 有效 Token | ✅ | 200；回傳使用者基本資料 |
| `/api/auth/me` 無效 Token | ✅ | 401 `Invalid or expired token` |
| 登出流程 | ✅ | 登出後同一 JWT 呼叫 `/api/auth/me`、`/api/stores` 皆返回 401 |
| Redis Session 建立 | ✅ | `redis-cli --scan --pattern "session:*"` 顯示新增 Session key |
| Session TTL | ✅ | `redis-cli TTL` ≈ 604792 秒（約 7 天） |
| Redis Session 刪除 | ✅ | 登出後 `redis-cli --scan` 無 Session 紀錄 |
| Session 過期測試 | ✅ | 將 Session TTL 調為 1 秒後過期，JWT 再呼叫 `/api/auth/me` 返回 401 |

### Story 3.2 測試紀錄

| 測試項目 | 結果 | 備註 |
| --- | --- | --- |
| 未登入訪問 `/api/stores` | ✅ | 401 `Authentication required` |
| 未登入訪問 `/api/stores/:shopId` | ✅ | 401 `Authentication required` |
| 登入後 `/api/stores` | ✅ | User1/User2 皆僅取得自身商店 |
| 登入後 `/api/stores/:shopId` | ✅ | 成功取得自己商店詳細資訊 |
| 他人商店訪問阻擋 | ✅ | 跨使用者訪問返回 403 |
| 公開端點可用性 | ✅ | 未登入註冊新帳號成功（200） |
| 登出後訪問阻擋 | ✅ | 登出後同一 JWT 存取 `/api/stores` 返回 401 |
| 資料隔離（多使用者） | ✅ | UserA/UserB 清單互不顯示對方商店 |

### Story 3.3 測試進度

#### 資料庫與遷移
- [x] Prisma Schema `Store`/`WebhookEvent` 含 `userId` 並驗證成功
- [x] Migration 與索引狀態確認
- [x] 資料遷移腳本結果（系統使用者）確認

#### 查詢過濾器與 Service
- [x] `filterStoresByUser`、`filterWebhookEventsByUser` 運作正常
- [x] `verifyStoreOwnership` 正確拒絕跨使用者
- [x] `ShoplineService` 相關方法正確處理 `userId`

#### API 與資料隔離
- [x] `/api/stores` 僅返回當前使用者商店
- [x] `/api/stores/:shopId` 驗證所有權
- [x] `/webhook/events` 僅返回當前使用者事件
- [ ] 新增商店流程將 `userId` 綁定登入使用者（OAuth 流程未覆測）

### Story 3.3 測試紀錄

| 測試項目 | 結果 | 備註 |
| --- | --- | --- |
| Schema 與 Migration 驗證 | ✅ | `prisma.store` / `webhookEvent` 皆帶 `userId`，系統使用者存在 |
| 資料遷移腳本確認 | ✅ | `migrate-existing-data.ts` 執行後舊資料對應 `system@admin.com` |
| 查詢過濾器 / 所有權驗證 | ✅ | 跨使用者請求 `/api/stores/:id` 返回 403 |
| `/api/stores` 資料隔離 | ✅ | User1/User2 僅看到各自商店 |
| `/api/stores/:shopId` 所有權驗證 | ✅ | 他人商店返回 403 |
| `/webhook/events` 資料隔離 | ✅ | 只返回對應使用者之事件（user1/user2 測試） |
| ShoplineService `getAllStores` | ✅ | 修正後依 `userId` 過濾（user1/user2 測試） |
| 新增商店綁定使用者 | ⚠️ | OAuth 流程未覆測（無對應測試管道） |

### Story 3.4 測試進度（code review）

> ℹ️ 前端認證流程需完整 UI 操作，本次改以逐項 code review 驗證，詳見 `docs/backlog/stories/story-3-4-admin-management-interface-code-review.md`。
- [x] Zustand Auth Store 狀態轉移與動作流程逐項檢視
- [x] 登入 / 註冊頁面元件與表單驗證邏輯逐行審視
- [x] Header 與 ProtectedRoute 所有權判斷與重導向流程驗證
- [x] Token 儲存、攔截器與過期處理邏輯確認

### Story 3.5 測試進度（code review）

> ℹ️ Shopline OAuth 需實際平台互動，本次同樣以 code review 驗證，詳見 `docs/backlog/stories/story-3-5-oauth-auth-integration-code-review.md`。
- [x] OAuth 授權 URL `state` 參數生成與加密流程檢視
- [x] Callback Session 驗證、商店綁定與錯誤流程審視
- [x] 前端回調處理、Session 恢復與 UI 邏輯檢視
- [x] 資料備份 / 清理腳本以及 JWT Session ID 擴充確認

---

## 阻塞 / 風險
- Story 3.4 / 3.5 僅以 code review 驗證，需在 User Test 階段進行實機流程覆查

---

**最後更新**: 2025-11-07 14:30
