# Archive 目錄說明

> 已完成的任務和棄置的任務，以及討論過程留底

---

## 📁 目錄結構

```
archive/
├── index.md          # 歸檔索引（所有歸檔內容的總覽）
├── discussions/      # 討論過程留底
├── epics/            # 已完成的 Epics
├── refactors/        # 已完成的 Refactors
├── issues/           # 已完成的 Issues
├── stories/          # 已完成的 Stories
├── old-runs/         # 舊 Run 記錄
└── deployment-logs/   # 部署日誌記錄
```

---

## 📋 歸檔原則

### 何時歸檔

1. **文件已被新版本取代** - 新文件已建立，舊文件保留作為參考
2. **文件內容已過時** - 文件中的資訊不再符合當前專案狀態
3. **文件結構已重組** - 文件內容已整合到新的文件體系中
4. **文件不再需要** - 功能已移除或不再使用
5. **討論過程已結案** - 討論過程留底，決策已記錄在 `memory/decisions/`

### 歸檔位置

- **討論過程**: `archive/discussions/` - 討論過程留底，決策已記錄在 `memory/decisions/`
- **已完成任務**: `archive/epics/`, `archive/refactors/`, `archive/issues/`, `archive/stories/`
- **舊 Run 記錄**: `archive/old-runs/`
- **部署日誌**: `archive/deployment-logs/` - 每次 Run 推上線的詳細記錄

---

## 📚 查看歸檔內容

所有歸檔內容的總覽請查看：`archive/index.md`

---

**最後更新**: 2025-11-05

