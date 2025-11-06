# Reference 目錄說明

> 參考資料，需要時查閱，不常更新

---

## 📁 目錄結構

```
reference/
├── platform-apis/      # 平台 API 文檔
├── design-specs/       # UI/UX 設計規格
└── guides/             # 操作指南
```

---

## 📋 目錄說明

### `platform-apis/`
系統邊界外的關鍵資訊：API 文檔、endpoint、sample code、token 等。

**包含**：
- `shopline-api-docs.md` - Shopline API 官方文件重點
- `SHOPLINE_WEBHOOK_TOPICS.md` - Webhook Topics 列表

**使用時機**：
- Story 建立階段：搜集 API 資訊
- 開發時：參考 API 規格和 sample code

---

### `design-specs/`
UI/UX 設計規格，前端開發的設計參考。

**包含**：
- `WEBHOOK_TEST_UI_DESIGN.md` - Webhook 測試介面設計
- `ADMIN_API_TEST_UI_DESIGN.md` - Admin API 測試介面設計

**使用時機**：
- 前端開發時：參考設計規格
- UI/UX 討論時：查看設計文檔

---

### `guides/`
操作指南，開發和測試的實用指南。

**包含**：
- `PRODUCTION_ENVIRONMENT.md` - 正式環境資訊（正式站 URL、測試商店資訊）⭐
- `testing-guide.md` - Shopline OAuth 實測資訊與測試流程
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `ENV_SETUP_GUIDE.md` - 環境設定指南
- `DEVELOPMENT_CONFIG.md` - 開發環境配置
- `WEBHOOK_GUIDE.md` - Webhook 使用指南
- `APP_BRIDGE.md` - App Bridge 開發指南
- `SCRIPTS.md` - 工具腳本說明

**使用時機**：
- **正式環境資訊**：查詢正式站 URL、測試商店資訊、Shopline API 憑證
- 測試時：參考測試指南
- 部署時：參考部署指南
- 設定環境時：參考環境設定指南

---

**最後更新**: 2025-11-05

