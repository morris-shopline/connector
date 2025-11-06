# 型別共享策略分析

## 🤔 當前設計的問題

### 「開發時使用 shared，部署時分流」的實際情況

**設計意圖**：
- 開發時：使用 `shared/types.ts` 統一管理型別
- 部署時：前端和後端各自使用自己的型別定義

**實際問題**：
1. ❌ **前端仍在使用 `@/shared/types`**，部署時會失敗
2. ❌ **需要手動同步**：新增型別時要複製到兩處
3. ❌ **容易不一致**：忘記同步時，開發和部署環境型別不一致
4. ❌ **認知負擔**：開發者需要記住「開發時用 shared，部署時用本地」

## 📊 設計方案比較

### 方案 A：開發時 shared，部署時分流（當前設計）

**優點**：
- ✅ 開發時有單一來源，型別統一
- ✅ 開發體驗較好（不需要複製）

**缺點**：
- ❌ **容易混亂**：開發和部署環境不一致
- ❌ **需要手動同步**：容易忘記同步
- ❌ **部署時出錯**：忘記同步會導致部署失敗
- ❌ **認知負擔高**：需要記住兩套規則
- ❌ **維護成本高**：型別變更需要同步兩處

**評估**：❌ **不推薦** - 容易造成混亂，維護成本高

---

### 方案 B：完全獨立，不使用 shared（推薦）

**做法**：
- 每個項目（frontend/backend）完全獨立維護型別
- 刪除 `shared/` 目錄
- 前端使用 `frontend/types.ts`
- 後端使用 `backend/src/types.ts`

**優點**：
- ✅ **簡單明確**：開發和部署環境一致
- ✅ **無同步問題**：不需要手動同步
- ✅ **部署可靠**：不會因為 shared 缺失導致部署失敗
- ✅ **認知負擔低**：只需要記住一套規則
- ✅ **符合分離部署架構**：每個項目完全獨立

**缺點**：
- ⚠️ 型別變更需要在兩處手動更新
- ⚠️ 可能出現型別不一致（但這是分離部署的必然代價）

**評估**：✅ **推薦** - 簡單、可靠、符合架構

**配套措施**：
1. 建立型別檢查腳本，確保前後端型別一致
2. 在 CI/CD 中加入型別一致性檢查
3. 文件明確說明型別定義位置

---

### 方案 C：部署時複製 shared（折衷方案）

**做法**：
- 開發時使用 `shared/types.ts`
- 部署時在 Build Command 中複製 shared 到項目內

**Vercel Build Command**：
```bash
cp -r ../shared ./shared && npm run build
```

**Render Build Command**：
```bash
cp -r ../shared ./shared && npm install && npm run build
```

**優點**：
- ✅ 開發時有單一來源
- ✅ 部署時也能訪問 shared

**缺點**：
- ⚠️ **部署配置複雜**：需要調整 Build Command
- ⚠️ **部署步驟增加**：每次部署都要複製
- ⚠️ **可能出錯**：複製命令失敗會導致部署失敗
- ⚠️ **認知負擔**：需要理解部署時的複製邏輯
- ⚠️ **Vercel/Render 限制**：Root Directory 設定可能影響路徑

**評估**：⚠️ **可接受** - 但需要確保部署配置正確

**配套措施**：
1. 在本地測試部署流程（確保複製命令正確）
2. 在 CI/CD 中測試 Build Command
3. 文件明確說明 Build Command 的用途

---

### 方案 D：使用 npm workspace / monorepo（進階方案）

**做法**：
- 將 shared 發布為 npm package
- 前端和後端都依賴這個 package
- 使用 npm workspace 或 yarn workspace 管理

**優點**：
- ✅ 型別統一管理
- ✅ 版本控制清晰
- ✅ 開發和部署環境一致

**缺點**：
- ❌ **架構複雜**：需要建立 package 結構
- ❌ **發布流程**：型別變更需要發布新版本
- ❌ **過度設計**：對小型專案來說太複雜
- ❌ **學習成本**：需要了解 monorepo 工具

**評估**：⚠️ **僅適用於大型專案** - 對當前專案來說過於複雜

---

## 🎯 推薦方案：方案 B（完全獨立）

### 為什麼推薦方案 B？

1. **符合分離部署架構**
   - 前端和後端是獨立部署的
   - 各自維護型別定義是合理的

2. **簡單可靠**
   - 開發和部署環境一致
   - 不會因為 shared 缺失導致部署失敗

3. **維護成本低**
   - 不需要手動同步
   - 不需要複雜的部署配置

4. **認知負擔低**
   - 只需要記住：每個項目有自己的型別定義

### 實施步驟

#### 1. 建立 `frontend/types.ts`

從 `shared/types.ts` 複製內容到 `frontend/types.ts`

#### 2. 更新前端引用

將所有 `@/shared/types` 改為 `@/types` 或 `../types`

#### 3. 更新 `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/types": ["./types"]
    }
  },
  "include": [
    "types.ts",
    "**/*.ts",
    "**/*.tsx"
  ]
}
```

#### 4. 刪除 `shared/` 目錄（可選）

如果確定不再需要，可以刪除 `shared/` 目錄

#### 5. 更新文件

- 說明型別定義位置
- 說明如何同步型別（如果需要的話）

### 配套措施

#### 1. 型別檢查腳本（可選）

建立腳本檢查前後端型別是否一致：

```bash
# scripts/check-types.sh
echo "檢查前後端型別一致性..."
diff frontend/types.ts backend/src/types.ts
```

#### 2. 型別同步腳本（可選）

如果確實需要同步，建立腳本：

```bash
# scripts/sync-types.sh
echo "同步型別定義..."
cp frontend/types.ts backend/src/types.ts
```

#### 3. 文件說明

在 README 或開發文件中明確說明：
- 型別定義位置
- 型別變更時的處理方式
- 如何確保前後端型別一致

---

## 📝 替代方案：方案 C（部署時複製）

如果決定使用方案 C，需要：

### 1. 確保 Build Command 正確

**Vercel**：
```bash
cp -r ../shared ./shared && npm run build
```

**Render**：
```bash
cp -r ../shared ./shared && npm install && npm run build
```

### 2. 在本地測試

確保本地也能執行相同的 Build Command：

```bash
cd frontend
cp -r ../shared ./shared
npm run build
```

### 3. 處理路徑問題

確保 `next.config.js` 和 `tsconfig.json` 的設定正確：

```javascript
// next.config.js
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@/shared': path.resolve(__dirname, './shared') // 注意：是 ./shared 而非 ../shared
  }
  return config
}
```

### 4. 建立部署檢查清單

- [ ] Build Command 已更新
- [ ] 本地測試通過
- [ ] Vercel/Render 部署測試通過
- [ ] 文件已更新

---

## 🔍 總結

### 當前問題

「開發時使用 shared，部署時分流」的設計**確實會造成混亂**：
- ❌ 開發和部署環境不一致
- ❌ 需要手動同步
- ❌ 容易忘記同步
- ❌ 認知負擔高

### 推薦做法

**方案 B（完全獨立）**：
- ✅ 簡單明確
- ✅ 開發和部署環境一致
- ✅ 符合分離部署架構
- ✅ 維護成本低

**配套措施**：
- 建立型別檢查腳本（確保一致性）
- 文件明確說明型別定義位置
- 在開發流程中加入型別檢查

### 如果必須使用 shared

**方案 C（部署時複製）**：
- ⚠️ 需要確保 Build Command 正確
- ⚠️ 需要在本地測試部署流程
- ⚠️ 需要處理路徑問題

---

## 📚 參考

- [專案結構與部署架構](./PROJECT_STRUCTURE.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

**最後更新**: 2025-01-XX  
**維護者**: 專案團隊

