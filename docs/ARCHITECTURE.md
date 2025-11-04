# 系統架構文件

## 概述

本專案是一個 Shopline API 整合應用程式，採用前後端分離的架構，支援 OAuth 2.0 授權和多商店管理。

## 系統架構

### 部署架構

**重要**：本專案採用**前後端分離部署**架構：

- **前端**：部署到 **Vercel**（Root Directory: `frontend/`）
- **後端**：部署到 **Render**（Root Directory: `backend/`）
- **型別定義**：前端和後端各自獨立維護型別定義

詳細說明請參考：[專案結構與部署架構](./PROJECT_STRUCTURE.md)

```
┌─────────────────────────────────────────────────────────────┐
│                     前端層 (Frontend)                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Next.js App (部署到 Vercel)                          │ │
│  │  - 商店列表展示                                       │ │
│  │  - 授權對話框                                         │ │
│  │  - Webhook 事件查看                                   │ │
│  │  - 型別定義：frontend/types.ts                        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────────────┐
│                     後端層 (Backend)                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Fastify Server (部署到 Render)                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │ │
│  │  │Auth Routes │  │API Routes  │  │Webhook Rt  │     │ │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     │ │
│  │        └───────────────┼───────────────┘            │ │
│  │                        │                              │ │
│  │              ┌─────────▼──────────┐                  │ │
│  │              │ ShoplineService    │                  │ │
│  │              │ - OAuth 流程        │                  │ │
│  │              │ - 簽名驗證          │                  │ │
│  │              │ - Token 管理        │                  │ │
│  │              └─────────┬──────────┘                  │ │
│  │  - 型別定義：backend/src/types.ts                    │ │
│  └────────────────────────┼──────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  Neon PostgreSQL        │
                │  - stores 表            │
                │  - webhook_events 表    │
                └─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  外部服務 (External)                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Shopline Platform                                    │ │
│  │  - OAuth 授權                                         │ │
│  │  - API 端點                                           │ │
│  │  - Webhook 推送                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

```

## 資料庫設計

### stores 表

存儲已授權的商店資訊。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | String (cuid) | 主鍵 |
| shoplineId | String (unique) | Shopline 商店 ID |
| handle | String? | 商店 Handle (如: paykepoc) |
| name | String? | 商店名稱 |
| domain | String? | 商店域名 |
| accessToken | String | Access Token (JWT) |
| expiresAt | DateTime? | Token 到期時間 |
| scope | String | 授權範圍 |
| isActive | Boolean | 是否啟用 |
| createdAt | DateTime | 建立時間 |
| updatedAt | DateTime | 更新時間 |

### webhook_events 表

存儲接收到的 Webhook 事件。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | String (cuid) | 主鍵 |
| storeId | String | 關聯的商店 ID |
| eventType | String | 事件類型 |
| payload | String | 事件資料 (JSON) |
| processed | Boolean | 是否已處理 |
| createdAt | DateTime | 建立時間 |

## API 端點

### 認證端點

**GET /api/auth/shopline/install**
- 描述: 處理 Shopline 應用安裝請求
- 查詢參數:
  - `appkey`: 應用 Key
  - `handle`: 商店 Handle
  - `timestamp`: 時間戳
  - `sign`: HMAC-SHA256 簽名
- 回應: 302 重導向到 Shopline 授權頁面

**GET /api/auth/shopline/callback**
- 描述: 處理 OAuth 授權回調
- 查詢參數:
  - `appkey`: 應用 Key
  - `code`: 授權碼
  - `handle`: 商店 Handle
  - `timestamp`: 時間戳
  - `sign`: HMAC-SHA256 簽名
- 回應: HTML 頁面（自動重導向到前端）

### 資料端點

**GET /api/stores**
- 描述: 取得所有已授權的商店
- 回應: JSON 陣列

**GET /api/stores/:shopId**
- 描述: 取得特定商店資訊
- URL 參數: `shopId`
- 回應: JSON 物件

### Webhook 端點

**POST /webhook/shopline**
- 描述: 接收 Shopline Webhook 事件
- Headers:
  - `x-shopline-signature`: Webhook 簽名
- Body: JSON 事件資料
- 回應: JSON 確認訊息

**GET /webhook/events**
- 描述: 取得 Webhook 事件列表
- 查詢參數:
  - 無
- 回應: JSON 陣列

## 安全機制

### 簽名驗證

**GET 請求簽名**

1. 收集所有查詢參數（排除 `sign`）
2. 按字母順序排序參數
3. 拼接成 `key1=value1&key2=value2` 格式
4. 使用 App Secret 進行 HMAC-SHA256 加密
5. 轉換為十六進制字串
6. 與接收到的簽名比較（使用 `crypto.timingSafeEqual()`）

**POST 請求簽名**

1. 取得請求 Body
2. 拼接 Body + Timestamp
3. 使用 App Secret 進行 HMAC-SHA256 加密
4. 轉換為十六進制字串
5. 與接收到的簽名比較

### 時間戳驗證

- 檢查時間戳是否在當前時間的 ±5 分鐘內
- 支援秒級和毫秒級時間戳

## OAuth 2.0 流程

```
1. 使用者在前端點擊「新增商店授權」
   ↓
2. 前端生成 HMAC-SHA256 簽名
   ↓
3. 重導向到 /api/auth/shopline/install
   ↓
4. 後端驗證簽名和時間戳
   ↓
5. 重導向到 Shopline 授權頁面
   https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize
   ↓
6. 使用者在 Shopline 完成授權
   ↓
7. Shopline 重導向回 /api/auth/shopline/callback
   ↓
8. 後端驗證簽名
   ↓
9. 使用授權碼交換 Access Token
   POST https://{handle}.myshopline.com/admin/oauth/token/create
   ↓
10. 解析 JWT Token，儲存商店資訊
   ↓
11. 重導向回前端頁面
```

## Token 管理

### Access Token

- 格式: JWT (JSON Web Token)
- 結構:
  ```json
  {
    "appKey": "應用 Key",
    "sellerId": "賣家 ID",
    "storeId": "商店 ID",
    "version": "V2",
    "domain": "商店域名",
    "timestamp": "時間戳",
    "iss": "發行者",
    "exp": "到期時間"
  }
  ```
- 解析: 從 JWT Payload 中提取 `storeId`、`domain`、`exp`

### Token 儲存

- 以完整 JWT 字串形式儲存
- 在實際呼叫 Shopline API 時使用
- 過期時間從 JWT 中提取並單獨儲存

## 前端架構

### 主要元件

- **Home** (`frontend/pages/index.tsx`): 主頁面
  - 商店列表標籤
  - Webhook 事件標籤
  - 授權對話框

- **StoreCard** (`frontend/components/StoreCard.tsx`): 商店卡片
  - 顯示商店資訊
  - 顯示授權狀態
  - 顯示 Token 到期時間

- **WebhookEventCard** (`frontend/components/WebhookEventCard.tsx`): 事件卡片
  - 顯示事件類型
  - 顯示事件資料
  - 顯示處理狀態

### 資料獲取

使用 SWR (stale-while-revalidate) 進行資料獲取：
- 自動重新驗證
- 快取管理
- 錯誤處理

### Hooks

- `useStores()`: 獲取商店列表
- `useWebhookEvents()`: 獲取 Webhook 事件

## 部署考量

### 開發環境

- 使用 ngrok 提供 HTTPS 隧道
- 後端和前端分別在不同端口
- 資料庫使用 Neon Serverless PostgreSQL

### 生產環境（規劃中）

- 容器化部署（Docker）
- 反向代理（Nginx）
- SSL 憑證管理
- 環境變數管理
- 日誌集中管理
- 監控和告警

## 擴展性設計

### 多商店支援

- 已設計為支援多個商店
- 每個商店有獨立的 Token 和配置
- 前端的授權對話框可接受不同 Handle

### API 限制

- 需要實作速率限制
- Token 刷新機制
- 錯誤重試策略

### 效能優化

- 資料庫查詢優化
- API 回應快取
- 前端資源壓縮

## 技術決策

### 為什麼選擇 Fastify？

- 效能優異
- TypeScript 支援好
- 插件生態豐富

### 為什麼選擇 Next.js？

- React 框架成熟
- SSR/SSG 支援
- 良好的開發體驗

### 為什麼選擇 Neon？

- Serverless 設計
- PostgreSQL 完整支援
- 自動備份和擴展

## 參考資料

- [Shopline API 文件](https://developer.shopline.com)
- [Fastify 文件](https://www.fastify.io/)
- [Next.js 文件](https://nextjs.org/)
- [Prisma 文件](https://www.prisma.io/)

