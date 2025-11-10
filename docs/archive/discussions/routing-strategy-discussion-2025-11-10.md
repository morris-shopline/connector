# 路由策略討論

**日期**: 2025-11-10  
**目的**: 討論 URL 作為可分享上下文的實作方式

---

## 問題背景

當前實作使用 Query Parameters 表示核心資源（Connection）：
```
/webhook-test?platform=nextengine&connectionId=123
```

這導致：
- 每次切換 Connection → 更新 query → 觸發 `routeChangeComplete` → 循環
- 違反「單向：URL → Zustand（只做一次初始化）」原則

---

## 業界做法研究

### 業界標準做法

**核心資源 → 動態路由（pathname）**：
- GitHub: `/repos/owner/repo/issues/123`
- Vercel: `/project/[projectId]/settings`
- Shopify: `/products/[productId]/variants`

**非核心狀態 → Query Parameters**：
- GitHub: `/repos/owner/repo/issues/123?labels=bug&sort=created`
- Vercel: `/project/[projectId]/settings?tab=general`
- Shopify: `/products/[productId]/variants?status=active`

### 為什麼這樣做？

1. **Pathname 變化是「路由變化」，不是「狀態同步」**
   - Next.js 的 `routeChangeComplete` 對 pathname 變化是預期的路由行為
   - 不會造成狀態同步的循環問題

2. **Query Parameters 用於篩選、排序、分頁等非核心狀態**
   - 這些狀態變化不需要觸發複雜的狀態同步邏輯

3. **URL 語義更清晰**
   - `/webhook-test/nextengine/123` 比 `/webhook-test?platform=nextengine&connectionId=123` 更直觀

---

## 討論結論

### 決策

1. **應該用動態路由處理核心資源**
   - `/webhook-test/[platform]/[connectionId]`
   - `/admin-api-test/[platform]/[connectionId]`

2. **Query Parameters 只用於非核心狀態**
   - 篩選、排序、分頁等

3. **現階段先簡化**
   - 移除 Zustand 回寫 URL 的邏輯
   - 確保 Zustand 是唯一的 Source of Truth
   - 現階段不會有 URL 分享上下文的情境

4. **動態路由重構在後續處理**
   - 作為獨立的 Refactor Story
   - 當需要 URL 分享上下文功能時再處理

---

## 相關文件

- 決策記錄：`docs/memory/decisions/routing-strategy.md`
- 狀態管理決策：`docs/memory/decisions/state-management.md`

---

**最後更新**: 2025-11-10

