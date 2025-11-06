# Handle/Token 狀態管理架構分析

## 📋 問題描述

### 當前問題
當用戶切換商店時，handle 和 token 的關聯可能出現不一致：

1. **異步操作競態問題**
   - 用戶選擇商店 A，開始 API 操作
   - 操作進行中時，用戶切換到商店 B
   - 結果：操作可能混用商店 A 和商店 B 的 token/handle

2. **多步驟操作不一致**
   - `createOrder` 需要：取得產品列表 → 選擇產品 → 取得 location → 建立訂單
   - 如果用戶在過程中切換商店，不同步驟可能使用不同商店的 token

3. **狀態管理分散**
   - `selectedHandle` 分散在多個頁面管理（admin-api-test, webhook-test, index）
   - 沒有統一的狀態管理機制
   - 每個頁面獨立管理，容易出現不一致

---

## 🔍 當前架構分析

### 前端狀態管理現況

#### 1. `admin-api-test.tsx`
```typescript
const [selectedHandle, setSelectedHandle] = useState<string>('')
const adminAPI = useAdminAPI(selectedHandle || null)
```
- **問題**：`useAdminAPI` 依賴傳入的 handle
- **風險**：如果 handle 在異步操作中改變，已進行的操作仍使用舊的 handle

#### 2. `webhook-test.tsx`
```typescript
const [selectedHandle, setSelectedHandle] = useState<string>('paykepoc')
const { subscriptions } = useWebhookSubscriptions(selectedHandle)
```
- **問題**：同樣的問題，分散管理

#### 3. `useAdminAPI` Hook
```typescript
export function useAdminAPI(handle: string | null) {
  const getStoreInfo = async () => {
    if (!handle) throw new Error('Handle is required')
    await apiClient.getStoreInfo(handle) // 使用閉包中的 handle
  }
}
```
- **問題**：使用閉包捕獲 handle，如果 handle 改變，已進行的操作仍使用舊值

#### 4. `createOrder` 多步驟操作
```typescript
// 後端服務
async createOrder(handle: string) {
  // 1. 取得產品列表（使用 handle）
  const products = await this.getProducts(handle)
  // 2. 取得 location（使用 handle）
  const locations = await this.getLocations(handle)
  // 3. 建立訂單（使用 handle）
  // 問題：如果前端在這期間切換商店，handle 可能不一致
}
```

### 後端 Token 驗證現況

```typescript
// backend/src/services/shopline.ts
private async validateStoreToken(handle: string): Promise<any> {
  const store = await this.getStoreByHandle(handle)
  // 根據 handle 從資料庫取得對應的 store 和 token
  // ✅ 這個部分沒問題，每次都會根據 handle 重新查詢
}
```

**後端沒有問題**：每次 API 調用都會根據 `handle` 參數重新查詢資料庫，確保使用正確的 token。

---

## 🎯 核心問題

**問題不在後端，而在前端**：

1. **沒有 Handle 鎖定機制**
   - 當多步驟操作進行中時，應該鎖定 handle，不允許切換

2. **沒有統一的狀態管理**
   - 每個頁面獨立管理 `selectedHandle`
   - 切換頁面時狀態可能不一致

3. **異步操作沒有 Handle 快照**
   - 應該在操作開始時鎖定 handle，整個操作流程使用同一個 handle

---

## 💡 解決方案設計

### 方案 A：Context + Handle 鎖定機制（推薦）

#### 架構設計
```
StoreContext (全局狀態)
  ├─ selectedHandle: 當前選中的商店
  ├─ lockedHandle: 操作進行中時鎖定的 handle
  ├─ lockHandle(): 鎖定 handle（操作開始時）
  └─ unlockHandle(): 解鎖 handle（操作完成時）
```

#### 實作方式
1. **建立 `StoreContext`**
   - 統一管理 `selectedHandle`
   - 提供 `lockHandle()` 和 `unlockHandle()` 機制
   - 操作進行中時，`setSelectedHandle` 會阻止切換

2. **修改 `useAdminAPI`**
   - 操作開始時鎖定 handle
   - 操作完成時解鎖 handle
   - 確保整個操作流程使用同一個 handle

3. **修改所有頁面**
   - 使用 `useStore()` 取代本地 `useState`
   - 統一狀態管理

#### 優點
- ✅ 解決競態問題
- ✅ 統一狀態管理
- ✅ 擴展性佳，未來新增功能容易
- ✅ 保證 handle/token 一致性

#### 缺點
- ⚠️ 需要修改多個檔案（3-4 個頁面 + hooks）
- ⚠️ 需要測試所有功能確保不影響現有功能
- ⚠️ 開發時間：約 2-3 小時

---

### 方案 B：最小改動（緊急修復）

#### 實作方式
1. **在 `useAdminAPI` 中鎖定 handle**
   - 操作開始時保存 handle 快照
   - 整個操作使用快照，不受外部 handle 改變影響

2. **在 `createOrder` 等多步驟操作中**
   - 開始時鎖定 handle
   - 整個流程使用同一個 handle

#### 優點
- ✅ 改動最小
- ✅ 風險低
- ✅ 快速修復

#### 缺點
- ⚠️ 狀態管理仍分散
- ⚠️ 未來擴展時可能需要重構

---

## 📊 影響範圍評估

### 方案 A 影響範圍
- **修改檔案**：約 8-10 個檔案
  - `frontend/contexts/StoreContext.tsx` (新建)
  - `frontend/pages/_app.tsx` (修改，加入 Provider)
  - `frontend/pages/admin-api-test.tsx` (修改)
  - `frontend/pages/webhook-test.tsx` (修改)
  - `frontend/pages/index.tsx` (可能需要修改)
  - `frontend/hooks/useAdminAPI.ts` (修改)
  - `frontend/hooks/useWebhookSubscriptions.ts` (可能需要修改)
  - `frontend/components/SubscriptionForm.tsx` (可能需要修改)

- **測試範圍**：
  - 所有 Admin API 功能
  - Webhook 管理功能
  - 商店切換功能
  - URL 參數同步

- **風險**：
  - 中等到高風險（涉及多個頁面）
  - 需要完整測試

### 方案 B 影響範圍
- **修改檔案**：約 2-3 個檔案
  - `frontend/hooks/useAdminAPI.ts` (修改)
  - `backend/src/services/shopline.ts` (可能需要加強驗證)

- **測試範圍**：
  - Admin API 功能（特別是 createOrder）

- **風險**：
  - 低風險（改動範圍小）

---

## 🎯 專業建議

### 建議：**方案 B（最小改動）優先**

#### 理由
1. **Sprint 2 還在進行中**
   - 功能尚未完全完成
   - 先確保當前功能可用，避免影響進度

2. **風險控制**
   - 方案 A 改動範圍大，可能影響現有功能
   - 方案 B 風險低，快速修復核心問題

3. **未來規劃**
   - 下個 Sprint 可以規劃「狀態管理重構」
   - 有完整時間進行設計、實作、測試

#### 實作順序
1. **立即修復**（方案 B）
   - 在 `useAdminAPI` 中鎖定 handle
   - 確保多步驟操作一致性
   - 測試並上線

2. **下個 Sprint**（方案 A）
   - 完整規劃 Context 架構
   - 寫好設計文件
   - 逐步遷移
   - 完整測試

---

## 📝 如果選擇方案 A（現在重構）

### 需要先完成的工作

1. **設計文件**
   - ✅ 本文件（已完成）
   - ⬜ StoreContext API 設計
   - ⬜ 遷移計劃（哪些檔案需要修改）
   - ⬜ 測試計劃

2. **實作計劃**
   - ⬜ 建立 StoreContext
   - ⬜ 修改所有頁面使用 Context
   - ⬜ 修改所有 hooks 使用 Context
   - ⬜ 測試所有功能

3. **時間估算**
   - 設計：1 小時
   - 實作：2-3 小時
   - 測試：1-2 小時
   - **總計：4-6 小時**

---

## ❓ 決策點

請決定：

1. **方案 B（最小改動）**：立即修復，下個 Sprint 重構
2. **方案 A（完整重構）**：現在重構，但需要完整規劃和測試

---

---

## ✅ 決策結果

**已選擇方案 B（最小改動）**

### 實作內容

1. **前端 `useAdminAPI` Hook**
   - 加入 `lockHandle()` 和 `unlockHandle()` 機制
   - 每個 API 操作開始時鎖定 handle，確保整個操作使用同一個 handle
   - 操作完成時解鎖 handle

2. **後端 `createOrder` 多步驟操作**
   - 操作開始時保存 handle 快照（`lockedHandle`）
   - 整個流程（getProducts, getLocations, createOrder）都使用同一個 handle

3. **Header 統一化**
   - 由另一個 agent 完成，已提取為獨立元件 `components/Header.tsx`

### 完成狀態

- ✅ 方案 B 實作完成
- ✅ Sprint 2 已完成並關閉
- ⏳ 方案 A（完整重構）規劃在下個 Sprint

---

**文件狀態**: ✅ 已決策（方案 B）  
**建立日期**: 2025-01-XX  
**最後更新**: 2025-01-XX

