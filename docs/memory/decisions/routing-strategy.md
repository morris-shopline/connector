# 路由策略決策

**決策日期**: 2025-11-10  
**狀態**: ✅ 已決策

---

## 決策結論

**核心資源使用動態路由（Dynamic Routes），Query Parameters 只用於非核心狀態**

---

## 決策內容

### 業界標準做法

**核心資源 → 動態路由（pathname）**：
```
✅ 正確做法：
/webhook-test/[platform]/[connectionId]
/admin-api-test/[platform]/[connectionId]

❌ 錯誤做法（當前）：
/webhook-test?platform=nextengine&connectionId=123
```

**非核心狀態 → Query Parameters**：
```
/webhook-test/nextengine/123?status=pending&page=1&sort=date
                              ↑ 篩選條件  ↑ 分頁  ↑ 排序
```

### 為什麼這樣做？

1. **Pathname 變化是「路由變化」，不是「狀態同步」**
   - Next.js 的 `routeChangeComplete` 對 pathname 變化是預期的路由行為
   - 不會造成狀態同步的循環問題

2. **Query Parameters 用於篩選、排序、分頁等非核心狀態**
   - 這些狀態變化不需要觸發複雜的狀態同步邏輯
   - 符合業界標準做法（GitHub、Vercel、Shopify 等）

3. **URL 語義更清晰**
   - `/webhook-test/nextengine/123` 比 `/webhook-test?platform=nextengine&connectionId=123` 更直觀
   - 符合 RESTful 設計原則

### 當前問題

**問題根源**：用 Query Parameters 表示核心資源（Connection）
- 每次切換 Connection → 更新 query → 觸發 `routeChangeComplete` → 循環
- 違反「單向：URL → Zustand（只做一次初始化）」原則

**解決方案**：改用動態路由
- 切換 Connection → 更新 pathname → 觸發 `routeChangeComplete` → 這是正常的路由變化，不是狀態同步問題

---

## 實作策略

### 階段 1：現階段簡化（立即處理）

**目標**：確保 Zustand 不會回寫 URL，符合正常 Zustand 使用方式

**做法**：
- 移除 `applyConnection` 中所有 `applyToRouter` 調用
- 移除 `routeChangeComplete` 的同步邏輯
- 只在頁面載入時從 URL 初始化一次（如果 URL 有參數）
- Zustand 是唯一的 Source of Truth，URL 只用於初始化

**影響**：
- 現階段不會有 URL 分享上下文的情境
- 用戶操作只更新 Zustand，不更新 URL
- 刷新頁面時，如果 URL 有參數，會從 URL 初始化 Zustand

### 階段 2：動態路由重構（後續處理）

**目標**：改用動態路由處理核心資源，實現可分享的 URL

**範圍**：
- 建立動態路由頁面：`/webhook-test/[platform]/[connectionId]`、`/admin-api-test/[platform]/[connectionId]`
- 更新所有導航邏輯
- 更新 `useConnectionRouting` Hook
- 確保向後兼容（舊的 query parameters 可以重定向到新路由）

**時機**：
- 當需要 URL 分享上下文功能時
- 作為獨立的 Refactor Story 處理

---

## 相關文件

- 狀態管理決策：`docs/memory/decisions/state-management.md`
- Connection 狀態同步：`docs/memory/decisions/connection-state-sync.md`
- 討論過程：`docs/archive/discussions/routing-strategy-discussion-2025-11-10.md`

---

**最後更新**: 2025-11-10

