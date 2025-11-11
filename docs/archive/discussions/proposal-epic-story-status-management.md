# 提案：Story 狀態管理規範

**提案日期**: 2025-11-11  
**狀態**: ✅ 已確認並實施  
**提案者**: Agent  
**實施日期**: 2025-11-11

---

## 📋 問題描述

目前方法論中缺少對以下情況的明確規範：

1. **Story 初始狀態**：Story 文件尚未建立時，應該如何標記狀態？
2. **Story 規劃階段狀態**：Story 文件建立後，規劃過程中的狀態轉換
3. **狀態轉換流程**：從 Story 規劃到開發完成的完整流程

**現有問題**：
- 方法論中提到「列出初步的 Story 清單（狀態：planned）」，但此時 Story 文件尚未建立
- 缺少 Story 規劃階段的狀態定義（從未開始到規劃完成）
- 狀態轉換流程不夠清晰

---

## 🎯 提案內容

### Story 狀態定義（統一管理）

**原則**：Story 狀態統一管理，Epic 中的 Story 狀態與 Story 文件中的狀態保持一致。

| 狀態 | 說明 | 觸發條件 |
|------|------|----------|
| `not-started` | Story 尚未開始規劃，文件尚未建立 | Epic 規劃階段，Story 清單剛列出時 |
| `planning` | Story 開始規劃，Agent 正在整理資訊 | 開始建立 Story 文件，Agent 開始整理技術需求、驗收標準等 |
| `planned` | Agent 整理完一輪，Story 文件已建立 | Agent 完成 Story 文件建立，包含技術需求、驗收標準、User Test 步驟等 |
| `ready-for-dev` | 用戶確認沒問題，可以開始開發 | 用戶確認 Story 文件無問題，可以安排進 Run |
| `in-development` | Story 正在開發中 | 開始實作 |
| `agent-testing` | Agent 正在執行功能測試 | 實作完成，Agent 開始測試 |
| `ready-for-user-test` | Agent 測試完成，等待 User Test | 所有 Agent 測試通過 |
| `user-test-passed` | User Test 通過，觀察中 | User Test 通過 |
| `completed` | Story 已完成 | 確認無問題後標記完成 |

**Story 狀態轉換流程**：
```
not-started → planning → planned → ready-for-dev → in-development → agent-testing → ready-for-user-test → user-test-passed → completed
```

---

### 完整狀態轉換流程

```
Epic 規劃階段
  ↓
Story 狀態: not-started
  - Epic 中列出 Story 清單
  - Story 文件尚未建立
  ↓
開始建立 Story 文件
  ↓
Story 狀態: planning
  - Agent 開始整理資訊
  - 檢視 memory、reference、API 文檔等
  - 整理技術需求、驗收標準等
  ↓
Agent 整理完一輪
  ↓
Story 狀態: planned
  - Story 文件已建立
  - 包含技術需求、驗收標準、User Test 步驟等
  - 但尚未經過用戶確認
  ↓
用戶確認沒問題
  ↓
Story 狀態: ready-for-dev
  - 用戶確認 Story 文件無問題
  - 可以安排進 Run
  ↓
開始開發 Run
  ↓
Story 狀態: in-development
  - 開始實作
  ↓
實作完成
  ↓
Story 狀態: agent-testing
  - Agent 正在執行功能測試
  - 逐項記錄測試結果
  ↓
Agent 測試完成
  ↓
Story 狀態: ready-for-user-test
  - 所有 Agent 測試通過
  - 等待 User Test
  ↓
User Test 通過
  ↓
Story 狀態: user-test-passed
  - User Test 通過，觀察中
  ↓
確認無問題
  ↓
Story 狀態: completed
  - Story 已完成
```

---

### Epic 與 Story 文件格式規範

#### Epic 文件中的 Story 清單格式

**Story 狀態: not-started**（Story 文件尚未建立）：
```markdown
### ⏳ Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: not-started
- **描述**: 新的 Connection List & Dashboard...
- **技術 / UX 要點**:
  - ...
```

**Story 狀態: planning**（Agent 正在整理）：
```markdown
### ⏳ Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: planning
- **描述**: 新的 Connection List & Dashboard...
```

**Story 狀態: planned**（Agent 整理完成，待用戶確認）：
```markdown
### ⏳ Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: planned
- **文件**: [story-4-1-connection-dashboard.md](../stories/story-4-1-connection-dashboard.md)
- **描述**: 新的 Connection List & Dashboard...
```

**Story 狀態: ready-for-dev**（用戶確認完成，可開始開發）：
```markdown
### ⏳ Story 4.1: Connection Dashboard 與列表體驗
- **狀態**: ready-for-dev
- **文件**: [story-4-1-connection-dashboard.md](../stories/story-4-1-connection-dashboard.md)
- **描述**: 新的 Connection List & Dashboard...
```

---

### 更新方法論的建議位置

建議在 `docs/memory/methodology.md` 中更新以下章節：

1. **Story 狀態流程**（第 72-75 行）- 更新為完整的狀態流程：
   ```
   not-started → planning → planned → ready-for-dev → in-development → agent-testing → ready-for-user-test → user-test-passed → completed
   ```

2. **階段 3: Epic 規劃階段**（第 163-183 行）- 更新 Story 清單狀態標記為 `not-started`

3. **階段 5: Story 建立階段**（第 231-300 行）- 補充狀態轉換說明：
   - `not-started` → `planning`：開始建立 Story 文件
   - `planning` → `planned`：Agent 整理完一輪
   - `planned` → `ready-for-dev`：用戶確認沒問題

---

## 📝 實施建議

### 立即實施

1. **更新 Epic 4**：將 Story 4.1-4.5 的狀態從「待建立 Story 文件」改為 `not-started`

### 方法論更新

1. **更新 `docs/memory/methodology.md`**：
   - 更新「Story 狀態流程」（第 72-75 行）為完整流程
   - 更新「階段 3: Epic 規劃階段」中 Story 清單狀態標記
   - 更新「階段 5: Story 建立階段」中狀態轉換說明

2. **更新 `docs/backlog/README.md`**：
   - 更新 `stories/` 章節中的 Story 狀態列表

3. **更新 `docs/00-AGENT-ONBOARDING.md`**：
   - 更新「Story 狀態流程」為完整流程

---

## ✅ 確認事項

1. **Story 狀態定義**：
   - ✅ `not-started` - Story 尚未開始規劃，文件尚未建立
   - ✅ `planning` - Story 開始規劃，Agent 正在整理資訊
   - ✅ `planned` - Agent 整理完一輪，Story 文件已建立
   - ✅ `ready-for-dev` - 用戶確認沒問題，可以開始開發

2. **狀態轉換流程**：
   - ✅ `not-started` → `planning`：開始建立 Story 文件
   - ✅ `planning` → `planned`：Agent 整理完一輪
   - ✅ `planned` → `ready-for-dev`：用戶確認沒問題

3. **實施方式**：
   - ✅ 統一使用 Story 狀態，Epic 中的 Story 狀態與 Story 文件中的狀態保持一致
   - ✅ 不需要分兩層（Epic 和 Story）管理狀態

---

---

## ✅ 實施完成

**實施日期**: 2025-11-11

### 已更新的文件

1. **`docs/memory/methodology.md`**：
   - ✅ 更新 Story 狀態流程（第 72-75 行）
   - ✅ 更新階段 3: Epic 規劃階段中 Story 清單狀態標記（第 182 行）
   - ✅ 更新階段 5: Story 建立階段中狀態轉換說明（第 269-271 行）
   - ✅ 更新 backlog 章節中的 Story 狀態列表（第 595-602 行）

2. **`docs/backlog/README.md`**：
   - ✅ 更新 `stories/` 章節中的 Story 狀態列表（第 107-112 行）
   - ✅ 新增狀態轉換流程說明

3. **`docs/00-AGENT-ONBOARDING.md`**：
   - ✅ 更新 Story 狀態流程（第 50 行）

4. **`docs/backlog/epics/epic-4-multi-store-management.md`**：
   - ✅ 更新 Story 4.1-4.5 的狀態為 `not-started`

---

**方法論已更新完成。**

