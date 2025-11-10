# URL 參數決策重新檢視

**日期**: 2025-11-10  
**目的**: 重新檢視為什麼要用 URL 參數，以及是否有更好的解法

---

## 源頭問題

### 問題：UI 閃跳

**情境**：
- 用戶在「商店列表」點擊商店卡片
- 切換到「Webhook 管理」頁面
- 商店選擇下拉選單會閃跳

**根本原因**：
- 系統用兩個地方記錄「目前選了哪個商店」：
  1. URL（網址列）
  2. Zustand Store（記憶體）
- 兩個地方互相同步 → 造成循環更新 → UI 閃跳

---

## 當初的解決方案選項（Issue 2025-11-06-001）

### 方案 A：使用 Next.js Router 的事件處理（最終選擇）

**思路**：
- 使用 `router.events` 監聽路由變化
- 只在路由變化時更新 Zustand Store
- 用戶操作時直接更新 URL，讓 Router 事件處理同步

**優點**：
- 利用 Next.js 內建機制
- 避免 useEffect 循環
- 更符合 Next.js 最佳實踐

**缺點**：
- 需要手動處理 URL 與 Store 的同步
- 現在遇到設計矛盾（URL 補齊 vs 單向同步）

### 方案 B：使用 Zustand 的 Middleware 或 Persist（未深入評估）

**思路**：
- 使用 Zustand 的 URL 同步中間件
- 或使用 Persist 機制同步到 URL

**優點**：
- 利用 Zustand 生態系統
- 自動處理同步邏輯
- 符合 state-management 決策（使用 Zustand）

**缺點**：
- 可能需要額外的依賴
- 學習成本較高

**狀態**：❌ **沒有深入評估，直接被放棄**

### 方案 C：簡化為單向同步

**思路**：
- URL 是唯一來源
- 移除 Zustand Store → URL 的同步
- 只在必要時（如用戶操作）更新 URL

**優點**：
- 簡單、可預測
- 避免循環更新

**缺點**：
- 需要重新設計狀態管理邏輯

---

## 為什麼選擇 URL 參數方案？

### 決策文件中的理由（connection-state-sync.md）

1. **消除循環依賴**：避免 useEffect 互相觸發造成閃跳
2. **一致性**：所有頁面共享同一個同步機制
3. **可觀測性**：URL 能明確表示目前選取的 Connection，利於 Debug 與分享

### 額外的好處（實際使用時發現）

1. **瀏覽器「上一頁/下一頁」可以直接還原狀態**
2. **可以直接分享網址**
3. **刷新頁面不會丟失狀態**
4. **開發時容易除錯**

---

## 問題：URL 參數真的是最佳解法嗎？

### 疑問 1：這些額外好處是否必要？

**瀏覽器導航**：
- 用戶真的會用「上一頁」來切換商店嗎？
- 還是會直接點擊商店卡片？

**分享網址**：
- 用戶真的會分享帶商店參數的網址嗎？
- 還是會分享主頁面，讓對方自己選擇商店？

**刷新頁面**：
- 這個功能確實有用
- 但可以用 localStorage 實現

**開發除錯**：
- 這個確實有用
- 但可以用 Redux DevTools 或其他工具實現

### 疑問 2：為什麼沒有選擇 Zustand 的原生方案？

**Zustand 有專門的解決方案**：
- `zustand/middleware` 中的 `persist` middleware
- 可以自動同步到 localStorage
- 可以配合 Next.js Router 同步到 URL

**為什麼沒有評估**：
- Issue 文件中提到但沒有深入評估
- 可能因為「學習成本較高」就直接放棄了
- 但實際上 Zustand 的 persist middleware 很簡單

### 疑問 3：URL 參數方案是否符合 state-management 決策？

**state-management 決策（2025-11-04）**：
- 選擇 Zustand 作為狀態管理
- 重點是「簡單、Agent 友好、漸進式擴展」
- **沒有提到 URL 參數**

**connection-state-sync 決策（2025-11-07）**：
- 選擇 URL 參數方案
- **但這個決策是在 state-management 決策之後才做的**
- 可能沒有充分考慮與原本決策的一致性

---

## Zustand 原生方案的可能性

### Zustand Persist Middleware

**功能**：
- 自動將 Store 狀態同步到 localStorage
- 頁面刷新時自動恢復狀態
- 可以配合 Next.js Router 同步到 URL

**優點**：
- ✅ 符合 state-management 決策（使用 Zustand）
- ✅ 自動處理同步邏輯，不需要手動處理
- ✅ 避免循環更新（Zustand 內部處理）
- ✅ 簡單、符合「Agent 友好」原則

**缺點**：
- ⚠️ 需要學習 Zustand persist middleware
- ⚠️ 可能需要額外的 URL 同步邏輯（但比現在簡單）

### Zustand + Next.js Router 整合

**可能的實作方式**：
```typescript
// 使用 Zustand persist 同步到 localStorage
// 使用 Next.js Router 同步到 URL（只在用戶操作時）
// 避免雙向同步，只用單向同步
```

**優點**：
- ✅ 符合 state-management 決策
- ✅ 利用 Zustand 生態系統
- ✅ 避免循環更新
- ✅ 保持簡單性

---

## 需要決策的問題

### 問題 1：URL 參數的額外好處是否必要？

**需要確認**：
- 用戶是否真的需要「瀏覽器導航還原狀態」？
- 用戶是否真的需要「分享帶商店參數的網址」？
- 如果不需要，可以用更簡單的方案（只用 Zustand + localStorage）

### 問題 2：是否應該重新評估 Zustand 原生方案？

**需要確認**：
- Zustand persist middleware 是否足夠簡單？
- 是否應該重新評估方案 B（Zustand Middleware/Persist）？
- 是否符合 state-management 決策的「簡單、Agent 友好」原則？

### 問題 3：URL 參數方案是否符合 state-management 決策？

**需要確認**：
- URL 參數方案是否偏離了 state-management 決策的初衷？
- 是否需要更新 state-management 決策文件，補充 URL 參數的使用指引？
- 還是應該調整實作，更符合 state-management 決策？

---

## 建議

### 短期：先解決當前的無限循環問題

無論最終選擇哪個方案，都需要先解決當前的問題：
1. 修正 `syncFromRouter` 中的循環
2. 移除頁面層的 `useEffect` 自動設置邏輯
3. 確保基本功能可以運作

### 長期：重新評估 URL 參數的必要性

**選項 A：保留 URL 參數方案**
- 明確 URL 參數的用途和邊界情況
- 更新 state-management 決策文件，補充 URL 參數指引
- 解決設計矛盾（URL 補齊 vs 單向同步）

**選項 B：改用 Zustand 原生方案**
- 重新評估 Zustand persist middleware
- 如果更簡單，考慮遷移到 Zustand 原生方案
- 更新 connection-state-sync 決策

**選項 C：簡化方案**
- 如果 URL 參數的額外好處不重要，可以簡化
- 只用 Zustand + localStorage
- 移除 URL 參數的複雜邏輯

---

## 結論

**核心問題**：
1. ❓ URL 參數的額外好處是否必要？
2. ❓ 為什麼當初沒有深入評估 Zustand 原生方案？
3. ❓ URL 參數方案是否符合 state-management 決策的「簡單、Agent 友好」原則？

**建議**：
- 先確認 URL 參數的額外好處是否必要
- 如果必要，解決設計矛盾
- 如果不必要，考慮簡化方案或改用 Zustand 原生方案

