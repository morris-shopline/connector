# Backlog Inbox 說明

> 📋 **用途**：快速收集臨時想法、功能建議、優化點子，不破壞正式流程。

---

## 🎯 設計目的

**問題**：隨時想到要處理的問題、功能、優化，但不想立即進入正式流程。

**解決方案**：
- 快速記錄想法，不需要完整格式
- 不影響現有 backlog 結構
- 後續在適合的時機整理、分類、轉換為正式的 Story/Epic/Issue

---

## 📁 文件格式

### 檔案命名

使用日期和流水號：`note-{date}-{seq}.md`

例如：
- `note-2025-11-06-001.md`
- `note-2025-11-06-002.md`

### 文件內容（最小格式）

```markdown
# Note 2025-11-06-001: {簡短標題}

**建立日期**: 2025-11-06  
**狀態**: 📝 collected  
**類型**: Feature / Optimization / Refactor / Bug / Question

---

## 想法描述

{描述想法、功能、優化、問題等}

---

## 相關資訊（可選）

- 相關 Epic/Story/Issue
- 相關技術
- 參考資料

---

## 後續處理（整理時填寫）

- [ ] 已整理
- [ ] 轉換為：Epic / Story / Issue / 棄置
- [ ] 相關文件：{link}
```

---

## 📋 使用流程

### 1. 快速收集（收集階段）

**何時使用**：
- 用戶隨時想到功能、優化、問題
- 不需要立即處理，但想先記錄下來

**Agent 操作**：
1. 在 `backlog/inbox/` 建立新的 note 文件
2. 使用最小格式記錄想法
3. 標記類型（Feature/Optimization/Refactor/Bug/Question）
4. 狀態：`collected`

**關鍵原則**：
- **快速記錄**：不需要完整格式，重點是快速記錄想法
- **不影響流程**：這些 note 不計入正式 backlog，不會影響現有流程
- **後續整理**：在適合的時機統一整理

---

### 2. 定期整理（整理階段）

**何時整理**：
- 定期（例如：每週或每幾個 Run）
- 在規劃新 Epic/Story 時
- 在開始新的開發階段時
- 用戶明確要求整理時

**Agent 操作**：
1. 讀取 `backlog/inbox/` 中的所有 note
2. 分類整理：
   - **轉換為 Epic**：如果想法夠大，需要多個 Story
   - **轉換為 Story**：如果可以直接實作
   - **轉換為 Issue**：如果是 Bug 或需要追蹤的問題
   - **合併到現有 Epic/Story**：如果屬於現有任務
   - **棄置**：如果不需要了
3. 更新 note 的「後續處理」欄位
4. 將已處理的 note 移動到 `archive/inbox/processed/`

**整理原則**：
- **分類判斷**：根據想法的大小和性質決定轉換類型
- **合併優先**：如果屬於現有 Epic/Story，優先合併
- **明確記錄**：在 note 中記錄轉換結果和相關文件連結

---

## 🔄 狀態流程

```
collected → reviewed → converted → archived
    ↓         ↓          ↓
  收集     整理中     已轉換
```

### 狀態說明

- **📝 collected**：剛收集，尚未整理
- **🔍 reviewed**：已檢視，準備轉換
- **✅ converted**：已轉換為正式的 Epic/Story/Issue
- **🗑️ archived**：已處理或棄置，移動到 archive

---

## 📊 分類類型

### Feature
新功能建議

**轉換方向**：
- 如果夠大 → 建立 Epic
- 如果可以直接實作 → 建立 Story
- 如果屬於現有 Epic → 加入該 Epic

### Optimization
優化建議（效能、體驗、架構等）

**轉換方向**：
- 如果範圍大 → 建立 Refactor Epic
- 如果可以直接實作 → 建立 Story
- 如果屬於現有 Refactor → 加入該 Refactor

### Refactor
架構調整、重構建議

**轉換方向**：
- 建立 Refactor Epic 或加入現有 Refactor

### Bug
Bug 報告或問題

**轉換方向**：
- 建立 Issue
- 如果是小問題，直接建立 Bug Fix Story

### Question
技術問題、設計疑問

**轉換方向**：
- 如果需要討論 → 建立 Issue
- 如果只是疑問 → 記錄在 discussions 或棄置

---

## 🚨 Agent 操作規範

### 收集階段（快速記錄）

**當用戶說「幫我記一下...」或類似表達時**：
1. 快速在 `backlog/inbox/` 建立 note 文件
2. 使用最小格式記錄
3. 標記類型
4. 狀態：`collected`
5. **不需要**：
   - 不需要完整的 Story 格式
   - 不需要立即決定 Epic/Story/Issue
   - 不需要更新 backlog/index.md

### 整理階段（分類轉換）

**當用戶說「整理一下 inbox」或類似表達時**：
1. 讀取所有 `backlog/inbox/` 中的 note
2. 逐一檢視和分類
3. 轉換為正式的 Epic/Story/Issue
4. 更新 note 的「後續處理」欄位
5. 將已處理的 note 移動到 `archive/inbox/processed/`
6. 更新 `backlog/index.md`（如果有新增任務）

---

## 📚 相關文件

- **Backlog 管理**：見 `docs/backlog/README.md`
- **Epic 規劃**：見 `docs/memory/methodology.md` 的「階段 3: Epic 規劃階段」
- **Story 建立**：見 `docs/memory/methodology.md` 的「階段 5: Story 建立階段」
- **Issue 開立**：見 `docs/memory/methodology.md` 的「Issue 開立時機詳解」

---

**最後更新**: 2025-11-06  
**維護者**: 專案團隊

