# 方法論詳細說明

> 📋 **參考文件**：本文件包含方法論的詳細說明和設計背景，供參考用。  
> Agent 實際工作時請參考 `00-AGENT-ONBOARDING.md`（精簡、行動導向）。

---

## 🎯 方法論設計背景

### 為什麼需要這個方法論？

本專案採用 **AI Agent 協作開發**，與傳統人類開發團隊有本質差異：

1. **時間尺度變更**
   - 傳統模式：Sprint 週期為 2 週，需進行繁瑣的時程預估與驗收流程
   - AI Agent 模式：每個 Run 以 20 分鐘為單位，驗收流程為：Agent 先自動化測試與確認，無誤後交由 user 直接進行實際功能驗證

2. **文件的本質變了**
   - 傳統：給人看的長期文檔
   - AI Agent 時代：給 Agent 的記憶與交接資訊

3. **協作方式變了**
   - 傳統：團隊會議、複雜的流程
   - AI Agent 時代：對話式協作，快速迭代

4. **方法論一致性的問題**
   - 不同 Agent 會用不同的架構邏輯
   - 前一個 Agent 的方法論沒有被明確定義
   - 下一個 Agent 可能忽略前面的方法論，創造新邏輯
   - 導致文件混雜各種架構與哲學，形成殭屍文件

### 核心設計原則

1. **文件是 Agent 的記憶，不是給人的文檔**
2. **方法論先於文件結構**
3. **分層：核心記憶 vs 討論留底**
4. **命名要反映 AI Agent 協作的實際流程**

---

## 📋 概念定義

### Epic

**定義**：對應 Roadmap 的一個階段目標，例如「導入 NE 平台」、「多租戶系統」

**特性**：
- 對應 Roadmap 的階段（Phase 1.1、Phase 2.1 等）
- 可能跨多個 Run
- 包含多個 Story

**類型**：
- **Feature Epic**：新功能開發
- **Refactor Epic**：重構任務（架構調整，不改變功能）
- **Optimization Epic**：效能優化（如果範圍大，需要 Epic）

### Story

**定義**：一個可測試的具體功能，例如「NE OAuth 流程」、「NE API 封裝」

**特性**：
- 一個 Run 內可完成（20 分鐘）
- 有明確的驗收標準（user test）
- 屬於某個 Epic
- **自包含**：Story 文件包含所有開發所需資訊，開發時不需要再查閱 memory/

**類型**：
- **Feature Story**：新功能開發
- **Refactor Story**：重構任務
- **Bug Fix Story**：Bug 修復

**狀態流程**：
```
planned → ready-for-dev → in-development → agent-testing → ready-for-user-test → user-test-passed → completed
```

### Run

**定義**：一個開發單位，完成 1-3 個 Story

**特性**：
- 不是每次對話，而是一個開發單位
- 目標是 20 分鐘內完成可測試的功能
- 完成後需要 User Test 驗收

**類型**：
- **開發 Run**：執行 Story 開發
- 對話可以有多種用途（討論 vision/roadmap、研究架構、討論 epic、拆 story），Run 只是其中一種

### Issue

**定義**：Bug 或需要追蹤的問題

**開立時機**：
- 短時間內解不掉
- 需要討論怎麼解
- 卡關需要建檔研究
- 想先回報但不想現在處理

**不需要開 Issue 的情況**：
- 馬上可以修的小問題（用戶貼圖直接指出）
- 在當前 Run 中直接處理

---

## 🔄 專案生命週期流程

### 完整生命週期概覽

本專案的開發流程從開案到持續迭代，包含以下階段：

```
開案 → 架構規劃 → Epic 規劃 → Story 建立 → 開發 Run → 持續迭代
```

---

### 階段 1: 開案階段（建立核心記憶）

**目標**：建立專案的三大核心文件

**產出**：
- `memory/vision.md` - 專案願景
- `memory/roadmap.md` - 專案路線圖
- `memory/principles.md` - 運作原則

**特點**：
- 這些文件會在對話中持續動態演化
- 屬於「永遠都如此」的資訊（文化願景層面）
- 不會頻繁變動，但會隨著專案發展調整

**Agent 角色**：
- 在對話中理解用戶的 vision、roadmap、principles
- 展開成文件，讓用戶確認
- 持續維護更新

---

### 階段 2: 架構規劃階段

**目標**：從 vision + roadmap 討論出 architecture，訂下技術 stack 和大架構

**輸入**：
- `memory/vision.md`
- `memory/roadmap.md`

**產出**：
- `memory/architecture/current.md` - 系統架構
- `memory/architecture/project-structure.md` - 專案結構

**關鍵任務**：
- 確保後續開發不會衝突、走歪
- 訂下技術 stack
- 定義大架構原則

**Agent 角色**：
- 基於 vision 和 roadmap 提出架構建議
- 與用戶討論確認
- 記錄架構決策

---

### 階段 3: Epic 規劃階段

**目標**：從 roadmap 拉出初版 epics，開始進到任務管理

**輸入**：
- `memory/roadmap.md`

**產出**：
- `backlog/epics/epic-{id}-{slug}.md` - Epic 文件
- `backlog/index.md` - 更新 Epic 列表

**Epic 特點**：
- 橋接策略討論到行動的重要關鍵
- 對應 Roadmap 的階段（Phase 1.1、Phase 2.1 等）
- 包含多個 Story（但此時 Story 可能只是規劃中的清單）

**Agent 角色**：
- 從 roadmap 中識別需要開發的功能階段
- 建立 Epic 文件
- 列出初步的 Story 清單（狀態：planned）

---

### 準備階段到日常運作的轉換

**準備階段（階段 1-3）特點**：
- 開案初期，整個資料夾打開 day1 會密集討論
- 主要討論 `memory/` 裡的資訊（vision、roadmap、architecture）
- 建立完整的三大核心文件（vision、roadmap、principles）
- 討論並確定技術 stack 和大架構
- 從 roadmap 拉出初版 epics

**轉換點**：
- 準備完成後，就會以 `context/` + `backlog/` 為核心去跑
- 不再需要頻繁查閱整個 `memory/`
- 進入日常運作模式：Story 建立 → 開發 Run → User Test → 持續迭代

**與後續階段的關鍵差異**：

| 準備階段（階段 1-3） | 日常運作階段（階段 4 之後） |
|---------------------|-------------------------|
| 密集討論 `memory/` 裡的資訊 | 主要關注 `context/` + `backlog/` |
| 建立完整的 vision、roadmap、architecture | 只在需要時查閱 `memory/` |
| 整個資料夾打開，全面討論 | 聚焦當前任務，快速迭代 |
| 討論時間較長，建立共識 | 快速執行，20 分鐘一個 Run |

---

### 階段 4: 決策記錄階段（貫穿整個流程）

**時機**：各種細節討論涉及重要的決策時（準備階段和日常運作階段都可能發生）

**產出**：
- `memory/decisions/{decision-name}.md` - 決策摘要記錄
- `archive/discussions/{discussion-date}.md` - 討論過程留底

**關鍵原則**：
- 決策摘要放在 `memory/decisions/`（永遠都如此，需要查閱）
- 討論過程放在 `archive/discussions/`（很少查，留底用）

**Agent 角色**：
- 識別需要決策的議題
- 與用戶討論
- 記錄決策結論（精簡版）
- 討論過程留底（如果需要）

---

### 階段 5: Story 建立階段（實作前準備）

**目標**：從 Epic 中的 Story 清單，建立完整的 Story 文件

**輸入**：
- `backlog/epics/epic-{id}-{slug}.md` - Epic 中的 Story 清單
- `memory/` - 所有相關的核心記憶

**產出**：
- `backlog/stories/story-{id}-{slug}.md` - 完整的 Story 文件

**流程**：

1. **從功能描述開始**
   - 從 Epic 中的 Story 清單（可能只是一句話）
   - 例如：「NE OAuth 流程」

2. **整理所有必要資訊**
   - 檢視 `memory/architecture/current.md` - 架構規範
   - 檢視 `memory/decisions/` - 相關決策
   - 檢視 `reference/platform-apis/` - API 文檔
   - 甚至跟 user 要資訊、自己上網去搜集資訊

3. **整理到 Story 文件**
   - 技術需求
   - 驗收標準（Agent 功能測試 + User Test）
   - User Test 預期步驟（包含前置條件）
   - 關鍵資訊（sample code、API 端點等）
   - 參考資料（來源 ref，但標註開發時不需要再查）

4. **持續維護調整**
   - 如果發現 memory 資訊不足，補充 memory
   - 如果找到可復用的資訊，放進 `reference/`

5. **決策處理**
   - 如果碰到需要決策實作方案，就需要討論
   - 做成決策記錄到 `memory/decisions/`

6. **狀態調整與檢查**
   - 所有前置資訊（技術需求、功能測試清單、User Test 步驟）整理完成後，才可將 Story 狀態從 `planned` 調整為 `ready-for-dev`
   - 若仍有資料缺漏或測項未定義，維持 `planned` 狀態並補齊缺口

7. **🚨 Story Review 流程（重要）**
   - **當建立多個相關 Story 時**（例如：Story 3.1-3.4），必須進行技術檢視
   - **檢視範圍**：
     - 架構一致性（狀態管理策略、檔案結構、API 設計）
     - 技術內容完整性（資料模型、API 端點、程式碼範例）
     - 與 Refactor 成果的整合（Redis、Zustand 等）
     - 依賴關係清晰度（前置條件、Story 順序）
   - **產出**：技術檢視報告（存放在 `archive/discussions/review-story-{id}-{slug}.md`）
   - **檢視者**：TPM 或負責 Story 建立的 Agent
   - **檢視後**：修正所有發現的問題，確保 Story 完全遵循最新架構要求
   - **完成標準**：所有問題已修正，Story 準備就緒，可以安排到開發 run

**Agent 角色**：
- 充分閱讀所有相關 memory
- 搜集必要資訊（從 user、網路、reference）
- 整理成自包含的 Story 文件
- 確保架構一致性
- **建立多個相關 Story 時**：進行技術檢視並產出 Review 報告

**重要**：Story 建立是一個文件閱讀量很大的工作，但這是為了確保架構一致性。

**🚨 Review 報告存放位置**：
- **存放位置**：`archive/discussions/review-story-{id}-{slug}.md`
- **命名規範**：
  - 一般 Review：`review-story-{id}-{slug}.md`
  - TPM 技術檢視：`tpm-review-story-{id}-{slug}.md`
- **報告內容**：
  - 檢視摘要（發現的問題、修正的問題）
  - 詳細檢視結果（架構一致性、技術內容、整合檢查）
  - 修正摘要（修正的檔案、修正內容）
  - 結論（整體評估、建議行動）

---

### 階段 6: 開發 Run 階段

**目標**：執行 Story 開發，完成功能測試

**輸入**：
- `backlog/stories/story-{id}-{slug}.md` - Story 文件（包含所有開發所需資訊）
- `context/current-run.md` - 當前 Run 資訊

**產出**：
- 實作的功能
- 更新的 Story 狀態
- User Test 步驟

**流程**：

1. **🚨 檢查 Story Review（重要）**
   - **在建立 Run 前**，檢查是否有相關的 Story Review 報告
   - **檢查位置**：`archive/discussions/review-story-*.md`
   - **檢查內容**：
     - 是否有對應的 Review 報告（如果建立多個相關 Story）
     - Review 報告是否已完成（所有問題已修正）
     - Review 報告的結論是否為「準備就緒」
   - **如果沒有 Review 報告**：
     - 提醒用戶是否需要進行 Story Review
     - 如果用戶確認不需要，可以繼續建立 Run
   - **如果有 Review 報告但未完成**：
     - **必須等待 Review 完成**，確保 Story 完全遵循最新架構要求
     - 提醒用戶完成 Review 流程
   - **如果 Review 報告已完成**：
     - 確認所有問題已修正
     - 可以繼續建立 Run

2. **建立 Run**
   - 用戶決定要開始開發 Run
   - 建立 `context/current-run.md`
   - 列出要完成的 Stories（1-3 個）
   - **記錄 Review 狀態**：在 Run 文件中記錄相關 Review 報告的位置和狀態

3. **開發啟動**
   - 確認 Story 狀態為 `ready-for-dev`
   - 將 Story 狀態調整為 `in-development` 後開始實作
   - 讀取 Story 文件（不需要再讀 memory/）
   - 直接依據 Story 文件實作
   - 持續更新 `context/current-run.md` 的進度

4. **功能測試**
   - 完成所有 Story 中列出的 Agent 功能測試項目
   - 實作完成後將 Story 狀態調整為 `agent-testing`
   - 逐項勾選測項並記錄測試結果到 Story 文件（若實作過程新增邊界條件，需同步補列測項）
   - 確保型別檢查、語法檢查、基礎邏輯都通過

5. **列出 User Test 步驟**
   - 提供清晰的 User Test 步驟
   - 說明無法自動測試的項目
   - 說明可能出現的問題
   - 所有測項勾選完成且無待修正事項後，將 Story 狀態調整為 `ready-for-user-test`

6. **完成 Run**
   - 確認本 Run 中的每個 Story 皆已達 `ready-for-user-test`
   - 未達成前不得切換至下一個 Story 的實作
   - 將 Run 狀態自 `in-progress` 調整為 `ready-for-acceptance`
   - 更新 Epic/Refactor/Issue 進度
   - 更新 `context/recent-runs.md`（在列表最上方新增完成的 Run）
   - 更新 `context/current-run.md`（標記狀態為 `ready-for-acceptance`，記錄完成時間和測試結果）
   - **注意**：此時不歸檔 `current-run.md`，等到下一個 Run 開始時才歸檔到 `archive/old-runs/`

7. **下一個 Run 開始時**
   - 將 `context/current-run.md` 移動到 `docs/archive/old-runs/`（使用原 Run ID 作為檔案名稱）
   - 建立新的 `context/current-run.md` 記錄

**詳細 Run 管理規範**：見 `docs/reference/guides/RUN_MANAGEMENT.md`

**Run 特點**：
- 相當於以前的 sprint
- 目標是 20 分鐘內完成可測試的功能
- 完成後需要 User Test 驗收

**Agent 角色**：
- 依據 Story 文件實作
- 完成所有功能測試
- 列出 User Test 步驟
- 告知用戶需要 User Test 的項目

---

### 階段 7: User Test 驗收階段

**目標**：User 在 browser 中實際測試，確認功能符合預期

**流程**：

1. **User 執行測試**
   - 按照 Story 文件中的「User Test 預期步驟」
   - 在 browser 中實際操作
   - 將 Run 狀態從 `ready-for-acceptance` 調整為 `in-acceptance`

2. **結果記錄**
   - Story 初始狀態為 `ready-for-user-test`
   - 如果通過：將 Story 狀態調整為 `user-test-passed`
   - 如果有問題：記錄問題，回退至 `in-development` 或 `agent-testing` 後修復（必要時開 Issue）

3. **Story 完成**
   - User Test 通過後，觀察 1-2 個 Run（或等待用戶確認無後續修正需求）
   - 確認無問題後，將 Story 狀態調整為 `completed`
   - 移動到 `archive/stories/`
   - 所有相關 Story 完成後，將 Run 狀態依序調整為 `accepted`（用戶確認核心驗收通過）→ `closed`（用戶宣告結案）

**關鍵**：
- 驗收 = user 在 browser 中測試
- 通過就過，不通過就修

---

### 階段 8.5: 收集階段（貫穿整個流程）

**時機**：用戶隨時想到功能、優化、問題，但不想立即進入正式流程

**產出**：
- `backlog/inbox/note-{date}-{seq}.md` - Inbox Note（快速記錄）

**流程**：
1. **用戶表達想法**：例如「幫我記一下...」、「應該加個...功能」
2. **Agent 快速記錄**：
   - 在 `backlog/inbox/` 建立 note 文件
   - 使用最小格式記錄想法
   - 標記類型（Feature/Optimization/Refactor/Bug/Question）
   - 狀態：`collected`
3. **不影響流程**：這些 note 不計入正式 backlog，不會影響現有流程

**關鍵原則**：
- **快速記錄**：不需要完整格式，重點是快速記錄想法
- **不破壞流程**：這些 note 不計入正式 backlog
- **後續整理**：在適合的時機統一整理

**詳細說明**：見 `docs/backlog/inbox/README.md`

---

### 階段 8.6: 整理階段（定期進行）

**時機**：
- 定期（例如：每週或每幾個 Run）
- 在規劃新 Epic/Story 時
- 在開始新的開發階段時
- 用戶明確要求整理時

**輸入**：
- `backlog/inbox/` - 所有收集的 notes

**產出**：
- 轉換為正式的 Epic/Story/Issue
- 更新 `backlog/index.md`

**流程**：
1. **讀取所有 notes**
   - 讀取 `backlog/inbox/` 中的所有 note 文件
2. **分類整理**：
   - **轉換為 Epic**：如果想法夠大，需要多個 Story
   - **轉換為 Story**：如果可以直接實作
   - **轉換為 Issue**：如果是 Bug 或需要追蹤的問題
   - **合併到現有 Epic/Story**：如果屬於現有任務
   - **棄置**：如果不需要了
3. **更新記錄**：
   - 更新 note 的「後續處理」欄位
   - 記錄轉換結果和相關文件連結
4. **歸檔處理**：
   - 將已處理的 note 移動到 `archive/inbox/processed/`
   - 更新 `backlog/inbox/index.md`

**關鍵原則**：
- **分類判斷**：根據想法的大小和性質決定轉換類型
- **合併優先**：如果屬於現有 Epic/Story，優先合併
- **明確記錄**：在 note 中記錄轉換結果和相關文件連結

**詳細說明**：見 `docs/backlog/inbox/README.md`

---

### 階段 8: 持續迭代階段

**目標**：持續開發新功能，同時處理各種問題和優化

**可能的情況**：

1. **發現 Issue**
   - 判斷是否需要開 Issue（見「Issue 開立時機」）
   - 如果需要，建立 Issue 文件
   - 建立對應的 Bug Fix Story
   - 排入 Run 處理

2. **觸發重構**
   - 某個階段發現需要重構
   - 建立 Refactor Epic
   - 規劃 Refactor Stories
   - 進入 Story 建立 → 開發 Run 流程

3. **功能優化**
   - 小優化：直接建立 Issue + Story
   - 大優化：建立 Optimization Epic

4. **架構調整**
   - 回頭討論架構
   - 更新 `memory/architecture/current.md`
   - 可能需要調整相關 Stories

5. **Roadmap 調整**
   - 對話中討論 roadmap 的改變
   - 更新 `memory/roadmap.md`
   - 調整 Epic 規劃

---

### 階段識別與流程指引

**關鍵原則**：每個階段每個過程，在 cursor 裡發生的對話，都應該可以被快速識別是上面整個產品開發週期的哪個階段

**識別方法**：

| 對話內容 | 階段 | 需要走什麼流程 | 遵循什麼做法 | 調閱什麼資訊 | 維護什麼文件 |
|---------|------|---------------|-------------|-------------|-------------|
| 討論專案要做什麼 | 開案階段 | 建立/更新 vision.md | 理解用戶 input，展開成文件 | - | vision.md |
| 討論要先做什麼再做什麼 | 開案階段 | 建立/更新 roadmap.md | 理解用戶 input，展開成文件 | - | roadmap.md |
| 討論技術選型、架構設計 | 架構規劃階段 | 建立/更新 architecture/ | 基於 vision + roadmap 提出建議 | vision.md, roadmap.md | architecture/current.md |
| 從 roadmap 規劃功能階段 | Epic 規劃階段 | 建立 Epic 文件 | 識別 roadmap 階段，建立 Epic | roadmap.md | backlog/epics/ |
| 討論實作方案、技術決策 | 決策記錄階段 | 建立決策記錄 | 討論 → 記錄決策摘要 | 相關 memory | memory/decisions/ |
| **快速收集想法** | **收集階段** | **建立 Inbox Note** | **快速記錄，最小格式** | **-** | **backlog/inbox/** |
| 整理 Inbox | 整理階段 | 分類轉換 Inbox Notes | 檢視 → 分類 → 轉換 | backlog/inbox/ | backlog/epics/, stories/, issues/ |
| 準備 Story 詳細資訊 | Story 建立階段 | 建立完整 Story 文件 | 充分閱讀 memory，整理資訊 | memory/, reference/ | backlog/stories/ |
| 開始開發功能 | 開發 Run 階段 | 執行開發 Run | 依據 Story 文件實作 | Story 文件 | context/current-run.md |
| 發現問題要修復 | Issue 處理 | 建立 Issue + Story | 判斷是否需要開 Issue | - | backlog/issues/ |
| 需要重構 | 重構階段 | 建立 Refactor Epic | 規劃重構範圍 | memory/architecture/ | backlog/refactors/ |
| 查詢當前狀態 | 狀態查詢 | 讀取 context 和 backlog | 快速回報 | context/, backlog/ | - |

---

## 📁 文件體系設計

### 🚨 文件創建規範（Agent 必須遵守）

**嚴格禁止在 `docs/` root 層級創建任何文件！**

所有文件必須放在對應的目錄下，違反此規範會導致文件體系混亂。

**文件放置規則**：
- 討論留底、分析報告、Review 報告 → `archive/discussions/`
- Epic/Story/Issue/Refactor → `backlog/` 對應子目錄
- 當前上下文 → `context/`
- 核心記憶、決策、架構 → `memory/` 對應子目錄
- 參考資料、API 文檔、指南 → `reference/` 對應子目錄

**Review 報告存放規範**：
- **存放位置**：`archive/discussions/review-story-{id}-{slug}.md`
- **命名規範**：
  - 一般 Review：`review-story-{id}-{slug}.md`
  - TPM 技術檢視：`tpm-review-story-{id}-{slug}.md`
- **建立時機**：當建立多個相關 Story 時（例如：Story 3.1-3.4）

**不確定時**：先查閱 `docs/README.md` 或參考現有類似文件的位置。

---

### 文件分類（基於實際使用場景）

#### 1. memory/ - 核心記憶（Agent 必須查閱）

**用途**：永遠都如此 + 暫時需要如此的重要資訊

**內容**：
- `vision.md` - 永遠都如此：專案願景
- `roadmap.md` - 永遠都如此：路線圖（會更新）
- `principles.md` - 永遠都如此：運作原則
- `decisions/` - 永遠都如此：重要決策記錄
- `architecture/` - 暫時需要如此：架構（會演進）

**更新時機**：做出決策、架構改變、獲得新資訊時

#### 2. backlog/ - 任務管理（進行中/剛完成）

**用途**：管理所有進行中的任務

**內容**：
- `index.md` - 所有任務的總覽
- `inbox/` - 📝 收集區（快速收集想法，待整理）
- `epics/` - Feature Epics
- `refactors/` - 重構任務
- `issues/` - Bug/Issue 追蹤
- `stories/` - 所有 Story（統一管理）

**狀態**：
- `planned` - 規劃中，需求與測項尚未定稿
- `ready-for-dev` - 已完成規劃、測項與文件資訊準備，可以安排進 Run
- `in-development` - 開發中
- `agent-testing` - 開發完成，Agent 正在執行功能測試並逐項記錄結果
- `ready-for-user-test` - Agent 測試全數通過，等待用戶驗收
- `user-test-passed` - User Test 通過，觀察中
- `completed` - 已完成且確認無問題（1-2 個 Run 後移到 archive）

#### 3. archive/ - 已完成/棄置的任務

**用途**：保存已完成的任務和棄置的任務

**結構**：對應 backlog 結構（epics/, refactors/, issues/, stories/）

**狀態**：
- `closed` - 已完成且確認無問題
- `abandoned` - 棄置（不需要了）

#### 4. context/ - 當前上下文

**用途**：Agent 快速了解當前狀態

**內容**：
- `current-run.md` - 當前 Run（如果正在進行）
- `recent-runs.md` - 最近 5-10 個 Run 的摘要

**更新時機**：每次 Run 開始/結束時

#### 5. reference/ - 參考資料

**用途**：需要時查閱，不常更新

**內容**：
- `platform-apis/` - 系統邊界外的關鍵資訊（API 文檔、endpoint、sample code）
- `design-specs/` - UI/UX 設計規格
- `guides/` - 操作指南

---

## 🔄 工作流程詳解

### Story 建立階段（討論對話）

**時機**：實作前的準備階段

**流程**：
1. 用戶表達：要建立 Story（例如：拆 Story 1.2）
2. Agent 讀取 `memory/` 中所有相關資訊
   - `architecture/current.md`
   - `decisions/*.md`
   - `reference/platform-apis/*.md`
3. Agent 整理所有關鍵資訊到 Story 文件
4. 附上來源 ref（但標註開發時不需要再查）
5. 這個 context window 結束

**目的**：確保架構一致性，所有資訊都預先整理好

### 開發 Run（執行對話）

**時機**：用戶明確要求開始開發 Run

**流程**：
1. 用戶表達：開始開發 Run，完成 Story 1.2
2. Agent 讀取 `context/current-run.md`
3. Agent 讀取 `backlog/stories/story-1-2-ne-api.md`
4. Agent 直接依據 Story 文件實作（不需要再讀 memory/）
5. 實作、測試
6. 更新 Story 狀態、Epic 進度、recent-runs

**目的**：最小化 token 使用，快速執行

### 查詢狀態（查詢對話）

**時機**：用戶詢問當前狀態

**流程**：
1. 用戶詢問：現在狀態進度怎樣？
2. Agent 讀取 `context/current-run.md`
3. Agent 讀取 `backlog/index.md`
4. Agent 回報當前狀態

---

## 🎯 Story 自包含設計

### 為什麼 Story 要自包含？

**問題**：Agent context window 有限，不可能全部查閱 memory/

**解決方案**：Story 建立時，Agent 充分閱讀所有相關 memory，整理到 Story 文件中

**效果**：
- 開發 Run 時，Agent 只需要讀取 Story 文件
- 不需要再溯源去找來源文件
- 節省 token，提高效率

### Story 文件必須包含

1. **Story 描述** - 清楚說明要做什麼
2. **驗收標準** - Agent 功能測試 + User Test 驗收標準
3. **User Test 預期步驟** - 包含前置條件（Agent 無法測試的部分）
4. **技術需求** - 實作內容
5. **關鍵資訊（預先整理）** - 包含 sample code、API 端點等
6. **參考資料（來源）** - 附上 ref，但標註開發時不需要再查
7. **實作進度** - 追蹤進度
8. **Agent 測試結果** - Run 完成時記錄
9. **User Test 結果** - User Test 後記錄（直接記錄在 Story 文件中）

---

## 📊 Run 完成標準詳解

### Agent 必須完成的測試

**目的**：確保 User Test 時不會出現基礎問題

**包含**：
- 所有 Story 驗收標準中的「Agent 功能測試」項目
- 型別檢查通過
- 無語法錯誤
- 路徑引用正確
- 無 runtime 錯誤（Agent 可以測試的部分）
- ESLint 通過
- TypeScript 編譯通過

### Agent 無法完成的測試

**原因**：涉及跨平台設定、實際用戶操作、UI/UX 體驗

**包含**：
- 跨平台設定（例如：ngrok、App 設定）
- 實際的 OAuth 授權流程
- 涉及多平台邊界設定的功能
- UI/UX 是否符合用戶預期

### Run 完成時 Agent 必須告知用戶

**目的**：確保 Agent 跟人的認知一致

**包含**：
1. 無法自動測試的項目（明確列出步驟，說明為什麼）
2. 可能出現的問題（列出問題及解決方案）
3. User Test 步驟（提供清晰的步驟，說明預期結果）

**狀態節點**：
- `in-progress` → `ready-for-acceptance`：Run 內所有 Story 狀態皆為 `ready-for-user-test`
- `ready-for-acceptance` → `in-acceptance`：User 開始驗收，逐一檢視故事
- `in-acceptance` → `accepted`：User 完成驗收，但仍等待最終確認或潛在回饋
- `accepted` → `closed`：User 明確表示驗收通過，Run 正式結案（若 User 提出問題需回退對應 Story 狀態並重新啟動 Run 或新建 Run）

---

## 🐛 Issue 開立時機詳解

### 為什麼要明確 Issue 開立時機？

**問題**：AI 時代，很多小問題可以馬上修掉，不需要浪費時間開 Issue

**解決方案**：明確區分需要開 Issue 和不需要開 Issue 的情況

### 不需要開 Issue 的情況

- 馬上可以修的小問題（用戶貼圖直接指出，Agent 可以立即修復）
- 在當前 Run 中直接處理（開發過程中發現的小問題）

### 需要開 Issue 的情況

- 短時間內解不掉（需要深入研究或討論）
- 需要討論怎麼解（有多種解決方案需要選擇）
- 卡關需要建檔研究（技術問題需要深入研究）
- 想先回報但不想現在處理（用戶明確要求先建檔）

---

## 📝 文件命名規範詳解

### Epic/Refactor/Issue ID

- **Feature Epic**: `epic-{id}-{slug}.md`
- **Refactor**: `refactor-{id}-{slug}.md`
- **Issue**: `issue-{date}-{seq}.md` (例如: `issue-2025-11-04-001.md`)

### Story ID

- **Feature Story**: `story-{epic-id}-{story-seq}-{slug}.md`
- **Refactor Story**: `story-refactor-{refactor-id}-{story-seq}-{slug}.md`
- **Bug Fix Story**: `story-issue-{issue-seq}-{slug}.md`
- **子任務**: `story-{epic-id}-{story-seq}.{sub-seq}-{slug}.md`

**注意**：使用流水號，不預留空格。如果需要在中間插入，使用子編號（例如：`story-1-2.1-api-error-handling.md`）

### Run ID

- **Run**: `run-{date}-{seq}.md` (例如: `run-2025-11-04-01.md`)
- 使用日期+流水號，一天可能跑兩三個 Run

---

## 🔄 任務移動流程

### Backlog → Archive

**條件**：
1. Story 狀態為 `completed`
2. 觀察 1-2 個 Run
3. 確認無問題

**流程**：
1. 移動 Story 文件到 `archive/stories/`
2. 更新 Epic/Refactor/Issue 狀態
3. 如果 Epic/Refactor/Issue 的所有 Story 都完成，移動到 archive
4. 更新 `archive/index.md`

---

## 📚 相關文件

- **Agent 指引文件**: `00-AGENT-ONBOARDING.md`（精簡、行動導向）
- **專案願景**: `memory/vision.md`
- **專案路線圖**: `memory/roadmap.md`
- **運作原則**: `memory/principles.md`

---

**最後更新**: 2025-11-04  
**維護者**: 專案團隊

