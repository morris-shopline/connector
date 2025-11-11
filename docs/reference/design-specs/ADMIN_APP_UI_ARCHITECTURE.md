# Admin App UI 架構設計（Phase 1.2 ~ Phase 3）

**最後更新**: 2025-11-11  
**適用範圍**: Admin 前台所有模組（Connection 管理、Flow 編輯、排程、設定/權限等）  
**關聯決策**: `docs/memory/decisions/state-management.md`, `docs/memory/decisions/connection-state-sync.md`, `docs/memory/decisions/token-lifecycle-handling.md`

---

## 1. 設計目標與原則

1. **統一框架**：提供跨模組一致的頁面結構、狀態呈現與操作節奏，避免每次新增功能時重新堆疊 UI。  
2. **可擴充層級**：對齊 Roadmap Phase 1.2 ~ 3 規劃，明確標示 Phase 2/3 時會啟用的區域與行為。  
3. **狀態一致性**：UI 階層需與 state management 決策吻合，確保 Connection、Flow、Job 等狀態皆由單一 Source of Truth 控制。  
4. **權限導向**：預留角色/權限差異的顯示與操作控管（Owner / Admin / Operator）。  
5. **可測試性**：每個 UI 模組對應清楚的測試矩陣與預期狀態，便於 Story 建立與 Run 驗收。

---

## 2. 全局頁面框架

```
┌───────────────────────────────────────────────────────┐
│ Global Header (簡化)                                 │
│ - LOGO / 專案名稱                                     │
│ - User Menu（個人設定、登出、權限）                   │
├──┬─────────────────────────────────────────────────────┤
│P │ Workspace Canvas                                    │
│r │ - Context Bar（顯示當前平台/Flow/排程等）           │
│i │ - Main Panel                                        │
│m │ - Secondary Panel (Side Pane / Timeline)            │
│a │                                                     │
│r │                                                     │
│y │                                                     │
│  │                                                     │
│N │                                                     │
│a │                                                     │
│v │                                                     │
│  │                                                     │
│( │                                                     │
│圖│                                                     │
│標│                                                     │
│式│                                                     │
│) │                                                     │
├──┴─────────────────────────────────────────────────────┤
│ Activity / Notification Dock                          │
└───────────────────────────────────────────────────────┘
```

**設計重點**：
- Primary Nav 採用圖標式（寬度約 48-64px），最大化 Workspace Canvas 可用空間
- Global Header 簡化，移除重複導覽項目
- 整體布局參考 GA4 風格，讓畫面更乾淨地留給功能本身

- **Global Header**：全局控制列；後續 Phase 2.2 可加入多裝置登入指示、告警。  
  - **設計原則**：簡潔為主，僅保留 LOGO、使用者資訊、登出按鈕；移除重複的導覽項目（已在 Primary Nav）。
- **Primary Navigation**：
  - **設計風格**：參考 GA4，採用圖標式導覽（寬度約 48-64px），僅顯示圖標，hover 時顯示工具提示；使用顏色區別不同模組。
  - Phase 1.2：`Connections`, `Webhook`, `Admin API`, `Settings`（基本）  
  - Phase 1.3：新增 `Platforms`（平台能力設定）  
  - Phase 3.0：加入 `Flows`, `Schedules`, `Jobs`  
  - Phase 3.2：可引入 `Monitoring`（Job 狀態、告警）
- **Workspace Canvas**：依模組切換。
  - `Context Bar`：顯示當前 Connection / Flow / Schedule，提供切換與搜尋。
  - `Main Panel`：主要內容區（列表、編輯器、圖表）。
  - `Secondary Panel`：側欄資訊（詳情、活動記錄、設定）。
- **Activity Dock**：集中顯示重新授權、Job 告警、排程通知（Phase 2 起活化）。

---

## 3. 模組對應與階層

| 模組 | 主要階層 | 進入點 | Phase | 描述 |
|------|----------|--------|-------|------|
| Connection 管理 | Primary Nav → `Connections` | Connection Rail + Tabs | 1.2 | 多平台 Connection 建立、切換、狀態管理（詳見 `CONNECTION_MANAGEMENT_UI_DESIGN.md`） |
| Webhook | Primary Nav → `Webhook` | Context Bar 選取 Connection | 1.2 | 事件列表、測試工具，遵循 Connection state |
| Admin API 測試 | Primary Nav → `Admin API` | Context Bar 選取 Connection | 1.2 | 既有測試工具，整合 Connection 上下文 |
| Settings / Platforms | Primary Nav → `Settings` | 分頁：Profile / Platform Apps / Roles | 1.2 → 1.3 | 管理平台憑證、角色與權限（Phase 2 擴張） |
| Flow Builder | Primary Nav → `Flows` | Flow Canvas + Node Panel | 3.0 | 規劃資料流（Phase 3.0 MVP） |
| Schedule / Jobs | Primary Nav → `Schedules`、`Jobs` | 列表 + 詳情 + Timeline | 3.1 / 3.2 | 資料流排程與 Job 觀測 |
| Monitoring / Insights | Activity Dock / Dashboard | Charts + Alert Feed | 3.2+ | 即時監控、告警匯總 |

---

## 4. 狀態流與層級對應

### 4.1 狀態層級

| 層級 | 來源 | 負責模組 | UI 表現 | Phase |
|------|------|----------|---------|-------|
| **Global** | User Session / Workspace | Header / Primary Nav | 顯示登入者、Workspace 切換、角色 | 1.2 → 2.2 |
| **Platform / Connection** | Zustand（`useConnectionStore`）+ URL 初始化 | Connections, Webhook, Admin API | Connection Rail, Context Bar, Status Pill | 1.2 |
| **Flow** | Zustand（`useFlowStore`）+ Local Draft | Flow Builder | Canvas 狀態、未保存提示 | 3.0 |
| **Schedule / Job** | 後端 API + Zustand | Schedules, Jobs, Monitoring | Timeline、狀態圖示、Activity Dock | 3.1 / 3.2 |

### 4.2 UI ↔ State 對應原則

1. **單一來源**：各模組皆以對應的 Store 為唯一 Source of Truth；URL 只用於初始化或分享。  
2. **上下文同步**：切換 Connection / Flow 時，需更新 Context Bar、側欄及活動記錄。  
3. **權限判斷**：Primary Nav 與操作按鈕需依角色權限顯示/禁用。  
4. **錯誤通道統一**：Token / Session 錯誤走 `Token Lifecycle` 決策的提示模組，Job/Flow 錯誤使用 Activity Dock 呈現。

---

## 5. 視覺與互動模式

### 5.1 常用 Layout 模式

| 模式 | 說明 | 適用模組 |
|------|------|---------|
| List + Detail | 左列表 / 右詳情 | Connections、Schedules、Jobs |
| Canvas + Panel | 中央畫布 + 右側設定 | Flow Builder、Webhook 測試 |
| Wizard | 多步驟建立流程 | 新增 Connection、建立 Flow、設定排程 |
| Dashboard | 指標卡片 + 圖表 | Monitoring、Settings-Overview |

### 5.2 共用元件庫（命名建議）

- `components/layout/PrimaryNav.tsx`, `GlobalHeader.tsx`  
- `components/context/ContextBar.tsx`（顯示 Connection / Flow）  
- `components/activity/ActivityDock.tsx`（Phase 2 起）  
- `components/common/StatusPill.tsx`, `PlatformBadge.tsx`  
- `components/forms/WizardStepper.tsx`  
- `components/flow/FlowCanvas.tsx`, `NodePalette.tsx`（Phase 3）

樣式統一使用 Tailwind utility，必要時在 `.styles.ts` 封裝變體。

---

## 6. 模組詳細規劃

### 6.1 Connections（Phase 1.2）
- 見 `CONNECTION_MANAGEMENT_UI_DESIGN.md`
- Primary Nav 項目 `Connections`
- 狀態：Active / Expired / Error，對應 Activity Dock 提示

### 6.2 Settings（Phase 1.2 → 1.3）
- 分頁：`Profile`、`Platform Apps`、`Roles & Permissions`、`Audit Log`
- Phase 1.2：先提供 `Platform Apps`（管理 Shopline/Next Engine 憑證）與 `Profile`
- Phase 1.3：加入 `Roles & Permissions`、`Audit Log` 基礎

### 6.3 Flow Builder（Phase 3.0）
- Layout：Canvas（中） + Node Panel（左） + Properties（右）
- 支援 Draft / Publish 狀態，未保存時顯示浮動提示
- Flow 切換透過 Context Bar 下拉或搜尋

### 6.4 Schedules / Jobs（Phase 3.1 / 3.2）
- Schedules：列表 + Calendar 視圖，支援 Flow 篩選、啟用/停用
- Jobs：時間線 + 詳細面板，顯示執行歷史、重試、狀態標籤
- Activity Dock 接入 Job 告警與重試快捷操作

### 6.5 Monitoring / Insights（Phase 3.2+）
- Dashboard Widget：Flow 成功率、Job 錯誤趨勢、平台健康度
- 告警：分級（Info / Warning / Critical），可跳轉到對應模組

---

## 7. 權限與角色視角

| 角色 | 可見模組 | 特色 UI 行為 |
|------|----------|--------------|
| Owner | 全部 | 可管理平台憑證、角色、Flow 發佈 |
| Admin | Connections / Flow / Schedule / Monitoring | 可建立 Flow、排程、查看告警 |
| Operator | Connections / Flow（唯讀） / Jobs | 可查看狀態，無法修改設定 |

UI 層必須根據角色調整按鈕狀態（Disabled with tooltip）、隱藏敏感數據。

---

## 8. 測試與驗收框架

1. **UI Regression Matrix**：
   - 驗證 Primary Nav 欄位對應 Phase 版本的模組顯示  
   - 對不同角色登入，確保模組顯示與操作權限符合表格
2. **狀態流測試**：
   - Connection 切換 → Flow Canvas 更新 → Schedule 列表過濾  
   - Flow Draft → Publish → Schedule 建立 → Job 執行 → Monitoring 呈現
3. **Activity Dock 行為**：
   - Token 過期警示、Job 失敗、Flow Draft 提醒
4. **URL / Routing**：
   - Phase 1.2：Query 初始化  
   - Phase 2：導入動態路由後，Primary Nav 模組保留一致體驗

---

## 9. 實作路線建議

- **Phase 1.2**：實作 Connection 模組（Epic 4），重構 Primary Nav / Context Bar 架構。  
- **Phase 1.3**：擴充 Settings（平台憑證）、Connection 模組支援 Next Engine。  
- **Phase 2.0**：導入動態路由（Refactor R3.3），啟用 Activity Dock 基礎。  
- **Phase 3.0**：實作 Flow Builder Canvas；整合 Context Bar 切換 Flow。  
- **Phase 3.1 ~ 3.2**：加入 Schedule / Job 模組與 Monitoring Dashboard。

---

## 10. 相關文件
- `docs/backlog/epics/epic-4-multi-store-management.md`
- `docs/backlog/epics/epic-5-next-engine-mvp.md`
- `docs/memory/roadmap.md`
- `docs/reference/design-specs/CONNECTION_MANAGEMENT_UI_DESIGN.md`
- `docs/reference/design-specs/ADMIN_API_TEST_UI_DESIGN.md`
- `docs/reference/design-specs/WEBHOOK_TEST_UI_DESIGN.md`
