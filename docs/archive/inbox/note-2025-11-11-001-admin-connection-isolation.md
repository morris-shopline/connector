# Note: Admin x Connection 資料隔離與綁定策略

**建立日期**: 2025-11-11  
**狀態**: 🔍 待討論  
**優先級**: 高

---

## 問題描述

### 發現的問題

1. **Activity Dock 資料隔離問題**
   - ❌ 原本實作：`/api/audit-logs` 返回所有 admin 的審計記錄
   - ✅ 已修正：改為只返回當前登入 admin 的審計記錄

2. **Connection 綁定策略不明確**
   - 目前設計：不同 admin 可以綁定同一個平台帳戶（例如：Shopline handle "store1"）
   - 資料庫處理：會產生不同的 Connection（不同的 connectionId）
   - 問題：這是否符合業務需求？是否需要防止重複綁定？

### 當前實作狀況

**資料庫設計**：
- `integration_accounts` 表的唯一鍵：`userId_platform_externalAccountId`
- 這意味著：`(userId=A, platform=shopline, externalAccountId=store1)` 和 `(userId=B, platform=shopline, externalAccountId=store1)` 可以同時存在
- 會產生兩個不同的 Connection，各自有不同的 connectionId

**Connection 建立流程**：
- OAuth callback 中直接呼叫 `upsertConnection`
- 沒有檢查該 `platform + externalAccountId` 是否已被其他 admin 綁定
- 如果已存在，會建立新的 Connection（因為 userId 不同）

---

## 需要討論的問題

### 1. 業務邏輯問題

**問題 A：是否允許多個 admin 綁定同一個平台帳戶？**

**選項 1：允許（當前實作）**
- ✅ 優點：靈活，不同 admin 可以管理同一個商店
- ❌ 缺點：可能造成混淆，資料重複

**選項 2：不允許（需要檢查）**
- ✅ 優點：資料清晰，避免混淆
- ❌ 缺點：需要實作檢查邏輯，可能影響使用體驗

**選項 3：允許但需要特殊權限**
- ✅ 優點：平衡靈活性與安全性
- ❌ 缺點：需要實作權限系統

### 2. 技術實作問題

**如果選擇「不允許」：**
- 在 OAuth callback 中，需要先檢查：
  ```typescript
  const existingConnection = await prisma.integrationAccount.findFirst({
    where: {
      platform: 'shopline',
      externalAccountId: handle,
      // 不限制 userId，檢查是否有任何 admin 已綁定
    }
  })
  
  if (existingConnection && existingConnection.userId !== currentUserId) {
    // 已被其他 admin 綁定，拒絕或提示
  }
  ```
- 需要決定錯誤處理方式：
  - 直接拒絕並顯示錯誤訊息？
  - 提示使用者該帳戶已被綁定，詢問是否要轉移？

**如果選擇「允許」：**
- 需要考慮：
  - 如何區分不同 admin 的 Connection？
  - 是否需要顯示「此帳戶已被其他 admin 綁定」的提示？
  - Webhook 事件如何路由到正確的 admin？

### 3. Webhook 路由問題

**當前實作**：
- Webhook 根據 `shoplineId` 找到 `ConnectionItem`
- `ConnectionItem` 關聯到 `Connection`
- `Connection` 有 `userId`

**問題**：
- 如果多個 admin 綁定了同一個商店，Webhook 會路由到哪個 admin？
- 目前實作會找到第一個匹配的 `ConnectionItem`，可能不是預期的 admin

---

## 建議的處理方式

### 階段 1：立即處理（已完成）
- ✅ Activity Dock 只顯示當前 admin 的審計記錄
- ✅ 確保所有 API 都正確過濾 userId

### 階段 2：短期處理（待討論）
- 🔍 決定 Connection 綁定策略（允許/不允許多 admin 綁定）
- 🔍 如果需要防止重複綁定，實作檢查邏輯
- 🔍 如果需要允許，實作 UI 提示機制

### 階段 3：長期處理（待規劃）
- 🔍 實作 Connection 轉移機制（如果需要）
- 🔍 實作 Connection 共享機制（如果需要）
- 🔍 實作權限系統（Owner / Admin / Operator）

---

## 相關文件

- `backend/src/repositories/connectionRepository.ts` - Connection 建立邏輯
- `backend/src/routes/auth.ts` - OAuth callback 處理
- `backend/prisma/schema.prisma` - 資料庫 schema（`integration_accounts` 唯一鍵定義）

---

## 待確認事項

- [ ] 業務需求：是否允許多個 admin 綁定同一個平台帳戶？
- [ ] 如果允許：需要什麼 UI/UX 機制來避免混淆？
- [ ] 如果不允許：錯誤處理方式（拒絕/轉移/提示）？
- [ ] Webhook 路由策略：如何確保事件路由到正確的 admin？
- [ ] 是否需要 Connection 轉移功能？

---

---

## 後續待處理項目（Run 2025-11-12-01 完成後）

### 🔍 需要討論的（架構面設計，需要做成新的 decision）

1. **Admin x Connection 綁定策略**
   - 是否允許多個 admin 綁定同一個平台帳戶？
   - 如果允許：需要什麼 UI/UX 機制？
   - 如果不允許：錯誤處理方式（拒絕/轉移/提示）？
   - Webhook 路由策略：如何確保事件路由到正確的 admin？
   - 是否需要 Connection 轉移功能？
   - **相關文件**: `docs/archive/inbox/note-2025-11-11-001-admin-connection-isolation.md`

2. **Connection 管理 API 設計**
   - `GET /api/connections/:connectionId` - 是否需要？
   - `PATCH /api/connections/:connectionId` - 是否需要？
   - Connection 是否應該允許手動編輯（目前是自動管理）？

### 📋 後續要其他 Story 處理的

1. **前端錯誤處理完善**（建議：Story 4.4 或 UI/UX 優化 Story）
   - 處理 `CONNECTION_FORBIDDEN` 錯誤碼
   - 處理 `AUTHENTICATION_REQUIRED` 錯誤碼
   - 處理 `PLATFORM_MISMATCH` 錯誤碼
   - 顯示適當的 Toast 訊息和錯誤提示

2. **Context Bar 橘色 Banner**（建議：Story 4.4 或 UI/UX 優化 Story）
   - 實作未授權錯誤時的橘色 Banner
   - 鎖定操作按鈕的機制
   - **Story 需求**: Story 4.3 中有提到但未實作

3. **測試覆蓋**（建議：獨立的測試 Story）
   - 後端 e2e 測試：
     - 未登入呼叫 `/api/connections` → 401
     - 登入但非擁有者呼叫 `/api/connections/:id` → 403
     - 登入後新增 Connection → 審計紀錄寫入
     - Webhook 呼叫使用不同 userId → 驗證被拒
   - 前端 Cypress 測試（如果有）：
     - 未授權使用者看到限制提示
     - Activity Dock 顯示審計紀錄

4. **文件更新**（建議：文件維護 Story）
   - 更新 `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`：補充需登入與審計流程
   - 更新 `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`：在 Activity Dock / Security 章節標註已落地

### 🐛 後續要解的 Issue

1. **停用 Connection Item 時出現 Network Error**
   - **Issue**: `docs/archive/inbox/issue-2025-11-11-001-disable-connection-item-network-error.md`
   - **狀態**: 🔍 待調查
   - **優先級**: 中
   - **問題**: 點擊「停用」按鈕時出現 Network Error（可能是 CORS 問題）
   - **需要調查**: Network 標籤中的完整錯誤訊息、後端 CORS 設定、API 請求格式

---

## 備註

此問題需要在 Phase 1.2 完成後，Phase 1.3 或 Phase 2 之前討論並決定處理策略。

