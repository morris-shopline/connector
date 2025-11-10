# Current Run

**Run ID**: run-2025-11-10-01  
**類型**: Refactor + Feature Integration  
**開始時間**: 2025-11-10 — 實作開始  
**完成時間**: -  
**狀態**: 🚧 in-progress（2025-11-10 啟動，負責 Agent：GPT-5 Codex）

---

## 任務範圍（粗列，待 Story 展開）

- [`Story R1.1`](../backlog/stories/story-r1-1-multi-platform-state.md)（in-development）：登入 / 登出 / 授權流程對齊、Zustand + Router Query 擴展，關閉 Issue 2025-11-06-001。
- [`Story R3.0`](../backlog/stories/story-r3-0-connection-data-model.md)（ready-for-dev）：Connection 資料模型與 Migration，提供後端 API 新結構。
- [`Story R3.1`](../backlog/stories/story-r3-1-connection-state-sync.md)（ready-for-dev）：Connection 狀態同步與 Router 單向來源，收斂 Refactor 1 backlog。
- [`Story R3.2`](../backlog/stories/story-r3-2-token-lifecycle.md)（ready-for-dev）：Token lifecycle、重新授權與錯誤碼標準化，關閉 Issue 2025-11-07-001。

> ⚠️ Story 詳細拆解將由 PM / Architect 進一步確認；此 run 文件先鎖定開發範圍與驗收節奏。

---

## 背景與重構目標補充

- **現況辨識**  
  - 早期實作以「商店（store）」為核心，但實際上 admin 登入後看到的「商店列表」 = 「平台（目前僅 Shopline 2.0） × 平台授權帳戶」的組合。  
  - 每一列物件同時承載 webhook 訂閱、事件查詢、Admin API 測試、儲存的 API token 與到期時間等資訊，實際是一個「Connection」實體，而非單純的商店。

- **此次重構目標**  
  - **前台體驗維持不變**：登入、切換連線、授權與測試流程需與現行操作一致。  
  - **後端與狀態模型正名與拆分**：將原「store」相關資料調整為 Connection 架構（platform × account），移除對單一平台的硬綁。  
  - **為多平台擴充預備**：確保下一階段導入 NE（Next Engine）時，只需新增平台定義與授權流程，即可沿用現有的 Connection 基礎。

- **關鍵不變 / 必須維持**  
  - 使用者身份／權限流程、登入後能操作的既有功能（列表、webhook、Admin API）與介面操作。
  - 既有資料在 migration 後可被正確映射為 Connection，不破壞歷史紀錄或 token 狀態。

- **關鍵變更 / 需注意詞彙**  
  - 「商店列表」改以 Connection 概念思考；前端文案是否調整可視需求，但內部邏輯一律使用 Connection。
  - Zustand / Router 狀態欄位需從 `selectedStore` 過渡到 `selectedPlatform + selectedConnectionId` 的組合。
  - Repository / Service 需對應新的資料表（`integration_accounts`, `connection_items` 等），並保持向後相容。

---

## 關鍵相依

- Refactor 1 階段 1 架構（Zustand + Router）已存在，需先收斂遺留 Issue 後再進 R3。
- R3.1 依賴 R1.1 與 issue 修正完成，否則 Router 單向同步會失敗。
- R3.2 依賴 R3.0（資料模型）與 R3.1（前端狀態）完成。
- Migration 前必須確認資料庫備份 / staging 演練方案。

---

## 架構師協作流程

| 時點 | 內容 | 交付 | 負責人 |
|------|------|------|--------|
| Run Day 0 | **Kickoff Review**（R1.1 + 全體 Story） | - 確認 Router/State 命名與資料模型一致<br>- 記錄決議於本文件與各 Story | PM + Architect |
| Phase B 前 | **Schema Checkpoint**（R3.0） | - Prisma schema 草稿審核<br>- Migration 備援方案確認 | Architect + DBA |
| Phase C 草稿 PR | **Interaction Demo**（R3.1） | - 錄影或 QA instance 驗證 Router 單向同步 | PM 提供，Architect 審核 |
| Phase D 前 | **Security Checkpoint**（R3.2） | - 錯誤碼、重新授權流程資安確認 | Architect + Backend Lead |
| Run 收尾 | **Final Review**（整體） | - 四個 Story 驗收勾選「Architect ✅」<br>- 決議紀錄更新 `docs/memory/architecture/current.md`（若有 schema 變更） | Architect |

> 若架構師提供補充決策，請建立或更新 `docs/memory/decisions/*` 對應文件。

---

## 進度紀錄

- 2025-11-10：Kickoff 決議確認完畢後正式開啟 Run。Story R1.1 進入 `in-development`，開始執行 Phase A 任務與 Issue 2025-11-06-001 收斂準備。

### Run Day 0 Kickoff（2025-11-10）

- **出席**：PM（你）、Architect（我）
- **議題與結論**：
  1. **URL 參數策略**  
     - `connectionItemId` 作為主要識別；若 URL 僅帶此參數，前端需透過後端查詢補齊 `connectionId` 與 `platform`。  
     - 預設仍寫回三個參數，以利分享 / 除錯；若缺少 `connectionId` 或 `platform`，`useConnectionRouter` 將自動補齊並更新 URL。  
     - Story R1.1 / R3.1 需在測試清單中加入「僅帶 connectionItemId 進入頁面」的情境。
  2. **命名一致性**  
     - 前端 store 欄位與後端 schema 保持 `selectedPlatform` / `selectedConnectionId` / `selectedConnectionItemId`。  
     - R3.0 Prisma Schema 中 `connection_items.platform` 為冗餘欄位，用於加速查詢，命名維持不變。
  3. **文件同步**  
     - Kickoff 決議已記錄於此文件；若後續實作需要更新決策文件，負責 Story 的開發者需同步更新 `docs/memory/decisions/connection-state-sync.md`。
- **後續行動**：
  - PM：通知開發團隊，Story 進入 Phase A，可依序啟動。  
  - Architect：在 Phase B 開始前安排 Schema Checkpoint（暫定 2025-11-11 下午）。

---

## 建議開發 / 測試階段

### Phase A — Issue & R1.1 基礎穩定
- 對應 Story：`Story R1.1`（ready-for-dev）
- 完成內容：`issue-2025-11-06-001` + 登入／登出清理 + 平台維度注入。
- **測試操作**：
  - 登入 → 確認平台 / Connection 列表載入與 URL 同步。
  - 切換平台 / Connection → 無閃跳，Router Query 正確。
  - 登出 → URL、Zustand、localStorage 皆清空；重新登入異帳號不殘留舊資料。
  - 直接輸入僅含 `connectionItemId` 的 URL → 自動補齊其餘參數並更新狀態。

### Phase B — R3.0 資料模型落地
- 對應 Story：`Story R3.0`
- 完成內容：`integration_accounts`、`connection_items`、必要 migration / repository 調整。
- **測試操作**：
  - 跑 migration 演練（本地 / staging），驗證回滾。
  - 首頁 Connector 列表仍可展示資料。
  - 測試專用 box 顯示實際 DB 欄位名稱 + 值（僅非 production 顯示）。

### Phase C — R3.1 Router 單向同步
- 對應 Story：`Story R3.1`
- 完成內容：`useConnectionRouter` hook、頁面整合、Refactor 1 backlog 收斂。
- **測試操作**：
  - 跨頁切換 Connection（Dashboard ⇄ Webhook ⇄ Admin API）不閃跳。
  - 直接輸入附帶 Query 的 URL → 正確還原狀態。
  - 不帶 Query reload → 預設 Connection 合理。
  - Browser Back/Forward 正確還原選擇。

### Phase D — R3.2 Token lifecycle / Reauth
- 對應 Story：`Story R3.2`
- 完成內容：標準化 token/session 錯誤碼、前端提醒、重新授權流程。
- **測試操作**：
  - 無 Connection → 走授權流程 → 回到系統後自動帶入新 Connection。
  - 模擬 token 過期 → 顯示重新授權提示 → 成功再授權後恢復功能。
  - Admin API / Webhook 測試頁操作時鎖定機制正常（loading 期間禁止切換）。

---

## 最終 User Test（回歸組）

1. 登入 → 查看平台 × Connection 列表。
2. 切換平台、帳戶 → 確認資料與 UI、URL 一致（含測試 box 資訊）。
3. 若無 Connection：完成授權流程 → 新 Connection 顯示在列表與測試 box。
4. 在 Admin API / Webhook 測試頁跑一次 API 操作（token lifecycle + 鎖定機制）。
5. 登出 → 重新登入另一帳號，確認舊資料不被帶入。

---

## Phase A 開發計畫

- **預期交付**：
  - 更新 `useStoreStore`（或等效檔案）至 `selectedPlatform` / `selectedConnectionId` / `selectedConnectionItemId` 與 `lockConnectionItem`、`resetState` API。
  - 建立 `useConnectionRouting` helper（或命名為 `useConnectionRouter` 前置版本）負責解析/補齊 URL Query。
  - 完成登入、登出、授權回呼流程的 Router + localStorage 對齊邏輯。
  - 移除暫時性雙向同步程式，完全改以 URL 單一來源。
  - 撰寫 `connectionCache` 工具（localStorage），並加上 version 管理。
- **開發驗收條件**：
  - 單元測試覆蓋 Store action、Router helper 補齊邏輯。
  - E2E 覆蓋：登入流程、切換 Connection、僅帶 `connectionItemId` 的 URL、登出清理。
  - Issue 2025-11-06-001 標記為 resolved，並在 Story 驗收區塊勾選架構師 Initial Review。
  - PR 描述附 Kickoff 決議摘要與測試結果表。
- **User 實測預告**（本輪完成後請 PM 驗收）：
  1. 使用測試帳號登入 → 確認列表顯示並切換 2 次，觀察 URL 變化。
  2. 手動輸入僅含 `connectionItemId` 的網址重新載入 → 確認平台與 Connection 名稱自動定位。
  3. 登出 → 再次登入其他帳號 → 確認無殘留資料與 URL Query。
  4. 重新授權任一 Connection（若測試環境允許）→ 回到系統時確認最新 Connection 被選中。

---

## 待確認事項

- 測試專用 box 的實作與顯示位置（建議僅在 `NODE_ENV !== 'production'` 時渲染）。
- Migration 與備份腳本的安排（需要 DevOps / Architect 確認）。
- Story 展開與排程：**已完成**（見上方 Story 連結）。仍需在 Kickoff 後確認時間表。
- 架構師 Kickoff / Final Review 時程：需與 Architect（指派 TBD）取得共識並於本文件回填結果。

---

**最後更新**: 2025-11-10
