# App Bridge 使用指南

App Bridge 提供 UI 元件庫和通訊能力，讓應用程式可以在 SHOPLINE Admin 內部或頂部顯示統一的官方元件，並與 SHOPLINE Admin 的其餘部分進行通訊。

## 📋 目錄

- [概述](#概述)
- [快速開始](#快速開始)
- [Actions](#actions)
  - [Redirect](#redirect)
  - [Authorization](#authorization)
  - [Message](#message)
  - [Subscribe](#subscribe)
- [相關文件連結](#相關文件連結)

## 概述

App Bridge 提供以下能力：

- 在 SHOPLINE Admin 內部顯示統一的官方元件
- 與 SHOPLINE Admin 進行通訊
- 開啟特定選單和頁面
- 重導向至應用程式授權頁面
- 顯示對話框

**重要注意事項**：
- App Bridge 僅適用於嵌入式應用程式（Embedded Apps）
- 使用標準化元件可提升商家使用者體驗的一致性

## 快速開始

### 安裝

```bash
npm install @shoplinedev/appbridge
# 或
yarn add @shoplinedev/appbridge
```

### 初始化

```typescript
import Client, { shared } from '@shoplinedev/appbridge'

const app = Client.createApp({
  appKey: 'your-app-key',
  host: shared.getHost()
})
```

**參數說明**：

| 參數 | 說明 | 類型 |
|------|------|------|
| `appKey` | 應用程式的 appkey | `string` |
| `host` | SHOPLINE admin host | `string` |

## Actions

### Redirect

Redirect 方法可用來修改瀏覽器 URL，並在 SHOPLINE 後台開啟特定選單和頁面。

#### 相關 API

| 方法 | 說明 | 參數 |
|------|------|------|
| `replaceTo` | 變更目前視窗 URL | `url: string` |
| `routerTo` | 基於 Admin 進行頁面跳轉 | `url: string` |
| `ToAdminPage` | 跳轉至 Admin 特定頁面 | `ToAdminPage` 參數 |

#### ToAdminPage 參數

| 參數 | 說明 | 類型 |
|------|------|------|
| `admin_section` | 特定資源頁面 | `ADMIN_SECTION` |
| `id` | 資源 id | `string` |
| `create` | 進入資源建立頁面 | `boolean` |
| `newContext` | 開啟新頁面 | `boolean` |

**注意**：如果同時使用 `create` 和 `id`，會優先重導向至資源建立頁面。

#### 程式碼範例

```typescript
import { Redirect } from '@shoplinedev/appbridge'

const redirect = Redirect.create(app)

// 重導向
redirect.replaceTo(redirectUri)

// 路由跳轉
redirect.routerTo(redirectUri)

// 跳轉至特定資源頁面
redirect.ToAdminPage(Redirect.ADMIN_SECTION.CATEGORIES, {
  create: true,
  id: '1000001',
  newContext: true
})
```

### Authorization

使用 OAuth 方法可修改瀏覽器 URL 並跳轉至 SHOPLINE admin 的授權頁面。

#### 相關 API

| 方法 | 說明 | 返回值 |
|------|------|--------|
| `invoke` | 跳轉至授權頁面 | `void` |

#### 參數說明

| 參數 | 說明 | 類型 |
|------|------|------|
| `scope` | 權限點，多個權限點以逗號分隔 | `string` |
| `appKey` | 應用程式的 appkey | `string` |
| `redirectUri` | 應用程式的回調地址 | `string` |

#### 程式碼範例

```typescript
import { Oauth } from '@shoplinedev/appbridge'

Oauth.create(app).invoke({
  scope: 'read_products,write_products',
  appKey: 'your-app-key',
  redirectUri: 'https://your-app.com/callback'
})
```

### Message

使用 Message 方法可在介面頂部顯示對話框，提供快速且簡潔的操作結果回饋。用於傳達一般性的非必要操作確認。

#### 相關 API

| 方法 | 說明 | 返回值 |
|------|------|--------|
| `Open` | 開啟訊息 | `void` |

#### 參數說明

| 參數 | 說明 | 類型 |
|------|------|------|
| `messageInfo` | 訊息內容 | `string` |
| `type` | 訊息類型 | `'success' \| 'warning' \| 'info' \| 'error'` |

#### 程式碼範例

```typescript
import { Message } from '@shoplinedev/appbridge'

Message.create(app).Open({
  messageInfo: '操作成功',
  type: 'success'
})
```

### Subscribe

使用 Subscribe 方法可訂閱相關動作集，當訂閱的動作被觸發時，將執行對應的訊息函數。

#### 相關 API

| 方法 | 說明 | 返回值 |
|------|------|--------|
| `subscribe` | 訂閱特定方法集的訊息執行 | `void` |
| `unsubscribe` | 清除特定方法集的訂閱事件 | `void` |

#### 參數說明

| 參數 | 說明 | 類型 |
|------|------|------|
| `ACTION` | 方法集 | `ACTION` |
| `callBackFunction` | 動作完成時的回調函數 | `Function` |

**重要注意事項**：
由於訂閱事件是全域性的，可在多處訂閱。如果任何函數中消費了相同類型的訂閱場景，所有先前訂閱的相同類型訂閱事件也會被消費。

#### 可用的 Actions

| ACTION | 說明 |
|--------|------|
| `MESSAGE` | 開啟訊息 |
| `OPEN_MODAL` | 開啟彈出視窗 |
| `MODAL_SAVE` | 彈出視窗儲存 |
| `MODAL_CLOSE` | 彈出視窗取消 |
| `REDIRECT` | 導航重導向 |
| `ROUTER_REDIRECT` | Router 導航重導向 |
| `ROUTER_TO_SPECIFIED_PAGE` | 跳轉至特定資源頁面 |

#### 程式碼範例

```typescript
import { Modal } from '@shoplinedev/appbridge'

Modal.create(app).subscribe(Modal.ACTION.MODAL_SAVE, () => {
  // 執行某些操作
  console.log('modal has saved')
})

Modal.create(app).unsubscribe(Modal.ACTION.MODAL_SAVE)
```

## 相關文件連結

### 官方文件

1. [App Bridge 概述](https://developer.shopline.com/docs/apps/development-tool/app-bridge/overview?version=v20260301)
2. [快速開始](https://developer.shopline.com/docs/apps/development-tool/app-bridge/getting-started?version=v20260301)
3. [Redirect Action](https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/redirect?version=v20260301)
4. [Authorization Action](https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/authorization?version=v20260301)
5. [Message Action](https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/message?version=v20260301)
6. [Subscribe Action](https://developer.shopline.com/docs/apps/development-tool/app-bridge/actions/subscribe?version=v20260301)

## 使用場景建議

### 1. 應用程式安裝流程

在商家安裝嵌入式應用程式時，使用 `Oauth.invoke()` 重導向至授權頁面：

```typescript
import { Oauth } from '@shoplinedev/appbridge'

// 當檢測到需要授權時
Oauth.create(app).invoke({
  scope: 'read_products,write_products',
  appKey: appKey,
  redirectUri: redirectUri
})
```

### 2. 操作結果提示

在操作完成後顯示成功或錯誤訊息：

```typescript
import { Message } from '@shoplinedev/appbridge'

// 操作成功
Message.create(app).Open({
  messageInfo: '商品已成功更新',
  type: 'success'
})

// 操作失敗
Message.create(app).Open({
  messageInfo: '更新失敗，請稍後再試',
  type: 'error'
})
```

### 3. 導航至相關頁面

在應用程式中提供連結至 SHOPLINE Admin 相關頁面：

```typescript
import { Redirect } from '@shoplinedev/appbridge'

const redirect = Redirect.create(app)

// 跳轉至商品分類建立頁面
redirect.ToAdminPage(Redirect.ADMIN_SECTION.CATEGORIES, {
  create: true,
  newContext: true
})

// 跳轉至特定商品頁面
redirect.ToAdminPage(Redirect.ADMIN_SECTION.PRODUCTS, {
  id: 'product-id-123',
  newContext: true
})
```

### 4. 監聽 Modal 事件

訂閱 Modal 的儲存和關閉事件：

```typescript
import { Modal } from '@shoplinedev/appbridge'

const modal = Modal.create(app)

modal.subscribe(Modal.ACTION.MODAL_SAVE, () => {
  // 處理儲存邏輯
  saveData()
})

modal.subscribe(Modal.ACTION.MODAL_CLOSE, () => {
  // 處理關閉邏輯
  cleanup()
})
```

## 注意事項

1. **僅適用於嵌入式應用**：App Bridge 只能在嵌入式應用程式中使用
2. **全域訂閱**：訂閱事件是全域性的，需注意避免多處重複訂閱
3. **錯誤處理**：所有 App Bridge 方法都應包含適當的錯誤處理機制
4. **型別安全**：使用 TypeScript 時可獲得完整的型別支援

---

**最後更新**: 2025-01-XX  
**文件版本**: v20260301
