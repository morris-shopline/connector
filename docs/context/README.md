# Context 目錄說明

> 當前上下文資訊，Agent 工作時快速了解當前狀態

---

## 📁 文件說明

### `current-run.md`
當前正在進行的 Run（如果有的話）。

**何時查看**：
- 開始工作時（檢查是否有進行中的 Run）
- 接續閒置的 Run 時

**包含內容**：
- Run ID、類型、狀態
- 目標任務（Epic/Refactor/Issue）
- 要完成的 Stories
- 當前進度
- 測試結果（如果完成）
- User Test 步驟（如果完成）

**更新時機**：
- Run 開始時：建立新的 Run 記錄
- Run 進行中：更新進度
- Run 完成時：標記完成狀態、記錄測試結果
- **下一個 Run 開始時**：歸檔到 `docs/archive/old-runs/`

**歸檔流程**：
1. **下一個 Run 開始前**：
   - 將 `current-run.md` 移動到 `docs/archive/old-runs/`
   - 檔案名稱：使用原 Run ID（例如：`run-2025-11-05-01.md`）
2. **建立新的 Run 記錄**

**需要更多資訊？**
- Run 的工作流程：見 `docs/memory/methodology.md` 的「階段 6: 開發 Run 階段」
- Run 管理規範：見 `docs/reference/guides/RUN_MANAGEMENT.md`（🚨 必讀）
- Story 文件位置：`docs/backlog/stories/`

---

### `recent-runs.md`
最近 10 個 Run 的摘要，幫助 Agent 快速了解最近發生什麼。

**何時查看**：
- 開始工作時（快速了解上下文）
- 接續閒置的 Run 時（了解最近進度）
- 查詢專案狀態時（了解最近完成的工作）

**包含內容**：
- 最近 Run 的列表（按時間倒序，最新的在最上面）
- 每個 Run 的基本資訊：
  - Run ID、類型、狀態
  - 開始時間、完成時間
  - 完成的 Stories
  - 測試結果摘要
  - 推上線狀態

**更新時機**：
- **每次 Run 完成時立即更新**

**維護規則**：
- **保留數量**：最近 10 個 Run
- **超過 10 個時**：移除最舊的 Run 記錄（不移除檔案，只從列表中移除）

**詳細規範**：見 `docs/reference/guides/RUN_MANAGEMENT.md`

---

## 🔄 Run 生命週期

### 如何開始一個 Run？

1. **檢查是否有進行中的 Run**
   - 讀取 `current-run.md`
   - 如果有進行中的 Run，接續完成
   - 如果沒有，用戶決定要開始開發 Run

2. **如果 current-run.md 中有已完成的 Run**
   - 將 `current-run.md` 移動到 `docs/archive/old-runs/`（使用原 Run ID 作為檔案名稱）
   - 例如：`run-2025-11-05-01.md` → `archive/old-runs/run-2025-11-05-01.md`

3. **建立新的 Run**
   - 建立/更新 `current-run.md`，列出要完成的 Stories
   - 讀取相關 Story 文件（`docs/backlog/stories/`）
   - 執行開發

4. **完成 Run 後**
   - 更新 `current-run.md`（標記狀態為 `completed`，記錄完成時間和測試結果）
   - **立即更新** `recent-runs.md`（在列表最上方新增完成的 Run）
   - 更新 Story 狀態、Epic/Refactor/Issue 進度
   - **注意**：此時不歸檔 `current-run.md`，等到下一個 Run 開始時才歸檔

**詳細流程**：
- **Run 開發流程**：見 `docs/memory/methodology.md` 的「階段 6: 開發 Run 階段」
- **Run 管理規範**：見 `docs/reference/guides/RUN_MANAGEMENT.md`（🚨 必讀：Run 完成後的處理流程）

---

## 📚 相關文件

- **當前任務總覽**：`docs/backlog/index.md`
- **專案狀態摘要**：`PROJECT_STATUS.md`（root）
- **詳細方法論**：`docs/memory/methodology.md`

---

## 🔄 與其他文件的關係

| 文件 | 關係 |
|------|------|
| `PROJECT_STATUS.md` | 高層次狀態摘要，指向 context/ 看當前 Run |
| `backlog/index.md` | 所有任務總覽，包含 context 中當前 Run 的任務 |
| `backlog/stories/` | 當前 Run 要完成的 Story 詳細資訊 |

---

**最後更新**: 2025-11-05

