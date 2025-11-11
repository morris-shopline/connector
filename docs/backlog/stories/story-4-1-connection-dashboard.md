# Story 4.1: Connection Dashboard 與列表體驗

**所屬 Epic**: [Epic 4: Connection 管理體驗（Phase 1.2）](../epics/epic-4-multi-store-management.md)  
**狀態**: ✅ completed  
**完成 Run**: -  
**建立日期**: 2025-11-11  
**對應 Roadmap**: Phase 1.2（多商店管理）

---

## Story 描述

重構 Admin 首頁（登入後落地頁），以「Connection 管理」為核心，導入新的 Connection Rail、Workspace Tab 與 Overview Dashboard，支援多平台、多 Connection 的瀏覽、狀態辨識與後續操作。此 Story 聚焦於 UI 架構與列表體驗，不含 OAuth Flow／權限檢查（分別由 Story 4.2 與 4.3 處理）。

> ⚠️ **依賴提醒**：Story 4.1 建立的 Activity Dock 容器、Context Bar 與 Connection Rail，會在 Story 4.2/4.3 中被直接復用並擴充。請確保元件與狀態命名保持穩定，避免後續流程落掉整合。

**核心目標**：
- 依 `ADMIN_APP_UI_ARCHITECTURE.md` 實作 Primary Nav + Context Bar + Workspace Canvas 架構。
- 依 `CONNECTION_MANAGEMENT_UI_DESIGN.md` 完成 Connection Rail、Overview Tab、空態與狀態徽章。
- 將現有「商店列表」頁面替換為新的 Connection Landing Page（登入後預設顯示）。
- 為後續多平台（Phase 1.3）與 Flow 功能（Phase 3）預留容器與元件層級。

**範圍說明**：
- ✅ 包含：前端頁面結構調整、組件建立、API 串接 `/api/connections`、狀態顯示、空態／錯誤態、基本篩選與搜尋欄位（UI wiring，可先無後端）。
- ❌ 不含：新增/重新授權/停用流程（Story 4.2）、權限驗證與審計（Story 4.3）、Flow Builder/排程等後續模組。

---

## 前情提要

### 架構基礎
- ✅ Refactor 3（R3.0 / R3.1 / R3.2）已完成：`integration_accounts` / `connection_items` schema、Zustand URL 初始化策略、Token Lifecycle 錯誤碼。
- ✅ Design Spec：`ADMIN_APP_UI_ARCHITECTURE.md`、`CONNECTION_MANAGEMENT_UI_DESIGN.md` 已定義全域與模組層級的 UI 分層。
- ✅ API 基礎：`GET /api/connections` 可取得使用者的 Connection 與 Connection Items（Shopline 平台）。

### 相關決策
- `docs/memory/decisions/state-management.md`: Zustand 為唯一 Source of Truth。
- `docs/memory/decisions/connection-state-sync.md`: URL → Zustand 初始化策略，禁止雙向同步。
- `docs/memory/decisions/token-lifecycle-handling.md`: Token 狀態徽章與錯誤提示方式。
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`: Admin App 全局結構。
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`: Connections 模組流程與元件。

---

## 🚨 前置條件（Human / 其他 Story）
1. **資料可用性**：`/api/connections` 需已回傳 Shopline Connection 與 Items（R3.0 output）。
2. **登入流程**：Story 3.x 完成之 Admin 登入/保護需可正常運作，確保登入後可取得 session。
3. **設計確認**：與產品/設計確認 `ADMIN_APP_UI_ARCHITECTURE.md`、`CONNECTION_MANAGEMENT_UI_DESIGN.md` 無需再調整大方向。

---

## 現況盤點與重構指示（開發前必做）
1. **取代現有首頁**：將 `frontend/pages/index.tsx` 從「商店列表」頁面改為單純 redirect → `/connections`，並刪除舊有商店卡片相關 JSX。不要保留舊版頁面。
2. **建立新頁面骨架**：在 `frontend/pages/connections/index.tsx`（新建）中掛載全新的 `PrimaryLayout`（含 Primary Nav、Context Bar、Activity Dock 空容器、Workspace Content）。
3. **拆除舊組件**：
   - 移除或重構 `frontend/components/StoreCard.tsx`、`frontend/components/StoreList.tsx` 等只適用單一商店情境的組件。
   - 若其中資料取得函式會被新流程使用，請直接移轉到新的 `components/connections/*` 中，舊檔案刪除。
4. **新增統一布局元件**：
   - `components/layout/PrimaryNav.tsx`
   - `components/context/ContextBar.tsx`
   - `components/activity/ActivityDock.tsx`
   - `components/connections/ConnectionRail.tsx`
   - `components/connections/Overview/`（放 SummaryCard、ItemsPreview 等）
5. **樣式與路由同步**：更新 `frontend/components/Header.tsx` 使其僅負責 Global Header；原先「商店列表」連結需改為指向 `/connections`，其他連結保持不變。確認登入後落地頁即為新架構。

---

## 技術需求

### 1. 版面調整
- **Primary Nav**：更新為設計規格定義項目（`Connections`, `Webhook`, `Admin API`, `Settings`），使用共用組件 `components/layout/PrimaryNav.tsx`（新建）。
- **Global Header**：擴充現有 Header，使其容納 Workspace 切換預留區與快速操作（此 Story 可顯示 placeholder）。
- **Context Bar**：新增 `components/context/ContextBar.tsx`，顯示目前選取 Connection（平台徽章 + displayName + 狀態），並提供搜尋/切換入口（整合 Story 4.2 完成的流程）。

### 2. Connection Rail
- 新建 `components/connections/ConnectionRail.tsx`：
  - 顯示平台 Segmented Control（Phase 1.2 只有 Shopline；保留 Next Engine 欄位但禁用）。
  - Connection List：顯示 displayName、狀態徽章、到期時間（若存在）。
  - 提供搜尋欄位（前端 filter），`+ 新增 Connection` CTA（呼叫 Story 4.2 流程）。
  - 空態：顯示教學卡與按鈕導向新增流程。
- Zustand 讀取：使用 `useConnectionStore`，依 `connection-state-sync` 決策只在初始化時讀取 URL。

### 3. Workspace Canvas – Overview Tab
- 新建頁面 `frontend/pages/connections/index.tsx` 或改造現有首頁，確保路由為 `/connections`。
- Overview 內容：
  - `ConnectionSummaryCard`（平台徽章、授權時間、Token 到期、Owner）。
  - `StatusTimeline`（顯示最近兩筆事件；資料不足時顯示空態，與 Activity Dock 接軌）。
  - `QuickActionsGrid`（重新授權、同步、開啟 Flow Builder placeholder）。
  - `ConnectionItemsPreview`（列表前 3 筆 Items，附「查看全部」連結）。
- Activity Dock：建立容器區塊（Phase 1.2 顯示空態訊息）。

### 4. 資料串接
- API 呼叫集中於 `frontend/lib/api/connections.ts`（新建）：
  - `fetchConnections()`：回傳 Connection 陣列與 Items。
  - `useConnections()` hook（SWR + Zustand 整合）。
- Error Handling：對應 Token 錯誤顯示 `TOKEN_EXPIRED` 提示（整合共用錯誤處理）。

### 5. 狀態管理＆初始化
- `useConnectionStore`：
  - 新增 `setConnections`, `setSelectedConnection` actions。
  - 初始化流程：`useInitConnectionFromURL()` 在 `_app.tsx` 啟動；成功後設定 Context Bar／Rail。
- 網路狀態 loading/error：提供 Skeleton 與錯誤重試。

### 6. 路由與權限
- `/` 根路由重導向 `/connections`（僅在登入狀態）。
- 未登入時保留既有登入流程，不受影響。

### 7. 元件與檔案結構
```
frontend/
├── pages/
│   ├── index.tsx (redirect -> /connections)
│   └── connections/index.tsx (新首頁)
├── components/
│   ├── layout/PrimaryNav.tsx
│   ├── context/ContextBar.tsx
│   ├── connections/
│   │   ├── ConnectionRail.tsx
│   │   ├── ConnectionSummaryCard.tsx
│   │   ├── ConnectionItemsPreview.tsx
│   │   └── ConnectionStatusPill.tsx
│   └── activity/ActivityDock.tsx (空態)
├── stores/useConnectionStore.ts (擴充)
└── lib/api/connections.ts
```

---

## 測試計劃

### 🧪 Agent 功能測試
- Connection Rail 載入：
  - 無資料 → 顯示空態並提供新增按鈕。
  - 有資料 → 顯示正確數量/狀態徽章/到期時間。
- Context Bar：切換 Connection 後顯示正確平台徽章與狀態。
- Overview 卡片：顯示授權時間、Owner、最近事件；資料缺失時顯示空態文案。
- `useConnectionStore` 初始化：`router.isReady` 只觸發一次，不重複同步；切換 Connection 不更新 URL。
- `/` redirect：登入狀態訪問 `/` 自動導向 `/connections`；未登入則仍導向登入頁。
- Activity Dock 空態：顯示「目前沒有通知」訊息。
- ESLint / TypeScript 全數通過。

### 👤 User Test 建議
1. 使用者登入 → 落地 `/connections` → 檢查左側 Connection Rail、上方 Context Bar、Overview 卡片呈現。
2. 切換不同 Connection → Overview 即時更新 → 無畫面閃爍。
3. 模擬沒有任何 Connection 的帳號 → 檢查空態導引與新增按鈕。
4. 檢查 Global Header 與 Primary Nav 項目 → 確認符合架構文件。
5. 確認 Activity Dock 空態與 quick actions 可見（按鈕待 Story 4.2 實作）。

---

## 驗收標準
- ✅ 登入後預設導向 `/connections`，頁面結構符合設計規格。
- ✅ Connection Rail / Context Bar / Overview Tab 元件皆使用共用組件並整合 Zustand state。
- ✅ 空態／錯誤態文案與設計相符，提供新增 Connection CTA。
- ✅ Story 文件內所有測試項目均完成並記錄結果；User Test 步驟可依照上述流程驗證。
- ✅ 後續 Story 4.2 / 4.3 可直接復用本 Story 建立的元件與狀態（無需重新調整版面）。

---

## 參考文件
- `docs/reference/design-specs/ADMIN_APP_UI_ARCHITECTURE.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- `docs/memory/decisions/state-management.md`
- `docs/memory/decisions/connection-state-sync.md`
- `docs/memory/decisions/token-lifecycle-handling.md`
- `docs/backlog/epics/epic-4-multi-store-management.md`

