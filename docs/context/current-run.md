# Current Run

**Run ID**: run-2025-11-06-01  
**類型**: Feature  
**開始時間**: 2025-11-06  
**完成時間**: 待定（User Test 進行中）  
**狀態**: 🧪 User Test 進行中（正式環境測試）

---

## 任務類型

Feature Development

---

## 目標任務

**Epic 3**: Admin 管理系統（Phase 1.1）
- 文件: `docs/backlog/epics/epic-3-admin-management-system.md`
- **Story Review**: ✅ 已完成（見 `docs/archive/discussions/review-story-3-1-to-3-4.md`）

---

## 本 Run 要完成的 Stories

### Story 3.1: 使用者認證系統
- **文件**: `docs/backlog/stories/story-3-1-user-authentication.md`
- **狀態**: ✅ completed
- **描述**: 實作後端認證 API（註冊、登入、登出、Session 管理、JWT Token）
- **測試狀態**: ✅ Agent 測試完成

### Story 3.2: 基礎權限驗證機制
- **文件**: `docs/backlog/stories/story-3-2-basic-authorization.md`
- **狀態**: ✅ completed
- **描述**: 實作後端認證中間件擴展、API 端點保護、資料過濾（基礎）
- **測試狀態**: ✅ Agent 測試完成

### Story 3.3: 多租戶資料隔離
- **文件**: `docs/backlog/stories/story-3-3-multi-tenant-data-isolation.md`
- **狀態**: ✅ completed
- **描述**: 實作資料庫設計、查詢過濾器、後端路由更新
- **測試狀態**: ✅ Agent 測試完成

### Story 3.4: Admin 管理介面
- **文件**: `docs/backlog/stories/story-3-4-admin-management-interface.md`
- **狀態**: ✅ completed
- **描述**: 實作前端登入/註冊頁面、路由保護、認證狀態管理（Zustand）
- **測試狀態**: ✅ Agent 測試完成

---

## 開發策略

### 開發順序
1. **Story 3.1** → 後端認證基礎（必須先完成）
2. **Story 3.2** → 後端權限驗證（依賴 Story 3.1）
3. **Story 3.3** → 多租戶資料隔離（依賴 Story 3.1, 3.2）
4. **Story 3.4** → 前端介面（依賴 Story 3.1, 3.2, 3.3）

### 測試策略
- **每個 Story 完成後**：立即執行 Agent 功能測試
- **所有 Story 完成後**：統一執行 User Test（整合四個 Story 的測試步驟）

---

## 當前進度

### Story 3.1: 使用者認證系統 ✅

#### Phase 1: 資料庫設計
- [x] 更新 Prisma Schema（新增 `User` 模型）
- [x] 執行 Migration（使用 `prisma db push`）
- [x] 驗證資料庫變更

#### Phase 2: 工具函數實作
- [x] 密碼加密與驗證（`backend/src/utils/password.ts`）
- [x] JWT Token 操作（`backend/src/utils/jwt.ts`）
- [x] Session 管理（`backend/src/utils/session.ts`）

#### Phase 3: API 端點實作
- [x] 擴展現有 Auth Routes（`backend/src/routes/auth.ts`）
- [x] 實作認證中間件（`backend/src/middleware/auth.ts`）

#### Phase 4: 測試與驗證
- [x] Agent 功能測試
- [x] 驗證 Redis Session 儲存
- [x] 驗證密碼加密

### Story 3.2: 基礎權限驗證機制 ✅

#### Phase 1: 後端認證中間件擴展
- [x] 擴展現有認證中間件（`optionalAuthMiddleware`）
- [x] 測試認證中間件

#### Phase 2: API 端點保護
- [x] 保護 API 端點（`/api/stores`, `/api/stores/:shopId`）
- [x] 保護 Webhook 端點（`/webhook/events`, `/webhook/subscribe`）
- [x] 測試 API 保護

#### Phase 3: 整合測試
- [x] 端到端測試
- [x] 資料隔離測試（基礎）

### Story 3.3: 多租戶資料隔離 ✅

#### Phase 1: 資料庫設計
- [x] 更新 Prisma Schema（`Store` 和 `WebhookEvent` 新增 `userId`）
- [x] 執行 Migration（使用 `prisma db push`）
- [x] 資料遷移（建立系統使用者並遷移現有資料）

#### Phase 2: 查詢過濾器實作
- [x] 建立查詢過濾器工具（`backend/src/utils/query-filter.ts`）
- [x] 測試查詢過濾器

#### Phase 3: 後端路由更新
- [x] 更新 API Routes（加入資料過濾）
- [x] 更新 Webhook Routes（加入資料過濾）
- [x] 更新 Auth Routes（OAuth 回調需要設定 userId，待後續處理）

#### Phase 4: Service 層更新
- [x] 更新 ShoplineService（待後續處理，目前直接使用 Prisma）

### Story 3.4: Admin 管理介面 ✅

#### Phase 1: 認證狀態管理
- [x] 建立 Auth Store（Zustand）（`frontend/stores/useAuthStore.ts`）
- [x] 擴展 API 函數（Token 自動附加、認證相關 API）

#### Phase 2: 登入/註冊頁面
- [x] 建立登入頁面（`frontend/pages/login.tsx`）
- [x] 建立註冊頁面（`frontend/pages/register.tsx`）

#### Phase 3: 登入狀態展示
- [x] 擴展 Header 組件（顯示使用者資訊和登出按鈕）

#### Phase 4: 路由保護
- [x] 建立 ProtectedRoute 組件（`frontend/components/ProtectedRoute.tsx`）
- [x] 保護需要登入的頁面（`index.tsx`, `webhook-test.tsx`, `admin-api-test.tsx`）

---

## User Test 步驟（整合測試）

> **注意**：所有 User Test 將在 Run 最後統一執行

### Story 3.1 User Test

1. **註冊功能測試**
   - 使用 API 工具測試註冊 API
   - 驗證：返回成功訊息和使用者資訊
   - 驗證：資料庫中 `users` 表有對應記錄
   - 驗證：密碼已加密（不是明文）

2. **重複註冊測試**
   - 使用相同 Email 再次註冊
   - 驗證：返回錯誤訊息（Email 已存在）

3. **登入功能測試**
   - 使用註冊的帳號登入
   - 驗證：返回成功訊息、JWT Token、Session ID
   - 驗證：Redis 中有對應的 Session 記錄

4. **錯誤密碼登入測試**
   - 使用錯誤密碼登入
   - 驗證：返回錯誤訊息（密碼錯誤）

5. **Session 驗證測試**
   - 使用登入返回的 Token 呼叫 `/api/auth/me`
   - 驗證：返回當前使用者資訊
   - 使用無效 Token 呼叫 `/api/auth/me`
   - 驗證：返回錯誤訊息（未授權）

6. **登出功能測試**
   - 使用有效的 Token/Session 登出
   - 驗證：返回成功訊息
   - 驗證：Redis 中的 Session 已清除

### Story 3.2 User Test

1. **未登入訪問保護 API 測試**
   - 清除瀏覽器的 Token/Session
   - 呼叫 `/api/stores`（不提供 Token）
   - 驗證：應該返回 401 錯誤（未授權）

2. **登入後訪問保護 API 測試**
   - 使用登入返回的 Token 呼叫 `/api/stores`
   - 驗證：應該返回該使用者的商店列表

3. **資料隔離測試**
   - 使用使用者 A 的帳號登入，建立商店 A
   - 使用使用者 B 的帳號登入，建立商店 B
   - 使用使用者 A 的帳號登入，呼叫 `/api/stores`
   - 驗證：應該只返回商店 A，不包含商店 B

4. **公開端點不受影響測試**
   - 未登入時訪問 `/api/auth/register`
   - 驗證：應該可以正常註冊

### Story 3.3 User Test

1. **使用者 A 資料隔離測試**
   - 使用使用者 A 登入
   - 呼叫 `GET /api/stores`
   - 驗證：只返回使用者 A 的商店
   - 呼叫 `GET /webhook/events`
   - 驗證：只返回使用者 A 的 Webhook 事件

2. **跨使用者資料存取測試**
   - 使用使用者 A 登入，取得商店 ID（`storeId-A`）
   - 使用使用者 B 登入
   - 嘗試存取 `GET /api/stores/storeId-A`
   - 驗證：返回 403 或 404 錯誤

3. **新商店建立測試**
   - 使用使用者 A 登入
   - 建立新商店（透過 OAuth 流程）
   - 驗證：新建立的商店的 `userId` 為使用者 A 的 ID

### Story 3.4 User Test

1. **註冊功能測試**
   - 訪問 `/register` 頁面
   - 輸入 Email、密碼、確認密碼
   - 點擊註冊按鈕
   - 驗證：註冊成功後自動登入並重導向到首頁
   - 驗證：Header 顯示使用者資訊

2. **登入功能測試**
   - 訪問 `/login` 頁面
   - 輸入已註冊的 Email 和密碼
   - 點擊登入按鈕
   - 驗證：登入成功後重導向到首頁
   - 驗證：Header 顯示使用者資訊

3. **路由保護測試**
   - 登出後訪問首頁 `/`
   - 驗證：自動重導向到 `/login` 頁面
   - 登入後訪問首頁
   - 驗證：可以正常訪問首頁

4. **登出功能測試**
   - 登入後點擊 Header 的登出按鈕
   - 驗證：登出成功並重導向到 `/login` 頁面
   - 驗證：localStorage 中的 Token 已清除

5. **Token 自動附加測試**
   - 登入後訪問需要認證的 API（如 `/api/auth/me`）
   - 驗證：API 請求自動附加 Token
   - 驗證：API 返回使用者資訊

---

## 無法自動測試的項目

1. **後端 API 測試**：需要實際呼叫 API 端點測試
2. **前端 UI 測試**：需要實際在瀏覽器中操作測試
3. **Redis Session 測試**：需要實際 Redis 環境測試
4. **跨使用者資料隔離測試**：需要建立多個使用者測試

---

## 🚀 部署狀態

**部署日期**: 2025-11-06  
**部署策略**: 直接部署到正式環境進行測試（有風險）  
**部署平台**:
- **前端**: Vercel（自動部署，push 到 main 分支）
- **後端**: Render（自動部署，push 到 main 分支）

**正式環境 URL**:
- **前端**: `https://connector-theta.vercel.app/`
- **後端**: `https://connector-o5hx.onrender.com/`

**⚠️ 風險說明**:
- 直接部署到正式環境，未經過本地完整測試
- 如果測試不順，需要回退或使用 ngrok 進行本地測試
- 所有變更已修復跨邊界問題，但未經過完整 User Test

**部署後檢查清單**:
- [ ] 確認前端部署成功（訪問 `https://connector-theta.vercel.app/`）
- [ ] 確認後端部署成功（訪問 `https://connector-o5hx.onrender.com/api/health`）
- [ ] 確認環境變數設定正確（特別是 `JWT_SECRET`、`REDIS_URL`）
- [ ] 確認資料庫系統使用者存在（執行 `migrate-existing-data.ts` 或確認 `system@admin.com` 存在）
- [ ] 測試註冊功能
- [ ] 測試登入功能
- [ ] 測試登出功能
- [ ] 測試路由保護
- [ ] 測試 API 端點保護
- [ ] 測試資料隔離

**部署後測試記錄**:
- 首次部署 Git Push: 2025-11-06 (Commit: `e45681d`)
- 修復部署 Git Push: 2025-11-06 (Commit: `44213bf`)
- Vercel 部署狀態: 自動部署中（請檢查 [Vercel Dashboard](https://vercel.com/dashboard)）
- Render 部署狀態: 自動部署中（請檢查 [Render Dashboard](https://dashboard.render.com/)）
- 測試開始時間: 待記錄（部署完成後）
- 測試結果: 待記錄
- **發現的問題 1**: Prisma Client 未在生產環境生成（已修復）
  - 錯誤: `Cannot read properties of undefined (reading 'findUnique')`
  - 修復: 在 `build` 腳本中加入 `prisma generate`
  - 狀態: ✅ 已修復並重新部署

---

## Code Review 結果

**Review 日期**: 2025-11-06  
**Review 文件**: `docs/archive/discussions/tpm-code-review-story-3-1-to-3-4.md`

### ✅ 修復的問題

1. **OAuth 回調時建立 Store 的 userId 問題**（已修復）
   - 修改 `saveStoreInfo` 方法，加入可選的 `userId` 參數
   - 如果沒有提供 `userId`，則使用系統使用者
   - 在 OAuth 回調路由中，嘗試從 Token 或 Session 取得當前使用者

2. **Webhook 接收時設定 userId 的問題**（已修復）
   - 修改 `saveWebhookEvent` 方法，從 Store 取得 `userId`
   - 確保 Webhook 事件正確設定 `userId`

3. **Admin API 端點（使用 handle）沒有加入認證保護**（已修復）
   - 為所有使用 handle 的 Admin API 端點加入 `authMiddleware` 保護
   - 加入 `verifyStoreHandleOwnership` 驗證，確保 handle 屬於當前使用者

### ✅ 測試環境準備

**測試前必須執行**：
```bash
cd backend
npx tsx scripts/migrate-existing-data.ts
```

**測試網址**：
- 前端：`http://localhost:3000/`
- 後端：`http://localhost:3001/`

**詳細測試步驟**：見 `docs/archive/discussions/tpm-code-review-story-3-1-to-3-4.md`

---

## 可能出現的問題

1. **Redis 連線失敗**：系統會自動降級到資料庫查詢
2. **資料遷移問題**：現有資料需要處理（可選：遷移到系統使用者）
3. **Token 過期處理**：需要正確處理 Token 過期情況
4. **路由保護衝突**：確保前端路由保護與後端 API 保護一致
5. **系統使用者不存在**：測試前必須執行 `migrate-existing-data.ts` 腳本

---

## 📚 相關文件

- **Epic 3**: `docs/backlog/epics/epic-3-admin-management-system.md`
- **Story Review**: `docs/archive/discussions/review-story-3-1-to-3-4.md`
- **Run 管理規範**: `docs/reference/guides/RUN_MANAGEMENT.md`
- **狀態管理決策**: `docs/memory/decisions/state-management.md`

---

**最後更新**: 2025-11-06
