# Token Lifecycle 最小處理決策

**決策日期**: 2025-11-07  
**狀態**: ✅ 已決策

---

## 決策結論

短期內（Run A）針對 Shopline Connection 完成下列事項：

1. 後端標準化 OAuth token 錯誤碼（`TOKEN_EXPIRED`, `TOKEN_REVOKED`, `TOKEN_SCOPE_MISMATCH`）與 Session 錯誤（`SESSION_EXPIRED`）。
2. 前端統一處理邏輯：保留登入狀態，透過提示引導重新授權 Connection。
3. 重新授權流程使用既有 OAuth 流程，完成後刷新 Connection 狀態，不額外強制登出。

---

## 決策內容

### 後端

- 建立錯誤分類中介層：
  - `TOKEN_EXPIRED`：Access token 過期，可嘗試 refresh 或引導重新授權。
  - `TOKEN_REVOKED`：平台已撤銷授權，必須重新授權。
  - `TOKEN_SCOPE_MISMATCH`：授權 scope 不符，提示修正授權。
  - `SESSION_EXPIRED`：登入 Session 無效，需重新登入。
- API 回應格式：
  ```json
  {
    "success": false,
    "code": "TOKEN_EXPIRED",
    "message": "Shopline token 已過期",
    "connectionId": "conn_123"
  }
  ```
- 記錄錯誤：透過 logger/metrics 記錄錯誤類型與 Connection Id，方便後續監控。

### 前端

- 統一錯誤攔截器：
  - `TOKEN_*` → 顯示提示（modal/toast）+ 提供「重新授權」按鈕。
  - `SESSION_EXPIRED` → 觸發登出流程。
- 重新授權行為：
  - 跳轉至對應平台的 OAuth URL（依 Connection `platform` 取得）。
  - 完成後回到原頁面，自動刷新 Connection 清單並顯示成功訊息。
- Connection List UI：
  - 顯示 Token 狀態徽章（Active / Expired / Error）。
  - 未來可在 Detail Page 提供更多操作，但 Run A 先完成基礎提示與流程。

### 測試

- 單元測試：模擬不同錯誤碼，驗證攔截器與提示邏輯。
- E2E 測試：
  - 模擬後端回傳 `TOKEN_EXPIRED`，確保不會被登出，並能啟動重新授權流程。
  - 檢查重新授權後 Connection 狀態更新。

---

## 關鍵理由

1. **避免誤登出**：解決 Issue 2025-11-07-001，保持 Admin 登入狀態。
2. **提供一致 UX**：所有平台的 Token 問題皆透過同一流程處理，未來加入 Next Engine 時只需補對應錯誤碼。
3. **為長期治理打基礎**：錯誤分類與記錄為日後建置監控/告警準備資料。

---

## 待辦與依賴

- Refactor 3 Story R3.2 將依此決策實作後端錯誤碼與前端流程。
- Epic 4 Story 4.5 將在 Refactor 完成後擴充為多平台版本。

---

## 相關文件

- 討論紀錄：`docs/archive/discussions/discussion-2025-11-07-multi-store-architecture.md`
- Issue：`docs/backlog/issues/issue-2025-11-07-001.md`
- Platform 指南：`docs/reference/guides/NE-OVERVIEW.md`

---

**最後更新**: 2025-11-07


