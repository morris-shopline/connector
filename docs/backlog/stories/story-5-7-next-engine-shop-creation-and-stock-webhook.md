# Story 5.7: Next Engine 店舖建立改進與在庫連携接收端點

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ⚪ pending  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 3-4 個工作天

---

## Story 描述

在 Story 5.5 完成商品建立改進與庫存 API 後，**改進店舖建立 API 並實作在庫連携接收端點（Webhook 機制）**，包括：

1. **改進店舖建立 API**：支援動態產生測試資料（無需手動 key XML）
2. **在庫連携接收端點**：實作 Next Engine 推送庫存更新的接收機制
3. **Webhook 管理 UI**：在 webhook-test 頁面顯示 Next Engine 專屬的在庫連携管理介面

**目標**：讓 admin 可以方便地測試 Next Engine 店舖建立 API，並完整支援 Next Engine 的在庫連携機制（類似 webhook，但每 5 分鐘才推送一次）。

> 📌 **參考文件**：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 📌 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本，包含店舖建立與在庫連携的端到端流程）

---

## 前情提要

### 現有實作狀況

**已實作的 Next Engine API**：
- ✅ OAuth 授權流程（Story 5.1）
- ✅ 查詢店舖列表（Story 5.2）
- ✅ 建立店舖 `/api/connections/:connectionId/shops/create` - **目前需要手動提供完整 XML**
- ✅ 查詢商品、建立商品（Story 5.2, 5.5）
- ✅ 庫存與倉庫 API（Story 5.5）
- ✅ 訂單相關 API（Story 5.6）

**問題點**：
- 建立店舖時需要手動準備完整的 XML 格式，測試不便
- 缺少在庫連携接收端點（Next Engine 推送庫存更新的機制）
- 缺少 Webhook 管理 UI 顯示在庫連携狀態

---

## 依賴與前置條件

1. Story 5.1～5.6 已完成並通過 User Test。  
2. Sandbox 環境可穩定建立商品與店舖，並可在 Next Engine 後台查詢資料。
3. 已研讀 `NE-EXAMPLE.md` 了解參考專案的實作方式。

---

## 範圍定義

### ✅ 包含

#### Phase 1: 改進店舖建立 API（動態產生測試資料）

1. **改進建立店舖 API** (`/api/connections/:connectionId/shops/create`)
   - 支援可選參數：`shopName`, `shopNote`（未提供則使用預設值）
   - 內建 XML 模板，自動填入必填欄位：
     - `shop_mall_id=90`（汎用商城）
     - `mall_login_id1`：在庫更新 URL（從環境變數 `NEXTENGINE_STOCK_UPDATE_URL` 取得）
     - `mall_password1`：StoreAccount（從環境變數 `NEXTENGINE_STORE_ACCOUNT` 取得）
     - `mall_login_id2`：認證金鑰（從環境變數 `NEXTENGINE_AUTH_KEY` 取得）
   - **⚠️ 相依性**：此功能需要先實作「在庫連携接收端點」（見 Phase 2），否則這些欄位設定無效
   - 保留原有功能：若提供 `data`（完整 XML），則直接使用

#### Phase 2: 在庫連携接收端點（Webhook 機制）

**⚠️ 重要相依性**：此 Phase 必須先完成，Phase 1 的店舖建立 API 中 `mall_login_id1/2` 和 `mall_password1` 欄位才有意義。

Next Engine 會透過 GET 請求推送庫存更新到我們提供的 URL（類似 webhook，但每 5 分鐘才推送一次）。

**需要實作的項目**：

2. **在庫連携接收端點** (`GET /UpdateStock.php` 或 `/api/next-engine/stock-update`)
   - 接收 Next Engine 的 GET 請求
   - 請求參數：`StoreAccount`, `Code`（商品代表コード）, `Stock`, `ts`（時間戳）, `.sig`（簽章值）
   - **簽名驗證**：
     - 參數排序：按字母順序排列 StoreAccount, Code, Stock, ts
     - 字串組合：用 `&` 連接參數，最後加上 `NEXTENGINE_AUTH_KEY`
     - MD5 雜湊：對組合字串進行 MD5 雜湊
     - 驗證收到的 `.sig` 是否與計算結果一致
   - **XML 響應**：必須回傳 EUC-JP 編碼的 XML
     ```xml
     <?xml version="1.0" encoding="EUC-JP"?>
     <ShoppingUpdateStock version="1.0">
       <ResultSet TotalResult="1">
         <Request>
           <Argument Name="StoreAccount" Value="{ACCOUNT}" />
           <Argument Name="Code" Value="{PRODUCT_CODE}" />
           <Argument Name="Stock" Value="{STOCK}" />
           <Argument Name="ts" Value="{TIMESTAMP}" />
           <Argument Name=".sig" Value="{SIGNATURE}" />
         </Request>
         <Result No="1">
           <Processed>0</Processed>
         </Result>
       </ResultSet>
     </ShoppingUpdateStock>
     ```
   - 成功時回傳 `Processed=0`，錯誤時回傳 `Processed=-3`
   - 記錄每筆請求到 audit log 或資料庫

3. **監控 API**（必須實作，供 UI 使用）
   - `GET /api/connections/:connectionId/inventory/updates` - 取得更新紀錄
     - 查詢參數：`limit`, `productCode`, `storeAccount`（可選）
     - 回傳庫存更新事件列表
   - `GET /api/connections/:connectionId/inventory/logs` - 查看原始日誌
     - 查詢參數：`limit`, `type`（可選）
     - 回傳原始請求日誌
   - `GET /api/connections/:connectionId/inventory/status` - 顯示最新統計與設定指引
     - 回傳連携狀態、統計資訊、設定指引
   - `POST /api/connections/:connectionId/inventory/test-connection` - 測試連携功能
     - 觸發測試請求（模擬 Next Engine 的「接続を確認」）
     - 回傳測試結果

4. **測試連携功能**
   - 支援 Next Engine 後台的「接続を確認」測試請求（不帶參數）
   - 記錄測試請求型別為 `connection_test`

5. **Webhook 管理 UI 整合**（在 `frontend/pages/webhook-test.tsx`）
   - **⚠️ 重要**：Next Engine 平台使用在庫連携機制，不同於 Shopline 的 API 訂閱 webhook
   - **UI 呈現需求**：
     - 當 `selectedConnection?.platform === 'next-engine'` 時，顯示在庫連携管理介面
     - **連携狀態顯示**：
       - 連携 URL（從 Connection Item 的 `metadata.mall_login_id1` 取得，或顯示環境變數中的 URL）
       - StoreAccount（從 `metadata.mall_password1` 取得）
       - Auth Key 狀態（已設定/未設定，不顯示實際值）
       - 連携狀態（已啟用/未啟用）
     - **庫存更新記錄**：
       - 顯示接收到的庫存更新事件列表（類似 Shopline 的 webhook events）
       - 顯示欄位：商品代碼、庫存數量、接收時間、處理狀態
       - 支援篩選和搜尋
     - **測試連携按鈕**：
       - 「測試連携」按鈕：觸發測試請求（模擬 Next Engine 的「接続を確認」）
       - 顯示測試結果（成功/失敗）
     - **設定指引**：
       - 顯示如何在 Next Engine 後台設定在庫連携 URL
       - 顯示環境變數設定指引
   - **API 整合**：
     - 使用監控 API 取得庫存更新記錄：`GET /api/connections/:connectionId/inventory/updates`
     - 使用監控 API 取得連携狀態：`GET /api/connections/:connectionId/inventory/status`
     - 測試連携 API：`POST /api/connections/:connectionId/inventory/test-connection`
   - **與 Shopline 的差異**：
     - Shopline：主動訂閱 webhook（API 訂閱機制）
     - Next Engine：被動接收（設定 URL，Next Engine 會推送，每 5 分鐘一次）
     - UI 上不需要「新增訂閱」按鈕，而是顯示連携設定狀態和接收記錄

**參考文件**：
- `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md` - 在庫連携架構章節
- `docs/reference/platform-apis/NE-EXAMPLE.md` - 在庫連接章節
- `docs/reference/guides/NE-OVERVIEW.md` - 在庫連携（被動式整合重點）章節

**⚠️ 文件完整性檢查**：
- [ ] 確認上述參考文件是否包含完整的實作範例程式碼
- [ ] 若文件僅有說明而無完整實作範例，需要請另一個做過的 agent 提供實作攻略
- [ ] 確認簽名驗證的實作細節（參數排序規則、字串組合方式、MD5 計算方式）
- [ ] 確認 XML 響應格式的完整規範（包含所有必要欄位）

#### Phase 3: Adapter 層方法擴充與前端整合

6. **Adapter 層方法擴充**
   - 在 `NextEngineAdapter` 中新增以下方法：
     - `createShop(accessToken, options?)` - 建立店舖（支援動態資料）
     - `verifyStockUpdateSignature(params, receivedSignature)` - 驗證在庫連携簽名（供接收端點使用）

7. **前端 Hooks 與 Components**
   - 新增 `useNextEngineStockUpdates(connectionId)` Hook：
     - 取得庫存更新記錄
     - 自動刷新
     - 錯誤處理
   - 新增 `useNextEngineStockStatus(connectionId)` Hook：
     - 取得連携狀態
     - 測試連携功能
   - 更新 `webhook-test.tsx`：
     - 當平台為 `next-engine` 時，顯示在庫連携管理介面
     - 移除「新增訂閱」按鈕（Next Engine 不需要）
     - 顯示連携狀態、庫存更新記錄、測試連携按鈕
   - 新增 `NextEngineStockUpdateCard` Component：
     - 顯示單一庫存更新事件
     - 類似 `WebhookEventCard`，但針對 Next Engine 格式

8. **測試腳本與文件**
   - 更新測試腳本 `backend/scripts/test-next-engine-apis.ts`
   - 提供 CLI 命令測試店舖建立與在庫連携功能
   - 記錄測試結果到 audit log
   - 更新 `NE-OVERVIEW.md` 補充店舖建立與在庫連携測試操作步驟

### ❌ 不包含
- 前端呈現或 UX 調整（預留後續 Story 規劃）
- 訂單相關 API（已在 Story 5.6 完成）

---

## 驗收標準

### Agent 自動化 / 測試

#### Phase 1: 改進店舖建立 API
- [ ] 建立店舖 API 支援動態產生測試資料（無需提供 XML）
- [ ] 保留原有功能：提供完整 XML 時仍可使用
- [ ] 測試腳本驗證兩種模式（動態產生 vs 手動提供）

#### Phase 2: 在庫連携接收端點
- [ ] 在庫連携接收端點可正確接收 Next Engine 的 GET 請求
- [ ] 簽名驗證邏輯正確（參數排序、字串組合、MD5 計算）
- [ ] XML 響應格式正確（EUC-JP 編碼、完整 XML 結構）
- [ ] 測試連携功能可正確處理「接続を確認」請求
- [ ] 監控 API 可正確查詢更新紀錄與日誌
- [ ] **Webhook 管理 UI 可正確顯示在庫連携狀態和記錄**
- [ ] **Next Engine 平台在 webhook-test 頁面顯示專屬介面（非 Shopline 的訂閱機制）**
- [ ] 測試腳本驗證接收端點功能

### User Test

#### 便利性測試
- [ ] Admin 可以**不提供任何參數**建立測試店舖，系統自動產生 XML
- [ ] Admin 可以**只提供部分參數**（如 `shopName`）建立店舖，系統自動補齊其他欄位

#### 功能測試
- [ ] Human 確認在 Next Engine 後台可看到動態建立的店舖
- [ ] Human 在 Next Engine 後台點擊「接続を確認」，確認我們的接收端點可正確回應
- [ ] Human 確認在庫連携功能可正常運作（Next Engine 推送庫存更新到我們的端點）
- [ ] **Human 在 webhook-test 頁面選擇 Next Engine Connection，確認顯示在庫連携管理介面**
- [ ] **Human 確認 UI 顯示連携 URL、StoreAccount、連携狀態等資訊**
- [ ] **Human 確認 UI 可顯示接收到的庫存更新記錄**
- [ ] **Human 確認 UI 的「測試連携」按鈕可正常運作**

---

## 交付與文件更新

### 程式碼交付
- [ ] `NextEngineAdapter` 新增店舖建立與簽名驗證方法
- [ ] `api.ts` 新增在庫連携接收端點與監控 API 路由
- [ ] **在庫連携接收端點**（`/UpdateStock.php` 或 `/api/next-engine/stock-update`）
- [ ] **簽名驗證工具函數**（MD5 簽名計算與驗證）
- [ ] **前端 Hooks**：`useNextEngineStockUpdates`, `useNextEngineStockStatus`
- [ ] **前端 Component**：`NextEngineStockUpdateCard`
- [ ] **更新 `webhook-test.tsx`**：Next Engine 平台顯示在庫連携管理介面
- [ ] 更新測試腳本 `backend/scripts/test-next-engine-apis.ts`

### 文件更新
- [ ] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md`：
  - 補充店舖動態資料產生邏輯說明
  - 補充在庫連携接收端點規格
  - 更新欄位對照表（若有新增 metadata）
- [ ] 更新 `NE-OVERVIEW.md`：
  - 補充店舖建立與在庫連携測試操作步驟
  - 補充店舖動態資料產生使用範例
  - 補充在庫連携流程說明
- [ ] 更新 `NEXTENGINE_API_REFERENCE.md`：
  - 補充店舖動態資料產生參數說明
  - 補充在庫連携接收端點實作細節

---

## 實作重點與技術細節

### 動態資料產生邏輯

#### 建立店舖（XML 模板）
```typescript
// 若未提供 shopName，使用預設值
const shopName = options?.shopName || `Test Shop ${Date.now()}`
const shopNote = options?.shopNote || 'Test shop created via API'

// 自動填入必填欄位
const xmlTemplate = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <shop>
    <shop_mall_id>90</shop_mall_id>
    <shop_note>${shopNote}</shop_note>
    <shop_name>${shopName}</shop_name>
    <shop_abbreviated_name>TS</shop_abbreviated_name>
    <shop_tax_id>0</shop_tax_id>
    <shop_tax_calculation_sequence_id>0</shop_tax_calculation_sequence_id>
    <shop_currency_unit_id>1</shop_currency_unit_id>
    <mall_login_id1>${process.env.NEXTENGINE_STOCK_UPDATE_URL || ''}</mall_login_id1>
    <mall_password1>${process.env.NEXTENGINE_STORE_ACCOUNT || 'test'}</mall_password1>
    <mall_login_id2>${process.env.NEXTENGINE_AUTH_KEY || ''}</mall_login_id2>
  </shop>
</root>`
```

### 在庫連携簽名驗證流程

1. **接收請求參數**：`StoreAccount`, `Code`, `Stock`, `ts`, `.sig`
2. **參數排序**：按字母順序排列（Code, Stock, StoreAccount, ts）
3. **字串組合**：用 `&` 連接參數，格式：`Code={CODE}&Stock={STOCK}&StoreAccount={ACCOUNT}&ts={TIMESTAMP}`
4. **加上認證金鑰**：在字串最後加上 `NEXTENGINE_AUTH_KEY`
5. **MD5 雜湊**：對組合字串進行 MD5 雜湊
6. **驗證簽名**：比較計算結果與收到的 `.sig` 是否一致

### XML 響應格式

必須使用 EUC-JP 編碼，包含完整的 XML 結構。成功時回傳 `Processed=0`，錯誤時回傳 `Processed=-3`。

---

## 風險與備註

### 技術風險
- **在庫連携測試限制**：Next Engine 的推送機制每 5 分鐘才推送一次，測試時需要等待或使用「接続を確認」功能
  - **緩解**：提供測試連携功能，可模擬 Next Engine 的測試請求
- **公開 URL 需求**：在庫連携接收端點需要公開的 HTTPS URL，開發環境需要使用 ngrok 等工具
  - **緩解**：提供明確的文件說明如何使用 ngrok
- **XML 編碼問題**：必須使用 EUC-JP 編碼，需要確保正確處理
  - **緩解**：使用 Node.js 的 `iconv-lite` 或類似套件處理編碼轉換

### 測試風險
- **Sandbox 環境限制**：若 sandbox 無法完整測試在庫連携功能，需記錄並在 Run 中提出支援需求

### 向後相容性
- **保留原有功能**：提供完整 XML 時仍可使用原有邏輯
- **API 路由不變**：只擴充功能，不改變現有路由結構

---

## 參考實作範本

詳細的實作範本請參考 `docs/reference/platform-apis/NE-EXAMPLE.md`，包含：
- 店舖動態資料產生的完整邏輯
- XML 格式的標準模板
- 在庫連携接收端點的完整實作
- 簽名驗證的實作方式
- Webhook 管理 UI 的範例結構

