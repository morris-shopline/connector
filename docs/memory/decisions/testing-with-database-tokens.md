# 決策：地端 API 測試使用資料庫 Token

**決策日期**: 2025-11-13  
**決策類型**: 測試方法論  
**相關 Story**: Story 5.4, 所有涉及外部平台 API 的 Story

---

## 決策內容

**地端測試 API 時，應從資料庫取一組有效的 handle-token 進行測試，而非嘗試建立新的 OAuth 授權。**

---

## 背景與問題

在開發和測試過程中，Agent 無法實際執行 OAuth 授權流程（需要實際的外部平台和用戶操作）。但我們仍然需要驗證：
- API 端點是否正確運作
- 錯誤處理邏輯是否正確
- 資料格式是否正確

傳統做法是跳過這些測試，但這會導致：
- 無法發現 API 呼叫的邏輯錯誤
- 無法驗證錯誤處理是否正確
- 無法確認資料格式是否符合預期

---

## 解決方案

**使用資料庫中已存在的有效 Token 進行 API 測試。**

### 測試流程

1. **從資料庫取得有效的 Store/Connection**
   ```typescript
   // 範例：取得 Shopline Store
   const store = await prisma.store.findFirst({
     where: { 
       isActive: true,
       accessToken: { not: null }
     }
   });
   ```

2. **使用取得的 Token 測試 API 端點**
   ```typescript
   // 範例：測試 Shopline API
   const adapter = PlatformServiceFactory.getAdapter('shopline');
   const products = await adapter.getProducts(
     store.accessToken,
     store.handle,
     { page: 1, limit: 10 }
   );
   ```

3. **驗證回應格式和錯誤處理**
   - 檢查回應格式是否符合預期
   - 測試錯誤情況（例如：無效 token、過期 token）
   - 驗證錯誤處理邏輯

### 適用範圍

- ✅ **Shopline API 測試**：使用 `Store` 表中的 `handle` 和 `accessToken`
- ✅ **Next Engine API 測試**：使用 `IntegrationAccount` 表中的 `authPayload.accessToken`
- ✅ **Webhook 測試**：使用實際的 webhook 請求（如果有測試環境）
- ❌ **OAuth 授權流程**：仍需 User Test（無法自動化）

---

## 實作規範

### 1. 測試腳本位置

測試腳本應放在 `backend/scripts/test-*.ts` 或 `backend/src/__tests__/` 目錄下。

### 2. 測試腳本命名

- API 測試：`test-{platform}-api.ts`
- 整合測試：`test-{feature}-integration.ts`

### 3. 測試腳本範例

```typescript
// backend/scripts/test-shopline-api.ts
import { PrismaClient } from '@prisma/client';
import { PlatformServiceFactory } from '../src/services/platformServiceFactory';
import { ShoplineAdapter } from '../src/services/shoplineAdapter';

const prisma = new PrismaClient();

async function testShoplineAPI() {
  // 1. 從資料庫取得有效的 Store
  const store = await prisma.store.findFirst({
    where: { 
      isActive: true,
      accessToken: { not: null }
    }
  });

  if (!store || !store.accessToken) {
    console.log('⚠️ 資料庫中沒有有效的 Store，跳過測試');
    return;
  }

  // 2. 初始化 Factory
  PlatformServiceFactory.initialize();
  const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter;

  // 3. 測試 API 端點
  try {
    console.log('測試 Store Info API...');
    const storeInfo = await adapter.getStoreInfoFromAPI(store.accessToken, store.handle);
    console.log('✅ Store Info API 成功:', storeInfo);

    console.log('測試 Products API...');
    const products = await adapter.getProducts(store.accessToken, store.handle, { page: 1, limit: 10 });
    console.log('✅ Products API 成功:', products);

    // ... 其他 API 測試
  } catch (error) {
    console.error('❌ API 測試失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testShoplineAPI();
```

### 4. 錯誤處理測試

測試腳本應包含錯誤情況的測試：
- Token 不存在的情況
- Token 過期的情況
- 無效 handle 的情況

---

## 注意事項

1. **不要修改資料庫資料**：測試時應使用現有資料，不要建立或修改測試資料
2. **測試後清理**：如果測試過程中建立了臨時資料，應在測試後清理
3. **環境變數**：確保測試環境的環境變數已正確設定
4. **資料庫連線**：測試完成後應正確關閉資料庫連線

---

## 相關文件

- `docs/memory/methodology.md` - 方法論詳細說明
- `docs/backlog/stories/story-5-4-shopline-adapter-refactor.md` - Story 5.4（首次應用此規則）

---

**最後更新**: 2025-11-13

