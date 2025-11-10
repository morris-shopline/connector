# 設計問題分析：URL 補齊與單向同步的矛盾

**日期**: 2025-11-10  
**問題**: Story 要求與架構決策存在矛盾，導致實作時無法完全遵循單向同步原則

---

## 問題根源

### Story 和決策文件的要求

1. **Story R1.1 測試計畫**（第 131 行）：
   > 「確認頁面自動補齊 `platform` / `connectionId` 並更新 URL」

2. **決策文件 Kickoff 更新**（connection-state-sync.md 第 45 行）：
   > 「若 URL 只帶此參數，Hook 應向 API 取得對應 Connection，再自動補齊 `connectionId` 與 `platform` 並更新 URL。」

3. **Story R3.1 實作項目**（第 59 行）：
   > 「登入成功：載入 Connection List，若沒有 connection → 導向授權流程；有 connection → 設定預設 URL」

### 架構決策的核心原則

**connection-state-sync.md 第 22-28 行**：
> 2. **Router 事件驅動**：
>    - 使用 Next.js `router.events` 監聽 `routeChangeComplete`，根據新 URL 更新 Zustand store。
>    - **取消 useEffect 互相寫回 URL 與 Store 的循環邏輯**。
> 
> 3. **操作流程**：
>    - UI 切換 Connection 時，僅呼叫 `router.replace({ query: { ... } })`。
>    - **Store 僅在 Router 事件中接收資料並更新，避免雙向競態**。

---

## 矛盾點

### 矛盾 1：URL 補齊 vs 單向同步

**要求**：
- Story 要求「自動補齊參數並更新 URL」
- 決策文件要求「Hook 應向 API 取得對應 Connection，再自動補齊並更新 URL」

**架構原則**：
- 「Store 僅在 Router 事件中接收資料並更新」
- 「取消 useEffect 互相寫回 URL 與 Store 的循環邏輯」

**問題**：
- 如果 `syncFromRouter`（從 Router 事件觸發）中更新 URL，會造成：
  - `syncFromRouter` → `applyToRouter` → `router.replace` → `routeChangeComplete` → `syncFromRouter` → **無限循環**
- 如果不在 `syncFromRouter` 中更新 URL，如何實現「自動補齊參數並更新 URL」？

### 矛盾 2：預設 Connection 設置 vs URL 唯一來源

**要求**：
- Story R3.1 要求「登入成功：有 connection → 設定預設 URL」
- 頁面層需要「如果 URL 沒有 Connection 參數，自動設置預設 Connection」

**架構原則**：
- 「URL 是唯一真實來源」
- 「取消 useEffect 互相寫回 URL 與 Store 的循環邏輯」

**問題**：
- 如果頁面層的 `useEffect` 檢查 URL 沒有參數，就調用 `applyConnection`，會造成：
  - `useEffect` → `applyConnection` → `router.replace` → `routeChangeComplete` → `syncFromRouter` → Store 更新 → `currentConnection` 變化 → `useEffect` 依賴變化 → **無限循環**
- 如果不在頁面層設置，如何實現「登入後設定預設 URL」？

---

## 實作時的判斷

### 我的實作選擇

1. **在 `syncFromRouter` 中更新 URL**：
   - 理由：符合 Story 要求「自動補齊參數並更新 URL」
   - 問題：違反架構決策「Store 僅在 Router 事件中接收資料並更新」

2. **在頁面層的 `useEffect` 中設置預設 Connection**：
   - 理由：符合 Story 要求「登入後設定預設 URL」
   - 問題：違反架構決策「取消 useEffect 互相寫回 URL 與 Store 的循環邏輯」

### 結果

- 實作時選擇了**遵循 Story 要求**，但**違反了架構決策的核心原則**
- 導致無限循環和強制登出問題

---

## 需要補充討論的設計議題

### 議題 1：URL 補齊的時機和方式

**問題**：
- 當 URL 只帶 `connectionItemId` 時，如何補齊 `platform` 和 `connectionId` 並更新 URL？

**可能的解決方案**：

**方案 A：在初始載入時補齊，不在 Router 事件中補齊**
- 優點：符合單向同步原則
- 缺點：需要區分「初始載入」和「Router 事件」，實作複雜

**方案 B：使用 `router.replace` 的 `shallow: true`，但 Next.js 的 `shallow` 仍會觸發 `routeChangeComplete`**
- 優點：簡單
- 缺點：仍可能造成循環

**方案 C：URL 補齊時使用特殊標記，避免循環**
- 優點：可以避免循環
- 缺點：需要額外的狀態管理

**方案 D：URL 補齊不在 Hook 層處理，在頁面層處理**
- 優點：符合單向同步原則
- 缺點：每個頁面都需要實作，違反「所有頁面共享同一個同步機制」的原則

### 議題 2：預設 Connection 設置的時機和方式

**問題**：
- 登入後或頁面載入時，如果 URL 沒有 Connection 參數，如何設置預設 Connection？

**可能的解決方案**：

**方案 A：在登入流程中設置 URL，不在頁面層設置**
- 優點：符合「URL 是唯一來源」原則
- 缺點：需要修改登入流程，可能影響其他頁面

**方案 B：頁面層檢查 URL，如果沒有參數就顯示「請選擇商店」，不自動設置**
- 優點：符合單向同步原則
- 缺點：不符合 Story 要求「登入後設定預設 URL」

**方案 C：使用 `useEffect` 但加入更嚴格的條件檢查**
- 優點：可以避免循環
- 缺點：實作複雜，容易出錯

### 議題 3：`router.replace` 與 `routeChangeComplete` 的關係

**問題**：
- Next.js 的 `router.replace` 是否一定會觸發 `routeChangeComplete`？
- 如果會，如何避免循環？

**需要確認**：
- `router.replace` 的 `shallow: true` 選項是否會觸發 `routeChangeComplete`？
- 是否有其他方式更新 URL 而不觸發 Router 事件？

---

## 建議

### 短期解決方案

1. **明確 URL 補齊的實作方式**：
   - 確認是否可以在 `syncFromRouter` 中更新 URL
   - 如果可以，如何避免循環？
   - 如果不可以，應該在哪一層處理？

2. **明確預設 Connection 設置的實作方式**：
   - 確認是否可以在頁面層的 `useEffect` 中設置
   - 如果可以，如何避免循環？
   - 如果不可以，應該在哪一層處理？

### 長期解決方案

1. **更新架構決策文件**：
   - 明確說明 URL 補齊和預設 Connection 設置的實作方式
   - 說明如何避免循環

2. **更新 Story 文件**：
   - 明確說明 URL 補齊和預設 Connection 設置的實作細節
   - 確保 Story 要求與架構決策一致

---

## 結論

**問題來源**：
1. ✅ Story 文件描述：有明確要求，但與架構決策存在矛盾
2. ✅ 架構決策設計：核心原則明確，但未處理 URL 補齊和預設設置的細節
3. ❌ 實作問題：實作時選擇遵循 Story 要求，但違反了架構決策的核心原則

**需要補充討論**：
- URL 補齊的時機和方式
- 預設 Connection 設置的時機和方式
- `router.replace` 與 `routeChangeComplete` 的關係

**建議**：
- 先明確這些設計細節，再進行實作修正
- 更新架構決策文件，明確說明如何處理這些邊界情況

