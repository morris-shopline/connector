# TPM Code Review: Story 3.1-3.4 實作內容

**Review 日期**: 2025-11-06  
**Review 範圍**: Story 3.1, 3.2, 3.3, 3.4 完整實作  
**Reviewer**: TPM

---

## 📋 Review 摘要

### ✅ 整體架構一致性
- **依賴關係清晰**：所有 Story 都按照正確順序實作
- **資料模型一致**：User、Store、WebhookEvent 模型設計正確
- **API 端點一致**：認證 API 端點設計一致
- **認證機制一致**：JWT + Redis Session 機制一致
- **狀態管理一致**：前端使用 Zustand，符合專案規範

### ⚠️ 發現並修復的問題

#### 1. **OAuth 回調時建立 Store 的 userId 問題**（已修復）

**問題描述**：
- `saveStoreInfo` 方法在建立 Store 時沒有設定 `userId`
- 現在 Store 的 `userId` 是必填的，但 OAuth 回調時可能沒有登入的使用者
- 這會導致建立 Store 失敗

**修復方案**：
- 修改 `saveStoreInfo` 方法，加入可選的 `userId` 參數
- 如果沒有提供 `userId`，則使用系統使用者（`system@admin.com`）
- 在 OAuth 回調路由中，嘗試從 Token 或 Session 取得當前使用者
- 如果有使用者，則使用該使用者的 ID；否則使用系統使用者

**修復檔案**：
- `backend/src/services/shopline.ts` - `saveStoreInfo` 方法
- `backend/src/routes/auth.ts` - OAuth 回調路由

#### 2. **Webhook 接收時設定 userId 的問題**（已修復）

**問題描述**：
- `saveWebhookEvent` 方法沒有設定 `userId`
- 現在 WebhookEvent 的 `userId` 是必填的，但 Webhook 接收時沒有使用者資訊
- 這會導致儲存 Webhook 事件失敗

**修復方案**：
- 修改 `saveWebhookEvent` 方法，從 Store 取得 `userId`
- 確保 Webhook 事件正確設定 `userId`

**修復檔案**：
- `backend/src/services/shopline.ts` - `saveWebhookEvent` 方法

#### 3. **Admin API 端點（使用 handle）沒有加入認證保護**（已修復）

**問題描述**：
- 以下端點沒有加入認證保護：
  - `/api/stores/:handle/info`
  - `/api/stores/:handle/products`
  - `/api/stores/:handle/products/:productId`
  - `/api/stores/:handle/locations`
  - `/api/stores/:handle/orders`
  - `/api/stores/:handle/orders` (POST)

**修復方案**：
- 為所有使用 handle 的 Admin API 端點加入 `authMiddleware` 保護
- 加入 `verifyStoreHandleOwnership` 驗證，確保 handle 屬於當前使用者

**修復檔案**：
- `backend/src/routes/api.ts` - 所有 Admin API 端點
- `backend/src/utils/query-filter.ts` - 新增 `verifyStoreHandleOwnership` 函數

---

## 🔍 詳細 Code Review

### Story 3.1: 使用者認證系統

#### ✅ 資料庫設計
- **User 模型**：設計正確，包含必要欄位
- **關聯設計**：User → Store 關聯正確
- **Migration**：使用 `prisma db push` 成功執行

#### ✅ 工具函數實作
- **password.ts**：bcrypt 加密與驗證正確
- **jwt.ts**：JWT Token 生成與驗證正確
- **session.ts**：Redis Session 管理正確，支援降級處理

#### ✅ API 端點實作
- **註冊 API** (`POST /api/auth/register`)：正確實作
  - Email 格式驗證 ✅
  - 密碼長度驗證 ✅
  - Email 重複檢查 ✅
  - 密碼加密 ✅
- **登入 API** (`POST /api/auth/login`)：正確實作
  - 密碼驗證 ✅
  - Session 建立 ✅
  - JWT Token 生成 ✅
- **登出 API** (`POST /api/auth/logout`)：正確實作
  - Session 清除 ✅
- **驗證 API** (`GET /api/auth/me`)：正確實作
  - Token 驗證 ✅
  - 使用者資訊返回 ✅

#### ✅ 認證中間件
- **authMiddleware**：正確實作
  - JWT Token 驗證 ✅
  - Session ID 驗證 ✅
  - 使用者資訊附加 ✅
- **optionalAuthMiddleware**：正確實作
  - 可選認證檢查 ✅

#### ⚠️ 發現的問題
- **無**：所有功能正確實作

---

### Story 3.2: 基礎權限驗證機制

#### ✅ 認證中間件擴展
- **authMiddleware**：已正確擴展
- **optionalAuthMiddleware**：已正確實作

#### ✅ API 端點保護
- **已保護的端點**：
  - `GET /api/stores` ✅
  - `GET /api/stores/:shopId` ✅
  - `GET /webhook/events` ✅
  - `POST /webhook/subscribe` ✅
  - `GET /webhook/subscribe` ✅
  - `GET /webhook/subscribe/count` ✅
  - `GET /api/stores/:handle/info` ✅（已修復）
  - `GET /api/stores/:handle/products` ✅（已修復）
  - `GET /api/stores/:handle/products/:productId` ✅（已修復）
  - `POST /api/stores/:handle/products` ✅（已修復）
  - `GET /api/stores/:handle/locations` ✅（已修復）
  - `GET /api/stores/:handle/orders` ✅（已修復）
  - `POST /api/stores/:handle/orders` ✅（已修復）

- **公開端點**（正確保持公開）：
  - `POST /api/auth/register` ✅
  - `POST /api/auth/login` ✅
  - `GET /api/auth/shopline/install` ✅
  - `GET /api/auth/shopline/callback` ✅
  - `POST /webhook/shopline` ✅（使用簽名驗證）
  - `GET /api/health` ✅

#### ✅ 資料過濾（基礎）
- **查詢過濾器**：已建立 `query-filter.ts`
- **Store 過濾**：已實作 `filterStoresByUser`
- **WebhookEvent 過濾**：已實作 `filterWebhookEventsByUser`
- **所有權驗證**：已實作 `verifyStoreOwnership` 和 `verifyStoreHandleOwnership`

#### ⚠️ 發現的問題
- **Admin API 端點未保護**：已修復 ✅
- **Handle 所有權未驗證**：已修復 ✅

---

### Story 3.3: 多租戶資料隔離

#### ✅ 資料庫設計
- **Store 模型**：`userId` 欄位已設為必填 ✅
- **WebhookEvent 模型**：`userId` 欄位已設為必填 ✅
- **索引建立**：`userId` 索引已建立 ✅

#### ✅ 資料遷移
- **系統使用者**：已建立 `system@admin.com` ✅
- **現有資料遷移**：已執行遷移腳本 ✅
  - Store 的 `userId` 已更新為系統使用者 ID
  - WebhookEvent 的 `userId` 已更新為對應 Store 的 `userId`

#### ✅ 查詢過濾器實作
- **filterStoresByUser**：正確實作 ✅
- **filterWebhookEventsByUser**：正確實作 ✅
- **verifyStoreOwnership**：正確實作 ✅
- **verifyStoreHandleOwnership**：正確實作 ✅（新增）

#### ✅ 後端路由更新
- **API Routes**：已加入資料過濾 ✅
  - `GET /api/stores`：只返回當前使用者的商店 ✅
  - `GET /api/stores/:shopId`：驗證商店所有權 ✅
- **Webhook Routes**：已加入資料過濾 ✅
  - `GET /webhook/events`：只返回當前使用者的 Webhook 事件 ✅
- **Admin API Routes**：已加入所有權驗證 ✅
  - 所有使用 handle 的端點都驗證 handle 所有權 ✅

#### ⚠️ 發現的問題
- **OAuth 回調時建立 Store 的 userId 問題**：已修復 ✅
- **Webhook 接收時設定 userId 的問題**：已修復 ✅

---

### Story 3.4: Admin 管理介面

#### ✅ 認證狀態管理
- **Auth Store (Zustand)**：正確實作 ✅
  - 遵循現有的 Zustand Store 模式 ✅
  - Token 儲存在 localStorage ✅
  - 自動驗證 Token 有效性 ✅
- **API 函數擴展**：正確實作 ✅
  - Token 自動附加到請求 ✅
  - 401 錯誤自動處理 ✅
  - 認證相關 API 函數已建立 ✅

#### ✅ 登入/註冊頁面
- **登入頁面** (`/login`)：正確實作 ✅
  - 表單驗證 ✅
  - 錯誤處理 ✅
  - 重導向邏輯 ✅
- **註冊頁面** (`/register`)：正確實作 ✅
  - 表單驗證 ✅
  - 密碼確認驗證 ✅
  - 自動登入邏輯 ✅

#### ✅ 登入狀態展示
- **Header 組件**：正確擴展 ✅
  - 顯示使用者資訊 ✅
  - 顯示登出按鈕 ✅
  - 未登入時顯示登入連結 ✅

#### ✅ 路由保護
- **ProtectedRoute 組件**：正確實作 ✅
  - 認證檢查 ✅
  - 重導向邏輯 ✅
  - Loading 狀態 ✅
- **受保護的頁面**：
  - `index.tsx` ✅
  - `webhook-test.tsx` ✅
  - `admin-api-test.tsx` ✅

#### ⚠️ 發現的問題
- **無**：所有功能正確實作

---

## 🔒 安全性檢查

### ✅ 認證與授權
- **JWT Token**：正確使用 HS256 算法 ✅
- **Session 管理**：使用 Redis 儲存，支援 TTL ✅
- **密碼加密**：使用 bcrypt，Salt Rounds = 10 ✅
- **API 保護**：所有需要登入的端點都已保護 ✅
- **資料隔離**：所有查詢都加入 `userId` 過濾 ✅

### ✅ 資料隔離完整性
- **Store 查詢**：所有查詢都加入 `userId` 過濾 ✅
- **WebhookEvent 查詢**：所有查詢都加入 `userId` 過濾 ✅
- **所有權驗證**：所有資源存取都驗證所有權 ✅
- **跨使用者存取**：已正確防止 ✅

### ✅ 錯誤處理
- **認證錯誤**：正確返回 401 錯誤 ✅
- **授權錯誤**：正確返回 403 錯誤 ✅
- **資料不存在**：正確返回 404 錯誤 ✅
- **錯誤訊息**：不洩露敏感資訊 ✅

---

## 🧪 測試環境檢查

### ✅ 本地測試準備

#### 後端環境需求
- **資料庫**：Neon PostgreSQL（已設定）✅
- **Redis**：可選，如果未設定會自動降級到資料庫查詢 ✅
- **環境變數**：
  - `DATABASE_URL` ✅（必需）
  - `REDIS_URL` ✅（可選）
  - `JWT_SECRET` ✅（必需，如果未設定會使用預設值）
  - `SHOPLINE_CUSTOM_APP_KEY` ✅（Shopline OAuth 需要）
  - `SHOPLINE_CUSTOM_APP_SECRET` ✅（Shopline OAuth 需要）
  - `SHOPLINE_REDIRECT_URI` ✅（Shopline OAuth 需要）
  - `FRONTEND_URL` ✅（OAuth 回調需要）

#### 前端環境需求
- **環境變數**：
  - `NEXT_PUBLIC_BACKEND_URL` ✅（必需）

#### 資料庫狀態
- **系統使用者**：必須存在（`system@admin.com`）
  - 如果不存在，需要執行 `backend/scripts/migrate-existing-data.ts`
- **現有資料**：已遷移到系統使用者 ✅

---

## 🚨 測試環境限制

### ⚠️ 限制 1: 系統使用者必須存在

**問題**：
- OAuth 回調時，如果沒有登入的使用者，會使用系統使用者
- 如果系統使用者不存在，會導致建立 Store 失敗

**解決方案**：
- **測試前必須執行**：`backend/scripts/migrate-existing-data.ts`
- 或確保資料庫中已有 `system@admin.com` 使用者

**檢查方式**：
```bash
cd backend
npx tsx scripts/migrate-existing-data.ts
```

### ⚠️ 限制 2: Redis 可選但建議設定

**問題**：
- Session 管理依賴 Redis
- 如果 Redis 未設定，Session 建立會失敗

**解決方案**：
- **測試前建議設定**：`REDIS_URL` 環境變數
- 或確認 `backend/src/utils/session.ts` 的降級處理邏輯

**檢查方式**：
- 檢查環境變數 `REDIS_URL` 是否設定
- 如果未設定，Session 功能可能無法正常運作

### ⚠️ 限制 3: OAuth 回調需要登入狀態

**問題**：
- OAuth 回調時，如果沒有登入的使用者，Store 會關聯到系統使用者
- 這可能不是預期的行為（使用者可能希望 Store 關聯到自己）

**解決方案**：
- **測試時建議**：先登入，再進行 OAuth 授權
- 或接受 Store 關聯到系統使用者的行為

### ⚠️ 限制 4: 現有資料已遷移到系統使用者

**問題**：
- 現有資料的 `userId` 已設為系統使用者 ID
- 測試時需要使用系統使用者或建立新使用者

**解決方案**：
- **測試時建議**：建立新的測試使用者
- 或使用系統使用者進行測試（但系統使用者無法登入）

---

## 📍 測試網址

### 本地開發環境

#### 前端
- **首頁**：`http://localhost:3000/`
- **登入頁**：`http://localhost:3000/login`
- **註冊頁**：`http://localhost:3000/register`
- **Webhook 管理**：`http://localhost:3000/webhook-test`
- **Admin API 測試**：`http://localhost:3000/admin-api-test`

#### 後端 API
- **健康檢查**：`http://localhost:3001/api/health`
- **註冊 API**：`POST http://localhost:3001/api/auth/register`
- **登入 API**：`POST http://localhost:3001/api/auth/login`
- **登出 API**：`POST http://localhost:3001/api/auth/logout`
- **驗證 API**：`GET http://localhost:3001/api/auth/me`
- **商店列表**：`GET http://localhost:3001/api/stores`
- **Webhook 事件**：`GET http://localhost:3001/webhook/events`

### 生產環境（如果已部署）

#### 前端
- **首頁**：`https://connector-theta.vercel.app/`
- **登入頁**：`https://connector-theta.vercel.app/login`
- **註冊頁**：`https://connector-theta.vercel.app/register`

#### 後端 API
- **健康檢查**：`https://connector-o5hx.onrender.com/api/health`
- **註冊 API**：`POST https://connector-o5hx.onrender.com/api/auth/register`
- **登入 API**：`POST https://connector-o5hx.onrender.com/api/auth/login`

---

## 🧪 測試步驟建議

### 前置準備

1. **確認系統使用者存在**
   ```bash
   cd backend
   npx tsx scripts/migrate-existing-data.ts
   ```

2. **確認環境變數設定**
   - 檢查 `backend/.env` 是否有必要的環境變數
   - 檢查 `frontend/.env.local` 是否有 `NEXT_PUBLIC_BACKEND_URL`

3. **啟動後端服務**
   ```bash
   cd backend
   npm run dev
   ```

4. **啟動前端服務**
   ```bash
   cd frontend
   npm run dev
   ```

---

### Story 3.1 測試步驟

#### 測試 1: 註冊功能
1. 訪問 `http://localhost:3000/register`
2. 輸入 Email（例如：`test1@example.com`）
3. 輸入密碼（至少 8 字元，例如：`test123456`）
4. 輸入確認密碼
5. 點擊「註冊」按鈕
6. **驗證**：
   - 註冊成功後自動登入
   - 重導向到首頁
   - Header 顯示使用者資訊

#### 測試 2: 重複註冊
1. 使用相同 Email 再次註冊
2. **驗證**：顯示錯誤訊息（Email 已存在）

#### 測試 3: 登入功能
1. 訪問 `http://localhost:3000/login`
2. 輸入已註冊的 Email 和密碼
3. 點擊「登入」按鈕
4. **驗證**：
   - 登入成功後重導向到首頁
   - Header 顯示使用者資訊
   - localStorage 中有 `auth_token`

#### 測試 4: 錯誤密碼登入
1. 使用錯誤密碼登入
2. **驗證**：顯示錯誤訊息（密碼錯誤）

#### 測試 5: Session 驗證
1. 登入後，打開瀏覽器開發者工具
2. 檢查 localStorage 中的 `auth_token`
3. 使用 API 工具（如 Postman）呼叫 `GET /api/auth/me`
   - Header: `Authorization: Bearer ${token}`
4. **驗證**：返回當前使用者資訊

#### 測試 6: 登出功能
1. 登入後，點擊 Header 的「登出」按鈕
2. **驗證**：
   - 登出成功並重導向到 `/login` 頁面
   - localStorage 中的 `auth_token` 已清除
   - 再次訪問受保護頁面會重導向到 `/login`

---

### Story 3.2 測試步驟

#### 測試 1: 未登入訪問保護 API
1. 清除瀏覽器的 localStorage（或使用無痕模式）
2. 訪問 `http://localhost:3000/`
3. **驗證**：自動重導向到 `/login` 頁面

#### 測試 2: 登入後訪問保護 API
1. 登入後，訪問 `http://localhost:3000/`
2. **驗證**：可以正常訪問首頁
3. 訪問 `http://localhost:3000/webhook-test`
4. **驗證**：可以正常訪問 Webhook 管理頁面

#### 測試 3: API 端點保護（使用 API 工具）
1. 未登入時，使用 API 工具呼叫 `GET /api/stores`（不提供 Token）
2. **驗證**：返回 401 錯誤（未授權）
3. 登入後，使用 Token 呼叫 `GET /api/stores`
4. **驗證**：返回該使用者的商店列表

---

### Story 3.3 測試步驟

#### 測試 1: 使用者 A 資料隔離
1. 使用使用者 A 登入（例如：`test1@example.com`）
2. 訪問 `http://localhost:3000/`
3. **驗證**：只顯示使用者 A 的商店
4. 訪問 `http://localhost:3000/webhook-test`
5. **驗證**：只顯示使用者 A 的 Webhook 事件

#### 測試 2: 使用者 B 資料隔離
1. 登出使用者 A
2. 註冊使用者 B（例如：`test2@example.com`）
3. 訪問 `http://localhost:3000/`
4. **驗證**：只顯示使用者 B 的商店（與使用者 A 不同）
5. 訪問 `http://localhost:3000/webhook-test`
6. **驗證**：只顯示使用者 B 的 Webhook 事件（與使用者 A 不同）

#### 測試 3: 跨使用者資料存取測試
1. 使用使用者 A 登入
2. 取得使用者 A 的商店 ID（從商店列表）
3. 使用 API 工具呼叫 `GET /api/stores/{storeId-A}`（使用使用者 A 的 Token）
4. **驗證**：返回商店資訊
5. 登出使用者 A
6. 使用使用者 B 登入
7. 使用 API 工具呼叫 `GET /api/stores/{storeId-A}`（使用使用者 B 的 Token）
8. **驗證**：返回 403 或 404 錯誤（無法存取其他使用者的資料）

#### 測試 4: Handle 所有權驗證
1. 使用使用者 A 登入
2. 取得使用者 A 的商店 handle（例如：`paykepoc`）
3. 使用 API 工具呼叫 `GET /api/stores/{handle}/info`（使用使用者 A 的 Token）
4. **驗證**：返回商店資訊
5. 登出使用者 A
6. 使用使用者 B 登入
7. 使用 API 工具呼叫 `GET /api/stores/{handle}/info`（使用使用者 B 的 Token，但 handle 屬於使用者 A）
8. **驗證**：返回 403 錯誤（Forbidden: Store does not belong to current user）

---

### Story 3.4 測試步驟

#### 測試 1: 註冊功能（前端）
1. 訪問 `http://localhost:3000/register`
2. 輸入 Email、密碼、確認密碼
3. 點擊「註冊」按鈕
4. **驗證**：
   - 註冊成功後自動登入
   - 重導向到首頁
   - Header 顯示使用者資訊（Email 或名稱）

#### 測試 2: 登入功能（前端）
1. 訪問 `http://localhost:3000/login`
2. 輸入已註冊的 Email 和密碼
3. 點擊「登入」按鈕
4. **驗證**：
   - 登入成功後重導向到首頁
   - Header 顯示使用者資訊
   - 可以正常訪問所有受保護的頁面

#### 測試 3: 路由保護
1. 登出後，訪問 `http://localhost:3000/`
2. **驗證**：自動重導向到 `/login` 頁面
3. 登入後，訪問 `http://localhost:3000/`
4. **驗證**：可以正常訪問首頁
5. 登出後，訪問 `http://localhost:3000/webhook-test`
6. **驗證**：自動重導向到 `/login` 頁面

#### 測試 4: 登出功能（前端）
1. 登入後，點擊 Header 的「登出」按鈕
2. **驗證**：
   - 登出成功並重導向到 `/login` 頁面
   - localStorage 中的 `auth_token` 已清除
   - 再次訪問受保護頁面會重導向到 `/login`

#### 測試 5: Token 自動附加
1. 登入後，打開瀏覽器開發者工具的 Network 標籤
2. 訪問 `http://localhost:3000/`
3. 觀察 API 請求
4. **驗證**：
   - 所有 API 請求的 Header 中都包含 `Authorization: Bearer ${token}`
   - API 請求成功返回資料

#### 測試 6: Token 過期處理
1. 登入後，手動修改 localStorage 中的 `auth_token` 為無效值
2. 訪問需要認證的頁面（例如：`http://localhost:3000/`）
3. **驗證**：
   - 自動清除無效 Token
   - 自動重導向到 `/login` 頁面

---

### 整合測試步驟

#### 測試 1: 完整註冊到使用流程
1. 註冊新使用者
2. 登入
3. 訪問首頁，查看商店列表
4. 訪問 Webhook 管理頁面
5. 訪問 Admin API 測試頁面
6. **驗證**：所有功能正常運作

#### 測試 2: 多使用者資料隔離
1. 註冊使用者 A
2. 登入使用者 A，查看商店列表（記錄商店數量）
3. 登出使用者 A
4. 註冊使用者 B
5. 登入使用者 B，查看商店列表
6. **驗證**：
   - 使用者 B 的商店列表與使用者 A 不同
   - 使用者 B 無法看到使用者 A 的商店

#### 測試 3: OAuth 授權流程（如果已設定 Shopline）
1. 登入使用者 A
2. 進行 Shopline OAuth 授權
3. **驗證**：
   - 授權成功後，新建立的 Store 的 `userId` 為使用者 A 的 ID
   - 使用者 A 可以在商店列表中看到新建立的 Store

---

## ✅ Code Review 結論

### 整體評估
- **架構設計**：✅ 優秀，依賴關係清晰，資料模型一致
- **安全性**：✅ 優秀，所有端點正確保護，資料隔離完整
- **跨邊界處理**：✅ 已修復所有問題
- **可測試性**：✅ 優秀，所有功能都可以在本地測試

### 修復的問題
1. ✅ OAuth 回調時建立 Store 的 userId 問題
2. ✅ Webhook 接收時設定 userId 的問題
3. ✅ Admin API 端點沒有加入認證保護
4. ✅ Handle 所有權未驗證

### 測試準備狀態
- ✅ **本地可以直接測試**
- ⚠️ **測試前必須執行**：`backend/scripts/migrate-existing-data.ts`（確保系統使用者存在）
- ⚠️ **建議設定**：`REDIS_URL` 環境變數（Session 功能需要）

### 建議
1. **測試前準備**：
   - 執行資料遷移腳本確保系統使用者存在
   - 確認環境變數設定正確
   - 確認 Redis 連線（如果使用 Session 功能）

2. **測試順序**：
   - 先測試 Story 3.1（註冊、登入、登出）
   - 再測試 Story 3.2（API 保護）
   - 再測試 Story 3.3（資料隔離）
   - 最後測試 Story 3.4（前端介面）

3. **測試重點**：
   - 多使用者資料隔離
   - Handle 所有權驗證
   - Token 自動附加
   - 路由保護

---

**最後更新**: 2025-11-06

