# Next Engine 整合後發現的問題

**建立日期**: 2025-11-12  
**相關 Run**: run-2025-11-12-02  
**相關 Stories**: Story 5.1, 5.2, 5.3

---

## 📋 問題摘要

在完成 Next Engine OAuth 授權、Connection 建立和前端整合後，發現以下問題需要後續處理：

1. **Story 遺漏**：Webhook、Event、API 測試頁面未跟隨 Context Bar
2. **Token 到期時間顯示問題**：需要確認 Next Engine 的 token 到期時間正確取得和顯示
3. **設計問題**：Next Engine Store 建立邏輯需要討論

---

## 🚨 問題詳述

### 1. Webhook、Event、API 測試頁面未跟隨 Context Bar

**問題描述**：
- `webhook-test.tsx`、`admin-api-test.tsx`、`events.tsx` 三個頁面都顯示「商店選擇」而非「連線選擇」
- 這些頁面沒有跟隨 Context Bar 所選的 `connectionId` 進行操作
- 目前不管怎麼選，都是當作 Shopline 在處理，沒有因應 `platform` 做異動

**影響範圍**：
- 無法接續處理 Next Engine 平台授權後的行為（webhook、API 測試、事件查看）
- 使用者體驗不一致（Connection Dashboard 用 Connection，其他頁面用 Store）
- 無法測試 Next Engine 的 API 功能

**需要修正的檔案**：
- `frontend/pages/webhook-test.tsx`
- `frontend/pages/admin-api-test.tsx`
- `frontend/pages/events.tsx`

**修正方向**：
1. 將「商店選擇」改為「連線選擇」
2. 讓這些頁面跟隨 `useConnectionStore` 的 `selectedConnectionId`
3. 根據 `selectedConnection.platform` 動態調整 API 端點和邏輯
4. 移除獨立的 store selection 邏輯，改用 Context Bar 的 connection selection

**相關檔案**：
- `frontend/stores/useConnectionStore.ts` - Connection 狀態管理
- `frontend/components/context/ContextBar.tsx` - Context Bar 顯示

---

### 2. Token 到期時間顯示問題

**問題描述**：
- Shopline 和 Next Engine 的 token 到期時間取法不同
- Next Engine 使用 `expiresAt`（ISO 8601 格式）
- Shopline 使用 `expires_at`（可能是其他格式）
- 目前 `ConnectionSummaryCard` 有處理兩種格式，但需要確認 Next Engine 的 token 到期時間是否正確從後端取得

**後端實作檢查**：
- ✅ `POST /api/auth/next-engine/complete` 有正確儲存 `expiresAt` 到 `authPayload`（見 `backend/src/routes/api.ts:874`）
- ✅ `NextEngineAdapter.parseDateTime()` 已修正，避免 `undefined.split()` 錯誤
- ⚠️ 需要確認 Next Engine API 回傳的 `access_token_end_date` 格式是否正確解析

**前端實作檢查**：
- ✅ `ConnectionSummaryCard` 有處理 `expiresAt` 和 `expires_at` 兩種格式（見 `frontend/components/connections/ConnectionSummaryCard.tsx:29-34`）
- ⚠️ 需要確認實際顯示的 token 到期時間是否正確

**需要驗證**：
1. Next Engine API 回傳的 `access_token_end_date` 格式（應該是 "YYYY-MM-DD HH:mm:ss"）
2. `parseDateTime` 方法是否正確解析並轉換為 ISO 8601 格式
3. 前端 `ConnectionSummaryCard` 是否正確顯示 token 到期時間

**相關檔案**：
- `backend/src/services/nextEngine.ts` - `parseDateTime` 方法
- `backend/src/routes/api.ts` - `POST /api/auth/next-engine/complete`
- `frontend/components/connections/ConnectionSummaryCard.tsx` - Token 到期時間顯示

---

### 3. Next Engine Store 建立邏輯

**問題描述**：
- Next Engine 的 store（店舖）可以用 API 去 create（`api_v1_master_shop/create`）
- 每增加一個 store，Connection Item 就會增加一個
- 這可能導致邏輯問題：使用者透過 API 建立 store 後，Connection Item 應該如何同步？

**目前實作**：
- Connection Item 在 OAuth 授權完成時，會同步 Next Engine 的現有店舖（見 `backend/src/routes/api.ts:889-929`）
- 使用 `adapter.getShops()` 取得店舖列表
- 避免重複建立（檢查 `existingShopIds`）

**需要討論的問題**：
1. **自動同步機制**：
   - Connection Item 是否應該自動同步 Next Engine 的 store 變更？
   - 是否需要定期輪詢 Next Engine API 來檢查新的 store？
   - 或者只在重新授權時同步？

2. **手動同步機制**：
   - 是否需要提供手動同步按鈕，讓使用者可以主動同步 store？
   - 同步時機：授權完成時、重新授權時、手動觸發時？

3. **Store 建立後處理**：
   - 使用者透過 Next Engine API 建立 store 後，Connection Item 應該如何處理？
   - 是否需要 webhook 或事件通知機制？
   - 或者需要使用者手動觸發同步？

**相關檔案**：
- `backend/src/routes/api.ts` - `POST /api/auth/next-engine/complete`（店舖同步邏輯）
- `backend/src/services/nextEngine.ts` - `getShops()` 方法
- `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md` - Store API 文件

---

## 📝 後續行動

### 優先級 1（阻擋 Next Engine 功能）
- [ ] 修正 Webhook、Event、API 測試頁面，讓它們跟隨 Context Bar 的 connection selection
- [ ] 根據 platform 動態調整 API 端點和邏輯

### 優先級 2（影響使用者體驗）
- [ ] 驗證 Token 到期時間顯示是否正確
- [ ] 確認 Next Engine API 回傳的日期時間格式

### 優先級 3（設計討論）
- [ ] 討論 Next Engine Store 建立邏輯和同步機制
- [ ] 決定是否需要手動同步按鈕或自動同步機制

---

## 🔗 相關文件

- [Story 5.1: Next Engine OAuth Flow](../stories/story-5-1-next-engine-oauth.md)
- [Story 5.2: Next Engine Connection Item](../stories/story-5-2-next-engine-connection-data.md)
- [Story 5.3: 前端 Connection UX](../stories/story-5-3-next-engine-ux.md)
- [Next Engine API 參考文件](../../reference/platform-apis/NEXTENGINE_API_REFERENCE.md)
- [Next Engine OAuth 指南](../../reference/guides/NEXT_ENGINE_OAUTH_GUIDE.md)

