# Note: UI/UX 改進項目

**建立日期**: 2025-11-12  
**狀態**: 📝 collected  
**優先級**: 中  
**相關 Run**: run-2025-11-12-02  
**建議處理階段**: 優化階段 / Phase 2

---

## 📋 問題摘要

在完成 Next Engine 多平台 MVP 後，發現以下 UI/UX 改進項目需要後續處理：

1. **狀態永久化**：連線選擇 refresh 後會重置
2. **API list toggle 狀態管理**：切換連線後展開狀態會重置
3. **Token 到期時間處理**：需要短期和長期方案
4. **UI Layout 架構調整**：多個組件需要固定定位和樣式改進

---

## 🚨 問題詳述

### 1. 狀態永久化：連線選擇 refresh 後會重置

**問題描述**：
- 使用者選擇連線後，如果 refresh 頁面，連線選擇會重置
- 使用者需要重新選擇連線，影響使用體驗
- 預期行為：refresh 後應該從上次選取的連線開始

**影響範圍**：
- 所有使用 `useConnectionStore` 的頁面
- Connection Dashboard、API 測試頁面、Webhook 測試頁面等

**需要實作**：
- 將連線選擇狀態持久化到 localStorage 或 sessionStorage
- 頁面載入時從 storage 恢復狀態
- 確保與 URL 參數同步（如果有的話）

**相關檔案**：
- `frontend/stores/useConnectionStore.ts`
- `frontend/hooks/useSelectedConnection.ts`
- `frontend/hooks/useConnectionRouting.ts`

---

### 2. API list toggle 展開狀態管理

**問題描述**：
- 在 API 測試頁面（`admin-api-test.tsx`）中，API list 的 toggle 展開狀態：
  - ✅ 在當下頁面切換到 webhook 或其他頁面再回來，狀態會保留
  - ❌ 但如果切換連線（從 connection selector），再回來時狀態會重置（全部被折起來）

**影響範圍**：
- `frontend/pages/admin-api-test.tsx`
- 使用者體驗：每次切換連線都要重新展開需要的 API 群組

**需要實作**：
- 將 API list 展開狀態與連線 ID 綁定
- 每個連線記住自己的展開狀態
- 切換連線時恢復對應的展開狀態

**相關檔案**：
- `frontend/pages/admin-api-test.tsx` - `openGroups` state
- 可能需要使用 `useMemo` 或 `useEffect` 來管理狀態

---

### 3. Token 到期時間處理

**問題描述**：
- Next Engine 和 Shopline 的 token 到期時間處理方式不同
- 目前實作可能不夠準確或完整

**短期方案**：
- 授權成功時，依照 Next Engine 的說明直接推算時間
- 確保 token 到期時間正確顯示

**長期方案**：
- 需要與「Next Engine Store 同步機制」一起討論
- 實作自動 refresh token 機制
- Shopline 和 Next Engine 各有各的做法，需要統一設計

**需要討論的問題**：
- Next Engine token refresh 機制（是否需要定期刷新？）
- Shopline token refresh 機制（如何處理？）
- 統一的自動 refresh 策略
- Token 到期前的提醒機制

**相關檔案**：
- `backend/src/services/nextEngine.ts` - `parseDateTime` 方法
- `backend/src/routes/api.ts` - `POST /api/auth/next-engine/complete`
- `frontend/components/connections/ConnectionSummaryCard.tsx`
- `backend/src/services/shopline.ts` - Shopline token 處理

---

### 4. UI Layout 架構調整

**問題描述**：
- 目前 UI layout 有多個視覺和功能問題需要調整
- 需要進行一次全面的架構調整

#### 4.1 組件識別標記

**需求**：
- 關鍵組件除了檔名之外，render 出來要有 `id` 或 `class` 帶入一樣的 name
- 方便後續用 DevTools 直接定位和調整特定區塊

**需要標記的組件**：
- Function Sidebar
- Connection Rail
- Activity Dock
- 主要內容區域
- Context Bar

**實作方式**：
- 在組件根元素添加 `id` 或 `data-component` 屬性
- 使用一致的命名規範（例如：`function-sidebar`, `connection-rail`, `activity-dock`）

#### 4.2 Function Sidebar 調整

**需求**：
- 左側 function sidebar → 固定，不要 scroll
- 讓整個 sidebar 樣式往下填滿整個 vh，不要有斷點
- 現在看起來是靠實際有功能的區塊去填顏色跟 border，沒功能的地方就斷裂了

**需要調整**：
- 使用 `position: fixed` 或 `sticky`
- 確保背景色和 border 延伸到整個 viewport height
- 內容區域可以 scroll，但 sidebar 本身不 scroll

#### 4.3 Connection Rail 調整

**需求**：
- Connection 的左側欄也 fix
- 之後會增加的是 connection list，超出 vh 就 scroll
- 讓視覺樣式延伸整個 vh，不要斷在最後一個 item

**需要調整**：
- 使用 `position: fixed` 或 `sticky`
- Connection list 超出高度時可以 scroll
- 背景色和 border 延伸到整個 viewport height

#### 4.4 Activity Dock 調整

**需求**：
- Activity dock 也 fix 置底
- 給他可以顯示 1.5 個最新的 item 的空間就好了
- 一樣 scroll 去處理溢出
- 可以增加一個 toggle，點擊後展開出三倍大小，方便檢視更多
- Toggle 再收回去（但用最不佔空間的方式去呈現）

**需要調整**：
- 使用 `position: fixed` 置底
- 預設高度：1.5 個 item 的高度
- 內容超出時可以 scroll
- 新增 toggle 按鈕（最小化設計）
- Toggle 展開時：3 倍高度
- Toggle 收起時：回到 1.5 個 item 的高度

#### 4.5 主要內容區域調整

**需求**：
- Fix 完 sidebar、connection rail、activity dock 後
- 橫向的空間就是留給主要內容去 scroll

**需要調整**：
- 主要內容區域使用剩餘空間
- 確保可以正常 scroll
- 不與 fixed 元素重疊

---

## 📝 實作建議

### 優先順序

1. **高優先級**（影響使用者體驗）：
   - 狀態永久化（連線選擇）
   - UI Layout 架構調整

2. **中優先級**（優化體驗）：
   - API list toggle 狀態管理

3. **低優先級**（需要設計討論）：
   - Token 到期時間處理（長期方案）

### 建議處理階段

- **狀態永久化**：下個 Run 或優化階段
- **API list toggle**：優化階段
- **Token 到期時間（短期）**：下個 Run 或優化階段
- **Token 到期時間（長期）**：Phase 2 或後續設計討論
- **UI Layout 架構調整**：建議獨立一個 Refactor Story 處理

---

## 🔗 相關文件

- [Run 2025-11-12-02 結案總結](../../context/run-2025-11-12-02-closure-summary.md)
- [Note 2025-11-12-001: Next Engine 整合後發現的問題](note-2025-11-12-001-next-engine-issues.md)
- [Story 5.3.1: 多平台測試頁面整合](../stories/story-5-3-1-multi-platform-test-pages.md)

---

**最後更新**: 2025-11-12

