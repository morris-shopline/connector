# Context 目錄說明

> 當前上下文資訊，Agent 工作時快速了解當前狀態

---

## 📁 文件說明

### `current-run.md`
當前正在進行的 Run（如果有的話）。

**何時查看**：
- 開始工作時
- 接續閒置的 Run 時

**包含內容**：
- Run ID 和類型
- 目標任務（Epic/Refactor/Issue）
- 要完成的 Stories
- 當前進度

**需要更多資訊？**
- Run 的工作流程：見 `docs/memory/methodology.md` 的「階段 6: 開發 Run 階段」
- Story 文件位置：`docs/backlog/stories/`

---

### `recent-runs.md`
最近 5-10 個 Run 的摘要，幫助 Agent 快速了解最近發生什麼。

**何時查看**：
- 開始工作時（快速了解上下文）
- 接續閒置的 Run 時

**包含內容**：
- 最近 Run 的列表
- 每個 Run 的目標、狀態、摘要

---

## 🔄 如何開始一個 Run？

1. 讀取 `current-run.md`（檢查是否有進行中的 Run）
2. 如果沒有，用戶決定要開始開發 Run
3. 建立/更新 `current-run.md`，列出要完成的 Stories
4. 讀取相關 Story 文件（`docs/backlog/stories/`）
5. 執行開發
6. 完成後更新相關文件

**詳細流程**：見 `docs/memory/methodology.md` 的「階段 6: 開發 Run 階段」

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

