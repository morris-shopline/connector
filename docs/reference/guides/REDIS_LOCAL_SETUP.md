# Redis 地端測試設定指南

> 本指南說明如何設定 Render Redis，讓地端測試環境也能使用 Redis 快取功能

---

## 📋 概述

Render 的 Redis 服務預設只允許內部（Render 服務）存取，但可以透過設定 **IP 白名單**來允許外部（地端）存取。

### 兩種連線方式

1. **Internal URL**（內部連線）
   - 格式：`redis://red-{id}:6379`
   - 只能從 Render 服務內部使用
   - 不需要密碼

2. **External URL**（外部連線）
   - 需要設定 IP 白名單
   - 可以從地端連線
   - 格式可能包含密碼（視設定而定）

---

## 🚀 設定步驟

### 步驟 1: 取得地端公網 IP

**方法 1：使用命令列**
```bash
curl https://api.ipify.org
```

**方法 2：使用瀏覽器**
- 開啟 https://www.whatismyip.com/
- 記錄您的 **IPv4 位址**

**方法 3：使用 Google**
- 搜尋「what is my ip」
- Google 會顯示您的 IP 位址

**重要**：
- 如果使用浮動 IP（大多數家用網路），IP 可能會變動
- 如果 IP 變動，需要重新設定白名單
- 建議使用固定 IP 或 VPN（如果有）

---

### 步驟 2: 在 Render 設定 IP 白名單

1. **前往 Render Dashboard**
   - 開啟 [Render Dashboard](https://dashboard.render.com/)
   - 進入 `shopline-middleware-redis` 服務（或您的 Redis 服務）

2. **進入 Networking 設定**
   - 點擊左側選單的 **「Info」** 頁面
   - 找到 **「Networking」** 區塊
   - 找到 **「Valkey Inbound IP Rules」** 區塊

3. **新增 IP 規則**
   - 點擊 **「+ Add source」** 按鈕
   - 在 **「SOURCE」** 欄位輸入您的 IP 位址
     - 格式：`1.2.3.4`（單一 IP）
     - 或使用 CIDR：`1.2.3.4/32`（單一 IP）
     - 或使用範圍：`1.2.3.0/24`（IP 範圍）
   - 在 **「DESCRIPTION」** 欄位輸入描述（例如：`Local Development`）
   - 點擊 **「Save」** 或 **「Add」**

4. **確認設定**
   - 應該會看到警告訊息消失
   - 應該會看到您新增的 IP 規則出現在列表中

---

### 步驟 3: 取得 External Redis URL

1. **在 Render Dashboard 找到 External URL**
   - 在 Redis 服務的 **「Info」** 頁面
   - 找到 **「External Key Value URL」** 或 **「Valkey CLI Command」** 區塊
   - 複製完整的 URL

2. **確認 URL 格式**
   - **TLS 連線格式**（推薦）：`rediss://red-{id}:{password}@singapore-keyvalue.render.com:6379`
     - 注意：`rediss://`（有 s，表示 TLS）不是 `redis://`
     - 包含用戶名、密碼和主機名稱
   - **範例**：`rediss://red-d406i56uk2gs739qn8ig:IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC@singapore-keyvalue.render.com:6379`

3. **實際 External URL**（已設定）
   ```
   rediss://red-d406i56uk2gs739qn8ig:IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC@singapore-keyvalue.render.com:6379
   ```

---

### 步驟 4: 設定地端環境變數

**在 `backend/.env` 檔案中設定**：

```bash
# 使用 External URL（已設定，包含 TLS 和密碼）
REDIS_URL=rediss://red-d406i56uk2gs739qn8ig:IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC@singapore-keyvalue.render.com:6379
```

**或使用分離的環境變數**（如果 URL 格式有問題）：

```bash
REDIS_HOST=singapore-keyvalue.render.com
REDIS_PORT=6379
REDIS_PASSWORD=IP5kBAk3UUJ3beY2JHeEwxskeYFWbLuC
# 注意：需要設定 TLS，但我們的 redis.ts 實作可能不支援分離設定的 TLS
# 建議直接使用 REDIS_URL
```

---

### 步驟 5: 測試連線

1. **重啟後端服務**
   ```bash
   # 停止現有服務（Ctrl+C）
   # 重新啟動
   cd backend && npm run dev
   ```

2. **檢查日誌**
   - 應該會看到：`Redis Client Connected`
   - 應該會看到：`Redis Client Ready`
   - 如果看到錯誤，檢查 IP 白名單設定

3. **測試快取功能**
   - 執行 API 操作（例如：Get Store Info）
   - 第一次應該從資料庫讀取
   - 第二次應該從 Redis 讀取（觀察回應時間）

---

## ⚠️ 注意事項

### 1. IP 變動問題

**問題**：如果使用浮動 IP，IP 位址可能會變動

**解決方案**：
- 使用固定 IP（詢問 ISP）
- 使用 VPN 服務（固定 IP）
- 每次 IP 變動時重新設定白名單
- 使用 IP 範圍（例如：`1.2.3.0/24`）但注意安全性

### 2. 安全性考量

**風險**：
- 將 Redis 暴露給外部網路增加安全風險
- 如果 IP 白名單設定錯誤，可能被未授權存取

**建議**：
- 僅用於開發測試環境
- 正式環境建議只使用 Internal URL
- 定期檢查 IP 白名單規則
- 使用強密碼（如果 Redis 支援密碼）

### 3. 效能考量

**網路延遲**：
- 地端連線到雲端 Redis 會有網路延遲
- 本地 Redis 效能更好（但需要額外設定）

**建議**：
- 開發測試：可以使用 Render Redis（透過 IP 白名單）
- 正式環境：使用 Internal URL（效能最佳）
- 本地開發：也可以安裝本地 Redis（可選）

---

## 🔍 故障排除

### Q1: 連線失敗（Connection refused）

**可能原因**：
- IP 白名單未設定
- IP 位址錯誤
- Redis 服務未啟動

**解決方案**：
1. 確認 IP 白名單已正確設定
2. 確認 IP 位址是否正確（使用 `curl https://api.ipify.org` 檢查）
3. 確認 Redis 服務在 Render 上已啟動

### Q2: 連線超時（Connection timeout）

**可能原因**：
- 防火牆阻擋
- 網路問題
- External URL 設定錯誤

**解決方案**：
1. 檢查本地防火牆設定
2. 確認 External URL 是否正確
3. 嘗試使用 `redis-cli` 測試連線

### Q3: 認證失敗（Authentication failed）

**可能原因**：
- 密碼設定錯誤
- URL 格式錯誤

**解決方案**：
1. 確認 REDIS_URL 格式是否正確
2. 確認是否需要密碼（查看 Render Dashboard）
3. 嘗試使用分離的環境變數（REDIS_HOST, REDIS_PORT, REDIS_PASSWORD）

---

## 📚 相關文件

- **環境變數設定**：見 `docs/reference/guides/ENV_SETUP_GUIDE.md`
- **正式環境資訊**：見 `docs/reference/guides/PRODUCTION_ENVIRONMENT.md`
- **Redis 實作**：見 `backend/src/utils/redis.ts`

---

**最後更新**: 2025-11-06

