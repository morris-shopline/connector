# 文件導覽

> 📋 **新 Agent 必讀**: 請先閱讀 [00-AGENT-ONBOARDING.md](./00-AGENT-ONBOARDING.md) 了解本專案的方法論！

---

## 🚨 Agent 必讀

- **[00-AGENT-ONBOARDING.md](./00-AGENT-ONBOARDING.md)** - 新 Agent 必讀：本專案的方法論（精簡、行動導向）

---

## 📁 文件結構

```
docs/
├── 00-AGENT-ONBOARDING.md          # 🚨 Agent 必讀：方法論
│
├── memory/                          # 核心記憶（需要時查）
│   ├── methodology.md              # 詳細方法論說明（參考用）
│   ├── vision.md                   # 專案願景
│   ├── roadmap.md                  # 專案路線圖
│   ├── principles.md               # 運作原則
│   ├── decisions/                  # 重要決策
│   └── architecture/               # 架構文檔
│
├── backlog/                        # 任務管理（進行中/剛完成）
│   ├── index.md                    # 所有任務的總覽
│   ├── epics/                      # Feature Epics
│   ├── refactors/                  # 重構任務
│   ├── issues/                     # Bug/Issue 追蹤
│   └── stories/                    # 所有 Story（統一管理）
│
├── archive/                        # 已完成/棄置的任務
│   ├── index.md
│   ├── epics/
│   ├── refactors/
│   ├── issues/
│   ├── stories/
│   ├── discussions/                # 討論過程留底
│   └── sprints/                    # 舊 Sprint 歷史記錄（舊方法論）
│
├── context/                        # 當前上下文
│   ├── current-run.md              # 當前 Run
│   └── recent-runs.md              # 最近 Run 摘要
│
└── reference/                      # 參考資料（需要時查）
    ├── platform-apis/              # API 文檔
    ├── design-specs/               # UI/UX 設計規格
    └── guides/                     # 操作指南
```

---

## 📚 文件角色說明

### Root 層級文件

| 文件 | 角色 | 目標讀者 | 用途 |
|------|------|----------|------|
| `README.md` | 專案入門指南 | 人類、新 Agent | 快速了解專案、快速開始 |
| `PROJECT_STATUS.md` | 專案狀態摘要 | 人類、Agent | 高層次狀態概覽、快速導航 |

### docs/ 層級文件

| 目錄/文件 | 角色 | 更新頻率 | 關鍵用途 |
|-----------|------|----------|----------|
| `00-AGENT-ONBOARDING.md` | Agent 入門 | 低 | 新 Agent 快速上手 |
| `memory/` | 核心記憶 | 中 | 專案願景、路線圖、架構、決策 |
| `backlog/` | 任務管理 | 高 | 當前任務狀態追蹤 |
| `context/` | 當前上下文 | 高 | 當前 Run 狀態、最近 Run 摘要 |
| `archive/` | 歷史記錄 | 低 | 已完成任務、討論留底 |
| `reference/` | 參考資料 | 低 | API 文檔、設計規格、指南 |

### 🚨 文件創建規範（Agent 必須遵守）

**嚴格禁止在 `docs/` root 層級創建任何文件！**

所有文件必須放在對應的目錄下：

| 文件類型 | 應該放在 | 範例 |
|---------|---------|------|
| 討論留底、分析報告 | `archive/discussions/` | `archive/discussions/roadmap-epic-alignment-check-2025-11-05.md` |
| Epic 文件 | `backlog/epics/` | `backlog/epics/epic-3-state-management-refactor.md` |
| Story 文件 | `backlog/stories/` | `backlog/stories/story-r1-0-zustand-implementation.md` |
| Issue 文件 | `backlog/issues/` | `backlog/issues/issue-2025-11-05-001.md` |
| 當前 Run | `context/` | `context/current-run.md` |
| 決策記錄 | `memory/decisions/` | `memory/decisions/state-management.md` |
| 架構文檔 | `memory/architecture/` | `memory/architecture/current.md` |
| API 文檔 | `reference/platform-apis/` | `reference/platform-apis/shopline-api-docs.md` |
| 設計規格 | `reference/design-specs/` | `reference/design-specs/ADMIN_API_TEST_UI_DESIGN.md` |
| 操作指南 | `reference/guides/` | `reference/guides/ENV_SETUP_GUIDE.md` |

**如果不確定文件應該放在哪裡**：
1. 先查閱 `docs/README.md` 的文件結構說明
2. 或查閱 `docs/memory/methodology.md` 的「文件體系設計」
3. 或參考現有類似文件的放置位置

---

## 🎯 快速查找

### 開始工作
1. 閱讀 [00-AGENT-ONBOARDING.md](./00-AGENT-ONBOARDING.md)
2. 查看 [context/current-run.md](./context/current-run.md) 了解當前任務
3. 查看 [backlog/index.md](./backlog/index.md) 了解所有任務

### 核心記憶
- [專案願景](./memory/vision.md)
- [專案路線圖](./memory/roadmap.md)
- [運作原則](./memory/principles.md)
- [重要決策](./memory/decisions/)

### 任務管理
- [Backlog 索引](./backlog/index.md)
- [當前 Run](./context/current-run.md)

---

## 📖 文件閱讀順序建議

### 新 Agent 第一次進入專案

1. **必讀**：`00-AGENT-ONBOARDING.md`（了解方法論和工作方式）
2. **查看當前狀態**：`context/current-run.md` → `backlog/index.md`
3. **了解專案**：`memory/vision.md` → `memory/roadmap.md`
4. **需要時查閱**：`memory/architecture/current.md`、`memory/decisions/`

### 開發 Run 時

1. **查看當前任務**：`context/current-run.md`
2. **讀取 Story 文件**：`backlog/stories/{story-id}.md`
3. **實作**（Story 文件應自包含，不需再查 memory）
4. **完成後更新**：Story 狀態、Epic 進度、recent-runs

### 建立 Story 時

1. **讀取相關記憶**：`memory/architecture/`、`memory/decisions/`、`reference/`
2. **整理資訊到 Story 文件**（確保自包含）
3. **更新 Epic 文件**

---

## 🔗 相關文件

- **Root README**：`../README.md`
- **專案狀態**：`../PROJECT_STATUS.md`

---

**最後更新**: 2025-11-05
