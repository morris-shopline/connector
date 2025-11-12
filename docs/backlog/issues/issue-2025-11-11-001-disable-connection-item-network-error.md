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

- [ ] 檢查 Network 標籤中的完整錯誤訊息
- [ ] 檢查後端 CORS 設定
- [ ] 檢查 API 請求格式
- [ ] 檢查後端日誌
- [ ] 確認 Render 服務狀態

---

## 備註

此問題在 Story 4.3 完成後發現，需要後續調查並修復。

