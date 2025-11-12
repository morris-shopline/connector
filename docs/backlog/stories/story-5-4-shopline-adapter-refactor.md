# Story 5.4: Shopline Platform Adapter 重構

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ⚪ pending  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2 個工作天

---

## Story 描述

在 Story 5.1～5.3 完成並通過實機驗證後，將現有的 Shopline 授權／API 流程重構為與 Next Engine 一致的 Platform Adapter 架構。目標是讓所有平台共用同一套 `PlatformServiceFactory` 介面，降低後續多平台擴充成本。

> ⚠️ 此 Story 需在 Next Engine 功能與 User Test 確認無誤後才啟動。
> 參考文件：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`、`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`

---

## 前情提要

- 目前 Shopline 流程直接使用 `ShoplineService`，並由各路由直接 instanciate。
- Epic 5 Story 5.1 已建立 Next Engine Adapter 與 Platform Service Factory 基礎。
- User Test 須先確認 Shopline 與 Next Engine 在新 UI 上的體驗皆正常，以免重構與驗收混在一起。

---

## 依賴與前置條件

1. Story 5.1～5.3 完成並通過一輪 User Test。  
2. Next Engine adapter 架構已驗證可行。  
3. 相關錯誤碼映射、Activity Dock 事件已整理完成。

---

## 範圍定義

### ✅ 包含
- 建立 `ShoplineAdapter`，提供與 Next Engine adapter 一致的方法（authorize、exchangeToken、refreshToken、getIdentity 等）。
- 更新 `PlatformServiceFactory`（或等價模組）讓 `platform = shopline` 時回傳新的 adapter。
- 重構 `routes/auth.ts`、`routes/api.ts`、`routes/webhook.ts` 使其只透過 Factory 取得 adapter，不再直接 new `ShoplineService`。
- 更新或移除舊的 `ShoplineService` 中與平台耦合的邏輯。
- 撰寫單元測試確保 OAuth / refresh / API 呼叫在新架構下維持原行為。

### ❌ 不包含
- 新增 Shopline 功能或 UX 調整（僅限重構）。
- Next Engine adapter 的新增功能，此 Story 以 Shopline 平台為主。

---

## 技術重點與實作要點

- 新 adapter 與 Next Engine adapter 對齊介面，並集中共用邏輯（例如錯誤型別、活動事件 schema）。
- 若有共用工具（例如簽章、URL 組合），考慮抽取到 `services/platforms/shared/` 等路徑。
- 調整 dependency 注入方式，避免 Adapter 與 Repository 之間出現循環引用。
- 保留 backward-compatible 的資料儲存格式（authPayload 等），避免破壞既有 Connection。

---

## 驗收標準

### Agent 自動化 / 測試
- [ ] `PlatformServiceFactory` 能夠依據 `platform` 回傳 Shopline adapter，並通過單元測試。
- [ ] `POST /api/auth/shopline/install/callback` 等授權路由在新架構下仍能成功運作。
- [ ] `GET /api/connections`、`GET /api/connection-items/:id` 等 API 行為與重構前一致。
- [ ] Webhook 驗證與處理在新架構下仍能正確觸發。

### User Test
- [ ] 重構後再次跑一次 Shopline + Next Engine 的授權 / 資料讀取流程，確認無回歸。

---

## 交付與文件更新
- [ ] 更新 `docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md` 中的「共用架構」章節，標註 Shopline 已切換至 adapter。
- [ ] 更新 `docs/memory/decisions/connection-data-model.md`（或另建決策補充段落）說明 Shopline 遷移完成。
- [ ] 如有抽取共用工具，於 `docs/reference/guides/NE-OVERVIEW.md` 或新文件補充說明。

---

## 風險與備註
- 重構期間需特別注意 Shopline 正式環境授權流程不可中斷，可先在 staging / sandbox 驗證。
- 建議在非尖峰時間佈署，並保留 rollback 策略。
- 若後續還要支援第三個平台，可直接在本 Story 完成後新增 adapter，不需再次大改。
