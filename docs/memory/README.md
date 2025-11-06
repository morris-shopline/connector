# Memory 目錄說明

> 核心記憶，永遠都如此或暫時需要如此的重要資訊

---

## 📁 文件說明

### 核心文件

- **`vision.md`** - 專案願景（永遠都如此）
- **`roadmap.md`** - 專案路線圖（永遠都如此，會更新）
- **`principles.md`** - 運作原則（永遠都如此）
- **`methodology.md`** - 詳細方法論說明（參考用）

### 子目錄

- **`decisions/`** - 重要決策記錄（永遠都如此）
  - 決策摘要，不包含討論過程
  - 討論過程在 `docs/archive/discussions/`
  
- **`architecture/`** - 架構文檔（暫時需要如此，會演進）
  - `current.md` - 當前系統架構
  - `project-structure.md` - 專案結構與部署架構

---

## 🎯 使用時機

**需要時查閱**：
- Story 建立階段：閱讀相關架構和決策
- 討論決策時：參考現有決策
- 架構調整時：更新架構文檔

**不需要頻繁查閱**：
- 日常開發 Run：Story 文件已包含所有必要資訊

---

## 📝 更新原則

**何時更新**：
- 做出決策 → 更新 `decisions/`
- 架構改變 → 更新 `architecture/`
- Roadmap 調整 → 更新 `roadmap.md`
- Vision 調整 → 更新 `vision.md`

**重要**：重要資訊必須寫入 memory/，否則下個 Agent 會遺漏。

---

**最後更新**: 2025-11-05

