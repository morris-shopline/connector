# 開發環境配置

> 開發環境的配置資訊與測試設定

---

## 🔑 當前測試配置

```
App Key: 4c951e966557c8374d9a61753dfe3c52441aba3b
App Secret: dd46269d6920f49b07e810862d3093062b0fb858
商店 Handle: paykepoc
資料庫: Neon PostgreSQL
```

**重要說明**：
- ✅ **Shopline API 憑證**：這是公開給外部使用的 App，憑證會公開屬於正常情況
- ✅ **測試商店資訊**：測試階段可以從資料庫查詢取得（見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`）
- ✅ **正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`

---

## 🌐 服務端點

- **後端**: http://localhost:3001
- **前端**: http://localhost:3000
- **ngrok 管理介面**: http://localhost:4040

---

## 🔒 安全機制

- **HMAC-SHA256 簽名驗證** - 所有 API 請求都需要簽名驗證
- **時間戳檢查** - 5分鐘容差，防止重放攻擊
- **防時序攻擊** - 使用 `crypto.timingSafeEqual()`
- **HTTPS 支援** - 透過 ngrok 提供 HTTPS
- **JWT Token** - Token 資訊以 JWT 形式安全儲存

**詳細安全實作**：見 `docs/memory/architecture/current.md`

---

## 🔗 相關文件

- **環境設定**：`docs/reference/guides/ENV_SETUP_GUIDE.md`
- **正式環境資訊**：`docs/reference/guides/PRODUCTION_ENVIRONMENT.md` ⭐（正式站 URL、測試商店資訊）
- **系統架構**：`docs/memory/architecture/current.md`
- **部署指南**：`docs/reference/guides/DEPLOYMENT_GUIDE.md`

---

**最後更新**: 2025-11-05

