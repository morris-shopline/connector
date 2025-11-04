# 型別同步工作流程

## 📋 工作流程說明

本專案採用**手動同步 + 自動檢查**的方式管理型別定義：

- **統一維護**：所有型別定義在 `shared/types.ts` 中維護
- **手動同步**：修改後執行同步腳本
- **自動檢查**：Git Hook 和 CI/CD 自動檢查一致性

## 🔄 工作流程

### 1. 修改型別定義

編輯 `shared/types.ts`：

```typescript
// shared/types.ts
export interface NewType {
  id: string
  name: string
}
```

### 2. 同步型別定義

執行同步腳本：

```bash
npm run sync:types
```

這會將 `shared/types.ts` 同步到：
- `frontend/types.ts`
- `backend/src/types.ts`

### 3. 檢查一致性（自動）

在以下時機會自動檢查：

- **Git Commit 前**：Git Hook 自動檢查
- **CI/CD 建置時**：自動檢查，不一致則建置失敗

也可以手動檢查：

```bash
npm run check:types
```

## 📝 開發規範

### ✅ 應該做的事

1. **修改型別時**：只修改 `shared/types.ts`
2. **修改後**：執行 `npm run sync:types`
3. **Commit 前**：確保型別已同步（Git Hook 會檢查）

### ❌ 不應該做的事

1. **不要手動修改** `frontend/types.ts` 或 `backend/src/types.ts`
   - 這些檔案由腳本自動生成
   - 手動修改會在下次同步時被覆蓋

2. **不要直接引用** `shared/types.ts`（部署時無法訪問）
   - 前端使用：`import { ... } from '@/types'`
   - 後端使用：`import { ... } from '../types'`

## 🛠️ 腳本說明

### `npm run sync:types`

同步型別定義到前後端。

**使用時機**：
- 修改 `shared/types.ts` 後
- 初次設定專案時

### `npm run check:types`

檢查型別一致性。

**使用時機**：
- 想確認型別是否已同步
- CI/CD 自動執行
- Git Hook 自動執行

## 🔍 故障排除

### 問題：型別檢查失敗

**症狀**：
```
❌ 型別定義不一致！
  - frontend/types.ts 與 shared/types.ts 不一致
💡 提示：執行 npm run sync:types 同步型別定義
```

**解決方法**：
```bash
npm run sync:types
```

### 問題：部署時型別錯誤

**症狀**：部署時找不到型別定義

**原因**：前端或後端沒有自己的型別檔案

**解決方法**：
1. 確保已執行 `npm run sync:types`
2. 檢查 `frontend/types.ts` 和 `backend/src/types.ts` 是否存在

## 📚 相關文件

- [型別共享策略分析](./TYPE_SHARING_ANALYSIS.md)
- [自動化同步方案分析](./AUTO_SYNC_ANALYSIS.md)
- [專案結構與部署架構](./PROJECT_STRUCTURE.md)

---

**最後更新**: 2025-01-XX  
**維護者**: 專案團隊

