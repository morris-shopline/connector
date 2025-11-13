# Issue: 停用 Connection Item 時出現 Network Error

**建立日期**: 2025-11-11  
**狀態**: 🔍 待調查  
**優先級**: 中  
**相關 Story**: Story 4.3

---

## 問題描述

在 Connection Items 頁面點擊「停用」按鈕時，出現 Network Error。

### 觀察到的現象

- 前端顯示 "Network Error" banner
- Network 標籤顯示請求狀態為 "COR..."（可能是 CORS 錯誤）
- 請求類型：xhr
- 請求時間：180 ms
- 請求大小：0.0 kB

### 可能原因

1. **CORS 設定問題**
   - 後端 CORS 設定可能不允許該請求
   - 請求方法或 headers 可能不符合 CORS 政策

2. **API 端點問題**
   - `/api/connection-items/:id` 端點可能有問題
   - 請求格式可能不正確

3. **認證問題**
   - Token 可能過期或無效
   - Session 可能失效

4. **後端服務問題**
   - Render 服務可能冷啟動中
   - 後端可能返回錯誤但前端無法正確處理

---

## 重現步驟

1. 登入系統
2. 進入 Connection 管理頁面
3. 選擇一個 Connection
4. 切換到 "Connection Items" 標籤
5. 點擊某個 Connection Item 的「停用」按鈕
6. 觀察 Network 標籤和錯誤訊息

---

## 預期行為

- 點擊「停用」後，Connection Item 狀態應更新為 "disabled"
- 應顯示成功 Toast 訊息
- Activity Dock 應顯示停用記錄

---

## 實際行為

- 出現 Network Error
- Connection Item 狀態未更新
- 無成功訊息

---

## 相關檔案

- `frontend/components/connections/ConnectionItemsTable.tsx` - 停用按鈕處理邏輯
- `backend/src/routes/api.ts` - `/api/connection-items/:id` 端點
- `frontend/lib/api.ts` - API 客戶端設定

---

## 待調查項目

- [x] 檢查 Network 標籤中的完整錯誤訊息
- [x] 檢查後端 CORS 設定
- [x] 檢查 API 請求格式
- [x] 檢查後端日誌
- [x] 確認 Render 服務狀態

---

## 🔍 問題分析

### 觀察到的現象

- 前端顯示 "Network Error" banner
- Network 標籤顯示請求狀態為 "COR..."（可能是 CORS 錯誤）
- Connection Item 狀態未更新
- 無成功訊息

### 程式碼檢查發現

在 `backend/src/routes/api.ts` 第 239-254 行，`PATCH /api/connection-items/:id` 端點的 middleware 鏈中：

```typescript
preHandler: [authMiddleware, async (request, reply) => {
  const itemId = (request.params as any).id
  const item = await connectionRepository.findConnectionItemById(itemId)
  if (!item) {
    return reply.status(404).send({...})
  }
  ;(request.params as any).connectionId = item.integrationAccountId
  return requireConnectionOwner(request as any, reply)  // ⚠️ 沒有 await
}]
```

**發現的問題**：
- `requireConnectionOwner` 是一個 `async` 函數，但在 middleware 中**沒有使用 `await`**
- 如果 `requireConnectionOwner` 內部拋出異常，這個 Promise rejection **不會被捕捉**

### ⚠️ 待釐清的問題

**關鍵問題：是錯誤處理問題，還是前面真的出錯了？**

#### 需要確認 1：實際錯誤是什麼？

- [ ] 查看後端日誌，確認是否有 Prisma 錯誤或資料庫連線錯誤
- [ ] 確認錯誤是偶發還是每次都發生
- [ ] 檢查 Network 標籤中的完整錯誤訊息（不只是 "COR..."）

#### 需要確認 2：資料是否一致？

- [ ] 檢查資料庫中 `connection_items` 的 `integrationAccountId` 是否都有值
- [ ] 檢查對應的 `integration_accounts` 是否存在
- [ ] 確認 `item.integrationAccountId` 指向的 Connection 是否屬於當前使用者

#### 需要確認 3：是否為設計問題？

- [ ] 如果每次都失敗 → 可能是設計問題（資料不一致、邏輯錯誤）
- [ ] 如果偶爾失敗 → 可能是基礎設施問題（資料庫連線）

### 可能的錯誤原因（待驗證）

1. **資料庫查詢失敗**（偶發）
   - Prisma 查詢失敗（連線問題、超時、鎖定）
   - 因為沒有 `await`，異常變成未處理的 Promise rejection

2. **資料不一致**（設計問題）
   - `item.integrationAccountId` 為 `null` 或 `undefined`
   - `item.integrationAccountId` 指向的 Connection 不存在
   - `item.integrationAccountId` 指向的 Connection 屬於其他使用者

3. **錯誤處理問題**（實作問題）
   - 缺少 `await` 導致未處理的 Promise rejection
   - Fastify 無法正確回應，瀏覽器顯示 CORS 錯誤

---

## 📋 下一步行動

### 必須先收集的資訊

**目標：讓停用功能真的 work！**

在給出解方之前，必須先確認：

1. **實際錯誤是什麼？**
   - [ ] 查看後端日誌（Render Dashboard 或本地日誌）
   - [ ] 確認是否有 Prisma 錯誤、資料庫連線錯誤
   - [ ] 記錄完整的錯誤訊息和堆疊

2. **資料是否一致？**
   - [ ] 檢查資料庫中 `connection_items` 的 `integrationAccountId` 是否都有值
   - [ ] 檢查對應的 `integration_accounts` 是否存在
   - [ ] 確認 `item.integrationAccountId` 指向的 Connection 是否屬於當前使用者

3. **錯誤是偶發還是必然？**
   - [ ] 測試多次，確認是否每次都失敗
   - [ ] 如果是偶發，可能是基礎設施問題（資料庫連線）
   - [ ] 如果必然，可能是設計問題（資料不一致、邏輯錯誤）

### 待確認後才能決定

- **如果是錯誤處理問題**：修復 middleware 的 `await` 和錯誤處理
- **如果是資料不一致**：修復資料或資料遷移邏輯
- **如果是設計問題**：重新設計相關邏輯

**重點：先釐清問題，再給解方！不要浪費時間在錯誤的方向上！**

---

## 📝 相關檔案

- `backend/src/routes/api.ts` (第 239-254 行) - 需要修復的端點
- `backend/src/middleware/requireConnectionOwner.ts` - 相關 middleware
- `backend/src/repositories/connectionRepository.ts` - 資料庫查詢方法

---

## 備註

此問題在 Story 4.3 完成後發現，需要後續調查並修復。

**調查狀態**：🔍 待進一步調查  
**調查完成日期**：2025-11-12  
**問題類型**：待確認（可能是實作問題、資料問題或設計問題）  
**優先級**：高（影響使用者體驗，停用功能無法運作）

---

## 📝 調查記錄

### 2025-11-12 初步分析

- 發現 middleware 中缺少 `await`（第 253 行）
- 但無法確認是錯誤處理問題還是前面真的出錯
- 需要收集實際錯誤訊息和資料庫狀態才能進一步判斷

### 待收集資訊

- [ ] 後端日誌中的實際錯誤訊息
- [ ] 資料庫資料一致性檢查結果
- [ ] 錯誤發生頻率（偶發 vs 必然）

