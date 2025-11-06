# Epic 3: Admin 管理系統（Phase 1.1）

**狀態**: ⏳ planned  
**對應 Roadmap**: Phase 1.1  
**開始日期**: -

---

## Epic 描述

建立多租戶基礎架構，實作 Admin 管理系統。支援使用者登入、權限管理、資料隔離等功能。

**前置條件**：
- ✅ Refactor 1: 狀態管理階段 1 基礎架構完成（Phase 1 準備）

---

## Stories

### ⏳ Story 3.1: 使用者認證系統
- **狀態**: planned
- **描述**: 實作使用者登入、註冊、登出功能
- **技術需求**:
  - JWT/Session 認證機制
  - 密碼加密與驗證
  - 登入狀態管理
  - **後端 Session 管理（使用 Redis）**：實作基礎的使用者 Session 儲存與驗證
- **Session 儲存方式說明**:
  - ✅ **使用 Redis**（本 Story 的實作方式）
    - 原因：Refactor 1 已經整合好 Redis 基礎設施（`backend/src/utils/redis.ts`）
    - 優勢：高效能、支援 TTL 自動過期、為未來多裝置同步做準備（Phase 2）
    - 實作：直接使用 `getRedisClient()` 函數，參考現有的 Token 快取實作方式
    - Key 格式：`session:${sessionId}` 或 `session:user:${userId}`
  - ❌ **不使用記憶體 Session**：因為多伺服器部署時會失效
  - ❌ **不使用資料庫 Session**：效能較差，且 Redis 已經整合完成
- **註**：此為基礎 Session 管理，用於單一使用者登入狀態。多裝置 Session 同步屬於 Refactor 1 Story R1.2（Phase 2 使用）

### ⏳ Story 3.2: 基礎權限驗證機制
- **狀態**: planned
- **描述**: 實作最基礎的權限驗證機制，區分「未登入」和「登入後」的存取權限
- **範圍說明**: 
  - ✅ **包含**: 未登入使用者無法訪問系統、登入後可訪問自己的資料
  - ❌ **不包含**: 複雜的角色管理（Admin、User 等）、細粒度權限控制（這些屬於未來 Story）
- **技術需求**:
  - 路由保護（未登入重導向登入頁）
  - API 端點保護（驗證登入狀態）
  - 權限驗證中間件
  - 前端登入狀態檢查

### ⏳ Story 3.3: 多租戶資料隔離
- **狀態**: planned
- **描述**: 實作多租戶資料庫設計，確保不同 Admin 的資料隔離
- **檔案**: [Story 3.3: 多租戶資料隔離](../stories/story-3-3-multi-tenant-data-isolation.md)
- **技術需求**:
  - 多租戶資料庫設計
  - 資料隔離機制
  - 查詢過濾器

### ⏳ Story 3.4: Admin 管理介面
- **狀態**: planned
- **描述**: 實作 Admin 管理的前端介面
- **檔案**: [Story 3.4: Admin 管理介面](../stories/story-3-4-admin-management-interface.md)
- **技術需求**:
  - 登入/註冊頁面
  - 登入狀態展示（使用者資訊、登出按鈕等）
  - 路由保護與重導向邏輯
  - 註：複雜的使用者管理介面、權限管理介面屬於未來 Story

### ⏳ Story 3.5: OAuth 授權流程與會員登入系統銜接
- **狀態**: in_progress
- **描述**: 實作 OAuth 授權流程與會員登入系統的銜接，確保使用者在完成商店授權後，能夠保持登入狀態，並且授權的商店正確關聯到當前使用者
- **檔案**: [Story 3.5: OAuth 授權流程與會員登入系統銜接](../stories/story-3-5-oauth-auth-integration.md)
- **技術需求**:
  - OAuth 回調時的使用者認證狀態保持
  - OAuth 回調後重導向到前端時，確保使用者認證狀態
  - 前端在 OAuth 回調後，檢查並恢復使用者認證狀態
  - 授權的商店正確關聯到當前使用者

---

## 範圍說明

### 本 Epic 的權限管理範圍
- **最基礎的權限驗證**：區分「未登入」和「登入後」的存取權限
- **資料隔離**：確保不同 Admin 只能看到自己的資料
- **不包含複雜角色管理**：如 Admin、User、Editor 等角色區別，屬於未來需求

### 未來擴展
- 複雜角色管理（Admin、User、Editor 等）
- 細粒度權限控制（功能級別、資料級別權限）
- 權限管理 UI（指派角色、管理權限等）

---

## 與 Refactor 1 Session 管理的關係

### Story 3.1 與 Refactor 1 Story R1.2 的 Session 管理

**相同點**：
- 都使用 Redis 儲存 Session
- 都使用 Session 來管理狀態

**不同點**：
- **Story 3.1（Epic 3）**：基礎的使用者 Session，用於**使用者登入認證**
  - 範圍：單一使用者的登入狀態（誰登入了）
  - 用途：權限驗證（未登入/已登入）
  - 實作：Session 儲存使用者 ID、登入時間、過期時間等
  
- **Story R1.2（Refactor 1）**：進階的多裝置 Session，用於**多裝置狀態同步**
  - 範圍：同一使用者在多個裝置的狀態同步
  - 用途：跨裝置狀態一致性（商店選擇、平台選擇等）
  - 實作：在基礎 Session 上擴展，加入裝置識別、狀態同步邏輯

**實作建議**：
- ✅ **Story 3.1 需要實作基礎 Session 管理**（這是必要的前置基礎）
- ✅ **使用 Redis 做 Session 儲存**（Refactor 1 已經整合好 Redis，直接使用即可）
  - 實作時直接使用 `getRedisClient()`（已在 `backend/src/utils/redis.ts`）
  - 參考現有的 Token 快取實作方式（`backend/src/services/shopline.ts` 的 `getStoreByHandle` 方法）
  - Session 儲存格式：`session:${sessionId}`，內容包含 `userId`、`loginTime`、`expiresAt` 等
- ✅ **可以共用 Redis 基礎設施**（不需要重新整合）
- ✅ **基礎 Session 架構可以在 Story 3.1 中建立**，為 Story R1.2 的擴展做準備
- ⚠️ **多裝置同步邏輯留到 Story R1.2 再實作**（Phase 2 需求）

---

## 相關決策

- 見 `docs/memory/roadmap.md` - Phase 1.1
- 需要 Refactor 1 的狀態管理基礎架構（Redis 已整合）
- Session 管理：基礎實作在 Epic 3，多裝置擴展在 Refactor 1 Story R1.2

## 相關 Review 報告

- **Story Review 報告**：見 `docs/archive/discussions/review-story-3-1-to-3-4.md` - Story 3.1-3.4 銜接點與架構一致性檢查
- **TPM 技術檢視報告**：見 `docs/archive/discussions/tpm-review-story-3-1-to-3-4.md` - Story 3.1-3.4 完整技術內容檢視

**Review 狀態**：✅ 已完成，所有問題已修正，Story 準備就緒，可以安排到開發 run

---

**最後更新**: 2025-11-06

