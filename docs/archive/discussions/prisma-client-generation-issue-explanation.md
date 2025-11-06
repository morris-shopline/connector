# Prisma Client 生成問題說明

**問題發生時間**: 2025-11-06  
**問題類型**: 生產環境部署問題  
**影響範圍**: 所有使用 Prisma 的 API 端點（註冊、登入等）

---

## 🔍 問題診斷過程

### 錯誤訊息
```
Cannot read properties of undefined (reading 'findUnique')
```

### 錯誤發生位置
- `POST /api/auth/register` - 註冊 API
- `POST /api/auth/login` - 登入 API
- 所有使用 `prisma.user.findUnique()` 的端點

### 診斷邏輯

1. **錯誤訊息分析**
   - `Cannot read properties of undefined` 表示某個物件是 `undefined`
   - `reading 'findUnique'` 表示嘗試讀取 `undefined.findUnique`
   - 這意味著 `prisma` 物件是 `undefined`

2. **代碼檢查**
   ```typescript
   // backend/src/routes/auth.ts
   const prisma = new PrismaClient()
   
   // 使用時
   const existingUser = await prisma.user.findUnique({
     where: { email }
   })
   ```
   - 代碼看起來正確，`prisma` 應該被初始化
   - 但在生產環境中，`prisma` 卻是 `undefined`

3. **Prisma Client 生成機制**
   - Prisma 是一個 **Code Generator**（程式碼生成器）
   - 它會根據 `schema.prisma` 生成 TypeScript 類別和型別定義
   - 生成的程式碼位於 `node_modules/.prisma/client/`
   - **必須執行 `prisma generate` 才會生成這些程式碼**

4. **問題根源**
   - 在生產環境中，`build` 腳本只執行 `tsc`（TypeScript 編譯）
   - **沒有執行 `prisma generate`**
   - 因此 `@prisma/client` 模組中沒有生成的程式碼
   - 當執行 `new PrismaClient()` 時，因為生成的程式碼不存在，所以返回 `undefined`

---

## 📚 什麼是 Prisma Client 未生成？

### Prisma 的工作原理

Prisma 是一個 **ORM（Object-Relational Mapping）** 工具，它使用 **Code Generation** 的方式運作：

1. **定義 Schema** (`schema.prisma`)
   ```prisma
   model User {
     id    String @id @default(cuid())
     email String @unique
   }
   ```

2. **生成 Client** (`prisma generate`)
   - 讀取 `schema.prisma`
   - 生成 TypeScript 程式碼到 `node_modules/.prisma/client/`
   - 生成 `PrismaClient` 類別和所有模型方法（`findUnique`, `create`, `update` 等）

3. **使用 Client**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   await prisma.user.findUnique({ where: { email } })
   ```

### 為什麼需要生成？

- **型別安全**: 生成的程式碼包含完整的 TypeScript 型別定義
- **效能優化**: 生成的程式碼針對特定資料庫結構優化
- **動態性**: 當 Schema 變更時，需要重新生成 Client

### 未生成的後果

如果沒有執行 `prisma generate`：
- `@prisma/client` 模組中沒有生成的程式碼
- `PrismaClient` 類別不存在或未正確初始化
- 執行 `new PrismaClient()` 會返回 `undefined` 或拋出錯誤
- 所有使用 Prisma 的操作都會失敗

---

## 🆕 這是新問題嗎？

### 是的，這是新問題

**原因**：這是 **Story 3.1** 新增的功能，之前沒有使用 Prisma 進行使用者認證。

### 之前的架構

#### 之前使用 Prisma 的地方

在 **Story 3.1 之前**，Prisma 已經在專案中使用，主要用於：

1. **ShoplineService** (`backend/src/services/shopline.ts`)
   ```typescript
   const prisma = new PrismaClient()
   
   // 用於 Store（資料庫中的 stores 表）和 WebhookEvent 操作
   await prisma.store.upsert({ ... })  // Store = 資料庫中的 stores 表（Shopline 商店資訊）
   await prisma.webhookEvent.create({ ... })
   ```

2. **API Routes** (`backend/src/routes/api.ts`)
   ```typescript
   // 用於查詢 Store 列表
   const stores = await prisma.store.findMany({ ... })
   ```

**重要澄清**：
- **Store** = 資料庫中的 `stores` 表（Shopline 商店資訊），不是 Prisma Client 的 store
- 之前正式站已經使用過 Store 操作（OAuth 授權、Webhook 接收等）

#### 為什麼之前沒有問題？

**關鍵問題**：如果之前正式站已經使用過 Store 操作，那表示 Prisma Client 之前是生成的。為什麼現在會出現問題？

**可能的原因**：

根據 Git 歷史記錄，之前的 `build` 腳本確實只有 `tsc`，沒有 `prisma generate`。那為什麼之前沒有問題？

**最可能的原因**：

1. **Prisma Client 的緩存機制（最可能）**
   - 如果之前部署過，`node_modules/.prisma/client/` 可能已經存在
   - Render 的 build 流程可能不會完全清除 `node_modules`
   - 所以舊的生成程式碼（包含 `Store` 和 `WebhookEvent` 模型）還在
   - 之前使用 `prisma.store` 和 `prisma.webhookEvent` 時，因為這些模型已經生成，所以沒有問題

2. **Schema 變更觸發重新生成（關鍵原因）**
   - **Story 3.1** 新增了 `User` 模型到 `schema.prisma`
   - 當 Schema 變更時，需要重新生成 Prisma Client
   - 如果 build 流程沒有包含 `prisma generate`，新的模型就不會被生成
   - 所以當嘗試使用 `prisma.user.findUnique()` 時，會發現 `user` 模型不存在
   - **這就是為什麼之前使用 `prisma.store` 沒問題，但現在使用 `prisma.user` 會出錯**

3. **Story 3.1 新增的認證路由**
   - **Story 3.1** 新增了 `backend/src/routes/auth.ts`
   - 這是全新的檔案，使用 Prisma 進行使用者認證（`prisma.user.findUnique()`）
   - 當這個新路由被調用時，才發現 Prisma Client 未包含新的 `User` 模型

**總結**：
- 之前的 `prisma.store` 和 `prisma.webhookEvent` 能正常運作，是因為這些模型在之前的部署中已經生成
- 但 **Story 3.1** 新增了 `User` 模型，需要重新生成 Prisma Client
- 如果 build 流程沒有包含 `prisma generate`，新的 `User` 模型就不會被生成
- 所以當嘗試使用 `prisma.user` 時，會發現模型不存在，導致 `prisma` 為 `undefined`

---

## 🔄 為什麼之前的架構不會碰到這問題？

### 可能的原因

#### 1. **本地開發 vs 生產環境**

**本地開發**：
```bash
# 開發者可能執行過
npm install
npx prisma generate  # 手動執行
npm run dev
```

**生產環境**：
```bash
# Render 的 build 流程
npm install
npm run build  # 只執行 tsc，沒有 prisma generate
npm start
```

#### 2. **Prisma Client 的安裝機制**

當執行 `npm install @prisma/client` 時：
- 會安裝 `@prisma/client` 套件
- **但不會自動生成 Client 程式碼**
- 需要額外執行 `prisma generate`

#### 3. **之前的部署可能包含生成步驟**

可能之前：
- Render 的 build 命令包含 `prisma generate`
- 或者有手動執行過生成步驟
- 或者使用了不同的 build 流程

#### 4. **Story 3.1 是新的使用場景**

**Story 3.1 之前**：
- Prisma 主要用於 Store 和 WebhookEvent 操作
- 這些操作可能在部署時已經測試過，或者沒有被頻繁調用

**Story 3.1 之後**：
- 新增了使用者認證功能
- 註冊和登入是 **高頻調用的端點**
- 一旦有使用者嘗試註冊或登入，就會立即觸發錯誤

---

## 🔧 修復方案

### 問題
```json
{
  "scripts": {
    "build": "tsc --skipLibCheck || echo 'Build completed with type errors (non-blocking)'"
  }
}
```

### 修復
```json
{
  "scripts": {
    "build": "prisma generate && tsc --skipLibCheck || echo 'Build completed with type errors (non-blocking)'"
  }
}
```

### 修復說明

1. **在 build 前生成 Prisma Client**
   - `prisma generate` 會讀取 `schema.prisma`
   - 生成 TypeScript 程式碼到 `node_modules/.prisma/client/`
   - 確保 `PrismaClient` 類別可用

2. **然後編譯 TypeScript**
   - `tsc` 會編譯 TypeScript 程式碼
   - 生成的 Prisma Client 會被正確引用

3. **生產環境執行流程**
   ```bash
   npm install          # 安裝依賴
   npm run build        # 執行 prisma generate + tsc
   npm start            # 啟動服務
   ```

---

## 📝 經驗教訓

### 1. **Prisma 的 build 流程必須包含生成步驟**

任何使用 Prisma 的專案，build 流程都必須包含：
```bash
prisma generate && tsc
```

### 2. **本地開發 vs 生產環境的一致性**

確保本地開發和生產環境使用相同的 build 流程：
- 本地：`npm run build` 應該包含 `prisma generate`
- 生產：`npm run build` 應該包含 `prisma generate`

### 3. **測試生產環境的 build 流程**

在部署前，應該測試生產環境的 build 流程：
```bash
# 清除 node_modules 和 dist
rm -rf node_modules dist

# 重新安裝和 build
npm install
npm run build

# 確認 Prisma Client 已生成
ls node_modules/.prisma/client/
```

### 4. **CI/CD 流程檢查**

確保 CI/CD 流程中包含 Prisma 生成步驟：
- GitHub Actions
- Render build 命令
- 其他部署平台

---

## 🔗 相關文件

- **Prisma 官方文檔**: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client
- **部署日誌**: `docs/context/deployment-log-run-2025-11-06-01.md`
- **Code Review**: `docs/archive/discussions/tpm-code-review-story-3-1-to-3-4.md`

---

**最後更新**: 2025-11-06

