# Story 5.5: Next Engine 庫存與倉庫 API 補強

**所屬 Epic**: [Epic 5: Next Engine 多平台 MVP（Phase 1.3）](../epics/epic-5-next-engine-mvp.md)  
**狀態**: ⚪ pending  
**對應 Roadmap**: Phase 1.3（多平台 MVP）  
**預估工期**: 2 個工作天

---

## Story 描述

在 Story 5.2 完成店舖 / 商品的基本串接後，補強 Next Engine 庫存與倉庫相關 API，包括查詢庫存、更新庫存、查詢倉庫等功能，並提供完整測試腳本。僅在 Story 5.1～5.3 驗收無誤後啟動，避免在資料模型尚未確認前實作過多 API。

> 參考文件：`docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md`、`docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md`

---

## 前情提要

- Next Engine Connection / 商品建立流程已在 Story 5.2 完成。
- 需要在此 Story 將庫存與倉庫 API 接入，供前端或後續平台功能使用。

---

## 依賴與前置條件

1. Story 5.1～5.3 已完成並通過 User Test。  
2. Sandbox 環境可穩定建立商品與店舖，並可在 Next Engine 後台查詢資料。

---

## 範圍定義

### ✅ 包含
- 實作以下 API 的服務層封裝與測試：
  - 查詢庫存（主倉）`/api_v1_master_stock/search`
  - 更新庫存（分倉）`/api_v1_warehouse_stock/upload`
  - 查詢倉庫列表 `/api_v1_warehouse_base/search`
- 撰寫對應測試腳本或操作說明，確保可在 sandbox 中完成上述操作。
- 視需要更新 `metadata` 結構（例如記錄倉庫資訊）。

### ❌ 不包含
- 前端呈現或 UX 調整（預留後續 Story 規劃）。
- 在庫連攜 webhook（另行規劃）。

---

## 驗收標準

### Agent 自動化 / 測試
- [ ] 提供程式腳本或測試命令，驗證三組 API 的成功與錯誤情境。
- [ ] 將結果記錄於審計或 log，供除錯追蹤。

### User Test
- [ ] Human 確認在 Next Engine 後台可看到對應的庫存更新或倉庫資訊（必要時提供操作說明）。

---

## 交付與文件更新
- [ ] 更新 `NEXT_ENGINE_PLATFORM_SPEC.md` 欄位對照表（若有新增 metadata）。
- [ ] 在 `NE-OVERVIEW.md` 補充庫存／倉庫 API 測試操作步驟。

---

## 風險與備註
- 在庫更新使用 CSV 上傳且有等待時間（`wait_flag`），需考慮非同步處理與重試邏輯。
- 若 sandbox 無法完整測試（例如無權限操作庫存），需記錄並在 Run 中提出支援需求。
