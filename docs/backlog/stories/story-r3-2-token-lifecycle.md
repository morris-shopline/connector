# Story R3.2: Token Lifecycle 與重新授權流程

**所屬 Refactor**: [Refactor 3: Connection 基礎重構（Phase 1.2 前置）](../refactors/refactor-3-connection-foundation.md)  
**狀態**: ⏳ planned  
**建立日期**: 2025-11-07  
**相關 Issue**: [Issue 2025-11-07-001](../issues/issue-2025-11-07-001.md)  
**相關決策**: 
- `docs/memory/decisions/token-lifecycle-handling.md`

---

## 前情提要

- Token 過期會誤判為登入失效，導致全域登出。
- 進入多 Connection 階段後，需清楚區分 Session 錯誤與 Connection 錯誤。
- 決策已規範後端錯誤碼與前端提示流程。

---

## Story 描述

重構 Token Lifecycle 流程，先以 Shopline Connection 為範例完成：

1. 後端標準化錯誤碼，區分 Token 與 Session。
2. 前端攔截器根據錯誤碼顯示提示並引導重新授權。
3. Connection List UI 顯示 Token 狀態，提供重新授權入口。
4. 記錄錯誤與事件，為後續監控做準備。

---

## 實作項目

1. **後端 Adapter 與 Middleware**
   - Shopline Adapter 捕捉 API 錯誤並轉為標準碼：`TOKEN_EXPIRED`, `TOKEN_REVOKED`, `TOKEN_SCOPE_MISMATCH`, `SESSION_EXPIRED`
   - 建立 `handlePlatformError()` 共用函式
   - 更新 `/api/*` 路由回傳格式

2. **前端錯誤處理**
   - 更新 fetch wrapper / SWR：攔截上述錯誤碼
   - 顯示提示（toast 或 modal），提供「重新授權」按鈕
   - 重新授權完成後自動刷新 Connection 狀態

3. **Connection List UI**
   - 以新的 Connection 命名呈現（取代商店卡片）
   - 顯示 Token 狀態徽章（Active / Expired / Error）
   - Refresh 按鈕可放在卡片操作菜單或 detail modal

4. **測試與紀錄**
   - 單元測試：錯誤碼轉換、前端攔截器
   - E2E：模擬後端回 `TOKEN_EXPIRED` → 不被登出，可完成重新授權
   - Log：於後端記錄錯誤，方便監控（暫存於 logger，後續可擴充為 metrics）

---

## 驗收標準

- [ ] Issue 2025-11-07-001 標記為 resolved
- [ ] 後端 API 回傳結構符合決策文件
- [ ] 前端提示與重新授權流程覆蓋 `TOKEN_EXPIRED`/`TOKEN_REVOKED`/`TOKEN_SCOPE_MISMATCH`
- [ ] 重新授權成功後，Connection List 顯示最新狀態且不需要重新登入
- [ ] 撰寫測試紀錄，包含如何模擬過期情境

---

## 風險與備註

- 需要與產品確認提示文案與 UX（toast / modal）
- 若 Shopline 提供 refresh token，需確認 refresh 失敗的處理策略
- 後續導入 Next Engine 時，需在 Run B 補上對應錯誤碼映射

---

**最後更新**: 2025-11-07


