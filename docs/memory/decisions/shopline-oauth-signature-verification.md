# Shopline OAuth 簽名驗證實作決策

**建立日期**: 2025-11-11  
**相關 Issue**: Issue 2025-11-10-001  
**相關 Run**: run-2025-11-11-01

---

## 決策內容

### 簽名驗證實作方式

**決策**：OAuth callback 簽名驗證必須直接傳遞整個 `params` 給 `verifyInstallRequest`，不能只傳遞部分參數。

**實作方式**：
```typescript
// ✅ 正確做法
const isValidSignature = await shoplineService.verifyInstallRequest(params)
```

**禁止做法**：
```typescript
// ❌ 禁止：只傳遞部分參數
const verifyParams = {
  appkey: params.appkey,
  handle: params.handle,
  timestamp: params.timestamp,
  sign: params.sign
}
const isValidSignature = await shoplineService.verifyInstallRequest(verifyParams)
```

---

## 原因

### 技術原因

1. **Shopline API 要求**：簽名驗證必須包含所有參數（除了 `sign` 本身）
2. **OAuth Callback 參數**：可能包含 `code`, `lang`, `customField`, `state` 等參數
3. **verifyInstallRequest 實作**：會自動遍歷所有參數進行簽名驗證

### 歷史教訓

**Run 2025-11-10-01 的錯誤**：
- 重構時將簽名驗證從「傳遞整個 params」改為「只傳遞部分參數」
- 導致缺少 `code` 參數，簽名驗證失敗
- 問題持續到 Run 2025-11-11-01 才被發現並修復

**根本原因**：
- 沒有明確的實作指南文件
- 重構時沒有參考正確的實作範例（`temp/oauth.js`）
- 類型定義不完整，沒有明確標示所有參數

---

## 影響範圍

### 受影響的功能

- OAuth 授權流程
- 商店授權功能
- Token 重新授權流程

### 相關檔案

- `backend/src/routes/auth.ts` - OAuth callback 路由
- `backend/src/services/shopline.ts` - 簽名驗證服務
- `backend/src/types.ts` - 類型定義

---

## 實作指南

**詳細實作指南**：見 `docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`

**關鍵原則**：
1. 簽名驗證必須包含所有參數（除了 `sign`）
2. 直接傳遞整個 `params` 或 `req.query`
3. `verifyInstallRequest` 會自動處理參數過濾和排序

---

## 重構注意事項

### 禁止事項

1. **禁止**：只傳遞部分參數給 `verifyInstallRequest`
2. **禁止**：手動過濾參數（`verifyGetSignature` 會自動處理）
3. **禁止**：修改 `verifyInstallRequest` 的參數遍歷邏輯

### 允許事項

1. **允許**：直接傳遞整個 `params` 或 `req.query`
2. **允許**：使用 `as any` 類型斷言（因為 `ShoplineAuthParams` 類型可能不完整）

---

## 參考文件

- **實作指南**：`docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md`
- **API 文件**：`docs/reference/platform-apis/shopline-api-docs.md`
- **參考實作**：`temp/oauth.js`
- **合規性檢查**：`docs/archive/discussions/COMPLIANCE_CHECK.md`

---

**最後更新**: 2025-11-11

