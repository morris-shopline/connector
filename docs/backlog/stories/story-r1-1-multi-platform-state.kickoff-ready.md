# Story R1.1: 多平台狀態管理擴展（Zustand + Router 對齊）

**所屬 Refactor**: [Refactor 1: 狀態管理階段 1 基礎架構（Phase 1 準備）](../refactors/refactor-1-state-management-phase1.md)  
**狀態**: ✅ ready-for-dev  
**建立日期**: 2025-11-10  
**安排 Run**: run-2025-11-10-01（Phase A 基礎穩定任務）  
**相關 Issue**: [Issue 2025-11-06-001](../issues/issue-2025-11-06-001.md)  
**相關決策**: 
- `docs/memory/decisions/state-management.md`
- `docs/memory/decisions/connection-state-sync.md`

---

## 前情提要

- R1.0 已導入 Zustand 以取代分散的頁面狀態，但仍以單一 `selectedHandle` 表示當前選擇。
- Run-2025-11-10-01 將以 Connection（Platform × Account）為核心，需先於 Phase A 收斂登入初始化、登出清理、localStorage 對齊與 Router 單向同步的基礎行為。
- Refactor 3 系列（R3.0~R3.2）都假設前端側已有「平台 + Connection」的狀態表述方式，否則無法串接新的資料模型與 Token lifecycle 流程。

---

## Story 描述

擴展前端狀態管理與 Router Query，確保：

1. Zustand 以 `selectedPlatform`、`selectedConnectionId`、`selectedConnectionItemId` 三個欄位取代單一 handle。
2. 登入 / 登出時的初始化、清理流程與 localStorage 快取全面對齊。
3. Router Query (`?platform=` / `?connectionId=` / `?connectionItemId=`) 成為單一來源，供後續 Story R3.1 單向同步套用。
4. 針對 Issue 2025-11-06-001 的暫時修補程式（只保留 URL → Store）改為正式架構，並補齊測試。

此 Story 完成後，R3.0~R3.2 才能進入開發。

---

## 範圍與交付重點

- ✅ 完成 Zustand Store 結構更新與型別調整。
- ✅ 撰寫登入、登出、授權回呼流程的初始化/清理腳本（含 localStorage 與 Router）。
- ✅ 更新 Router Query 映射邏輯，提供實用型 helper（供 R3.1 使用）。
- ✅ 收斂並關閉 Issue 2025-11-06-001。
- ✅ 提供測試清單與自動化測試範例（E2E + 單元）。

---

## 架構師協作

- **Kickoff Review（必做，Run Day 0）**
  - 與架構師逐項確認資料模型欄位命名、Router Query 參數規格、localStorage 格式。
  - 審核 `docs/memory/decisions/connection-state-sync.md` 是否需補充，若有補充請同步更新。
  - Kickoff 結果請記錄於 `docs/context/current-run.md` 的「架構師協作」小節。
- **Implementation Checkpoint（Run 中段）**
  - 在 PR 草稿階段請架構師檢視 Zustand 型別介面與 Router helper API，避免後續 Story 變更。
- **Final Review（Run 結束前）**
  - 架構師確認：
    - 新狀態欄位與資料模型（R3.0）名稱一致。
    - Router 單向同步的 hook 介面符合 R3.1 規格。
  - 將結果填寫於 Story 文件「驗收標準」並於 run 文件標註「Architect ✅ Final Review」。

---

## 實作項目

### 1. Zustand Store 與型別更新
- 更新 `frontend/stores/useStoreStore.ts`：
  - `selectedHandle` → `selectedConnectionId`（string | null）
  - 新增 `selectedPlatform`、`selectedConnectionItemId`
  - 更新 `lockHandle` → `lockConnectionItem`（保留向後相容 alias）
  - 提供 `resetState()` 用於登出與授權失敗回復
- 更新對應的 TypeScript 型別與 selector（`frontend/types/connections.ts` 若存在）

### 2. Router Query 轉換層
- 建立 `frontend/hooks/useConnectionRouting.ts`（供 R3.1 繼承）：
  - `parseConnectionQuery(query)` → 回傳 `platform`, `connectionId`, `connectionItemId`
  - `buildConnectionQuery(state)` → 產生新的 query 物件
  - `applyConnectionToRouter(options)` → 封裝 `router.replace`
- 將頁面入口（`index.tsx`, `webhook-test.tsx`, `admin-api-test.tsx`）改為使用上述 helper

### 3. 登入 / 登出與授權流程
- 在 `frontend/pages/api/auth/*` 或 Next Auth handler（若存在）中：
  - 登入成功 → 從後端取得平台列表與預設 Connection，呼叫 helper 設定 Router + Store
  - 登出 → 呼叫 `resetState()`，並清除 localStorage、Router Query
- 授權回呼（Shopline OAuth 回來）：
  - 接收到新的 Connection 後，更新 localStorage 與 Router Query

### 4. localStorage 與快取策略
- 建立 `frontend/utils/connectionCache.ts` 管理資料格式：
  - `version` 欄位（初始 `v1`）
  - `lastSelectedPlatform`、`lastSelectedConnectionId`
  - 提供 `loadConnectionCache()` / `saveConnectionCache()` / `clearConnectionCache()`

### 5. 測試
- **Unit**
  - Router helper 函式（parse/build/apply）
  - Zustand store 行為（lock、reset、變更）
- **E2E（Playwright / Cypress）**
  - 登入 → 頁面刷新 → 保持同平台與 Connection
  - 登出 → Router Query 與 localStorage 清空
  - 授權完成後回到系統 → 新 Connection 自動選中
- **Regression**
  - Issue 2025-11-06-001 重新操作情境，不得出現閃跳

---

## 驗收標準

- [ ] Kickoff Review 完成並於 run 文件記錄結論
- [ ] Zustand Store 新欄位與 action 實作完成，型別檢查通過
- [ ] Router Query 單一來源策略落地，E2E 測試覆蓋登入/登出/授權流程
- [ ] localStorage 快取依據 helper 實作，提供 reset 與版本檢查
- [ ] Issue 2025-11-06-001 狀態更新為 `resolved`
- [ ] Story 文件測試清單全部勾選，並附上操作步驟截圖或錄影連結
- [ ] 架構師 Final Review 確認並於文件簽註（勾選 + 註明 reviewer）

---

## 測試計畫（測項需 PR 描述附帶結果）

- **登入流程**
  - 測試帳號 A 登入 → 觀察 Router Query 與 Zustand 狀態
  - 重整頁面 → 狀態維持
  - 切換 Connection → Router Query 同步
- **僅帶 `connectionItemId` 的 URL**
  - 直接輸入僅含 `connectionItemId` 的連結  
  - 確認頁面自動補齊 `platform` / `connectionId` 並更新 URL
- **授權回呼**
  - 模擬無 Connection → 走授權流程 → 回到系統後自動選中最新 Connection
- **登出流程**
  - 登出後，手動檢查 localStorage / sessionStorage / IndexedDB（若有）不留殘值
- **多分頁行為（可選）**
  - 在第二個分頁開啟同一系統，確認 Query 解析行為一致

---

## 文件與交付

- 更新 `docs/context/current-run.md` Phase A 測試與操作清單（於實作完成後回填結果）
- 若 Router Query 格式有新增欄位，需同步更新 `docs/memory/architecture/current.md` 的狀態管理章節
- PR 描述需附上：
  - Kickoff 與 Final Review 的結論摘要
  - 測試結果表格（包含手動 + 自動測試狀態）

---

## 風險與備註

- 若未按 `version` 機制清理 localStorage，可能導致過期資料造成錯誤，務必實作版本檢查。
- Router helper 若在 R3.1 再度調整，需要同步通知 PM 更新本 Story 文件（避免規格漂移）。
- 後續多平台（NE）導入時，需於 Kickoff Review 確認平台識別欄位（`platformCode`）不可硬編碼。

---

**最後更新**: 2025-11-10

