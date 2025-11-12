# Story 5.3: 前端 Connection UX 延伸與重新授權整合

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: 🛠 planning  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 3 個工作天

---

## Story 描述

將 Next Engine 納入現有的 Connection Dashboard 與工作流，確保使用者可以在前端選取 Next Engine Connection、查看資料摘要、觸發重新授權與錯誤提示。需保持與 Epic 4 相同的體驗，並確保多平台切換的狀態同步正確。

> 參考文件：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`、`docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`、`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`

---

## 前情提要

- Story 5.1 / 5.2 已提供後端 OAuth、Connection Item 與資料讀取 API。
- Epic 4 的 UI 已實作平台分段控制（目前僅 Shopline，Next Engine 選項為 disabled）。
- `useConnection` store 與 URL 初始化策略在 Refactor 3 中已完成。

---

## 依賴與前置條件

1. Story 5.1 的 API `/api/auth/next-engine/*` 可用，並在 Activity Dock 寫入事件。
2. Story 5.2 的資料 API 與 Prisma 結構已完成並通過自動測試。
3. `frontend` 已具備平台徽章／顏色系統，可新增 Next Engine 專屬設定。

---

## 範圍定義

### ✅ 包含
- 在 Connection Dashboard 的平台分段控制中啟用 Next Engine 選項，顯示平台徽章與色票。
- `ConnectionRail` 顯示 Next Engine Connection，並可切換顯示 Connection Item / 訂單摘要。
- 建立 Next Engine 專用的重新授權流程（沿用既有 Modal，文案自訂）。
- Toast / Activity Dock 顯示 Next Engine 欄位（含錯誤訊息翻譯）。
- 確保 `useConnection` store 與 URL 同步在多平台情境下正常（含 Deep-link）。
- 新增平台文案檔案（例如 `frontend/content/platforms/next-engine.ts`）。

### ❌ 不包含
- 進階報表或平台專屬工作流（Phase 2）。
- 在庫連攜 UI（後續專案）。

---

## UI / UX 要點

- Context Bar 顯示公司名稱、平台徽章、授權狀態（Active / Token Expired / Error）。
- Overview Tab 需顯示：
  - 主要店舖（Connection Item）摘要與 `metadata.mallName`。
  - 訂單摘要（總數、最近同步時間）。
  - Activity Dock 列出授權、資料同步事件（沿用 Story 5.1 / 5.2 提供的紀錄）。
- 重新授權提示：Token 過期時顯示橘色 Banner，提供立即重新授權按鈕。
- Next Engine 特有錯誤（例如 002003）需對應中文提示訊息並建議使用者操作；若無官方對照說明，請記錄情境並於 Run 中回報。

---

## 驗收標準

### Agent 自動化 / 測試
- [ ] 僅有 Shopline 授權時，Next Engine 分段控制顯示但為 disabled。
- [ ] 授權 Next Engine 後，頁面自動切換至新 Connection，並顯示正確資料。
- [ ] 多平台切換時，URL 參數 `platform`、`connectionId`、`itemId` 正確更新。
- [ ] 模擬 Token 過期（呼叫後端腳本）後，橘色 Banner 顯示並可觸發重新授權流程。
- [ ] Activity Dock 顯示 Next Engine 授權成功與 API 錯誤事件，錯誤訊息翻譯與映射正確。

### User Test（Human 專注於 UI 體驗）
- [ ] 走完「新增 Next Engine Connection → 查看資料 → 重新授權」全流程皆成功，畫面體驗符合設計。
- [ ] 切換回 Shopline 再回到 Next Engine，資料與狀態保持一致，無閃跳或殘留。
- [ ] Next Engine API 拋錯時，Toast 顯示中文訊息且 Activity Dock 提供詳細資訊（Agent 先驗證 API，Human 最終檢視 UI）。

---

## 交付與文件更新
- [ ] 更新 `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md` 的 Next Engine 相關章節。
- [ ] 在 `docs/reference/guides/NE-OVERVIEW.md` 補充前端操作步驟與注意事項。
- [ ] 若新增平台文案或 icon，記錄於 `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`。

---

## 風險與備註
- Next Engine API 回應速度較慢，需評估 Loading 狀態與緩存策略。
- 錯誤訊息翻譯需與 PM / CS 協調，避免使用者看到日文原文。
- 若將來新增第三個平台，需檢查平台分段控制的可擴充性（Story 5.3 完成後可整理為 UI Component 指南）。
