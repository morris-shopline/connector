# Story 5.8: Next Engine 建立訂單 API

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ⚪ pending  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 待規劃

---

## Story 描述

實作 Next Engine 建立訂單 API，讓系統可以透過 API 建立訂單。

**目標**：讓 admin 可以方便地透過 API 建立 Next Engine 訂單。

> 📌 **參考文件**：
> - `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`
> - `docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`
> - 📌 **實作範本**：`docs/reference/platform-apis/NE-EXAMPLE.md`（ne-test 專案完整實作範本）

---

## 前情提要

### 現有實作狀況

**已實作的 Next Engine API**：
- ✅ OAuth 授權流程（Story 5.1）
- ✅ 查詢店舖列表（Story 5.2）
- ✅ 查詢商品（Story 5.2）
- ✅ 建立商品（Story 5.2，Story 5.5 改進）
- ✅ 查詢訂單 base（Story 5.6）
- ✅ 查詢訂單 rows（Story 5.6）
- ✅ 扣庫分析（Story 5.6）

**問題點**：
- 缺少建立訂單功能

---

## 依賴與前置條件

1. Story 5.1～5.7 已完成並通過 User Test。  
2. Next Engine API 文件已收集完成（待用戶補充）。

---

## 範圍定義

### ✅ 包含

1. **建立訂單 API** (`/api/connections/:connectionId/orders`)
   - NextEngine API：待確認（需用戶補充文件）
   - 支援參數：待確認（需用戶補充文件）
   - 回傳結果：待確認（需用戶補充文件）

2. **Adapter 層方法擴充**
   - 在 `NextEngineAdapter` 中新增 `createOrder` 方法

3. **前端 API 客戶端整合**（`frontend/lib/api.ts`）
   - 新增 `createOrder(connectionId, orderData)` 方法

4. **前端 API 配置整合**（`frontend/content/platforms/api-configs.ts`）
   - 在 `nextEngineApiConfig` 的 `orders` 群組中新增 `neCreateOrder` 配置

5. **前端測試頁面整合**（`frontend/pages/admin-api-test.tsx`）
   - 在 Next Engine API 的 switch case 中加入建立訂單 API 的處理邏輯

### ❌ 不包含

- 待確認（需用戶補充文件後再補充）

---

## 驗收標準

### Agent 自動化 / 測試

- [ ] 建立訂單 API 可正確建立訂單
- [ ] 前端 API 客戶端方法可正確呼叫後端 API
- [ ] 前端 API 配置正確顯示在 admin-api-test 頁面
- [ ] 前端測試頁面可正確處理建立訂單 API 呼叫
- [ ] 測試腳本驗證建立訂單 API 的成功與錯誤情境
- [ ] 將結果記錄於審計或 log，供除錯追蹤

### User Test

- [ ] Human 在 admin-api-test 頁面選擇 Next Engine Connection
- [ ] Human 確認「訂單」群組顯示建立訂單 API 功能
- [ ] Human 確認建立訂單 API 可正確建立訂單
- [ ] Human 確認在 Next Engine 後台可驗證建立的訂單

---

## 交付與文件更新

### 程式碼交付

- [ ] `NextEngineAdapter` 新增 `createOrder` 方法
- [ ] `backend/src/routes/api.ts` 新增建立訂單 API 路由
- [ ] `frontend/lib/api.ts` 新增建立訂單 API 客戶端方法
- [ ] `frontend/content/platforms/api-configs.ts` 新增 Next Engine createOrder 配置
- [ ] `frontend/pages/admin-api-test.tsx` 整合建立訂單 API 處理邏輯
- [ ] 更新測試腳本 `backend/scripts/test-next-engine-apis.ts`

### 文件更新

- [ ] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md`：補充建立訂單 API 規格
- [ ] 更新 `NE-OVERVIEW.md`：補充建立訂單 API 測試操作步驟
- [ ] 更新 `NEXTENGINE_API_REFERENCE.md`：補充建立訂單 API 參數說明

---

## 實作重點與技術細節

### 後端實作

#### 建立訂單流程

1. **建立訂單**：
   - Next Engine API 端點：待確認（需用戶補充文件）
   - 請求格式：待確認（需用戶補充文件）
   - 回傳格式：待確認（需用戶補充文件）

#### 錯誤處理

- 待確認（需用戶補充文件後再補充）

### 前端實作

#### API 客戶端方法（`frontend/lib/api.ts`）

```typescript
async createOrder(connectionId: string, orderData: any): Promise<ApiResponse<any>>
```

#### API 配置（`frontend/content/platforms/api-configs.ts`）

在 `nextEngineApiConfig.groups.orders` 中新增：

```typescript
{
  id: 'neCreateOrder',
  name: '建立訂單',
  group: 'orders',
  method: 'POST',
  endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders`,
  hasBody: true,
  paramConfig: [
    // 待用戶補充文件後再補充
  ]
}
```

#### 測試頁面整合（`frontend/pages/admin-api-test.tsx`）

在 Next Engine API 的 switch case 中新增處理邏輯：

```typescript
case 'neCreateOrder': {
  result = await apiClient.createOrder(connectionId, paramValues)
  break
}
```

---

## 風險與備註

### 技術風險

- **API 文件待補充**：需等待用戶補充 Next Engine 建立訂單 API 的詳細文件
- 待確認（需用戶補充文件後再補充）

### 測試風險

- **Sandbox 環境限制**：需確認 sandbox 環境是否支援建立訂單功能

---

## 參考實作範本

詳細的實作範本請參考 `docs/reference/platform-apis/NE-EXAMPLE.md`（如有相關章節）。

---

**備註**：此 Story 為初步規劃版本，待用戶補充 Next Engine 建立訂單 API 的相關文件後，將更新詳細的實作規格。

