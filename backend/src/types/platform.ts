/**
 * Platform Adapter 介面定義
 * 
 * Story 5.1: 定義統一的 Platform Adapter 介面，讓所有平台（Shopline、Next Engine 等）
 * 都實作相同的介面，透過 PlatformServiceFactory 統一管理。
 */

export type Platform = 'shopline' | 'next-engine'

export interface PlatformError {
  type: 'TOKEN_EXPIRED' | 'TOKEN_REFRESH_FAILED' | 'TOKEN_REVOKED' | 'PLATFORM_ERROR' | 'PLATFORM_UNKNOWN'
  message: string
  raw?: any // 原始錯誤回應，供除錯使用
}

export interface TokenPayload {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date | string
  refreshExpiresAt?: Date | string
  scope?: string
  [key: string]: any // 允許平台特定的額外欄位
}

export interface IdentityInfo {
  id: string // 平台帳戶 ID（例如 Shopline handle、Next Engine companyId）
  name: string // 顯示名稱（例如 Shopline store name、Next Engine company name）
  [key: string]: any // 允許平台特定的額外欄位
}

/**
 * Platform Adapter 介面
 * 
 * 所有平台 Adapter 必須實作此介面，確保統一的行為與錯誤處理。
 */
export interface PlatformAdapter {
  /**
   * 取得授權 URL
   * @param state OAuth state 參數（包含 userId 與 nonce）
   * @param additionalParams 平台特定的額外參數（例如 Shopline 的 handle）
   * @returns 授權 URL
   */
  getAuthorizeUrl(state: string, additionalParams?: Record<string, any>): string

  /**
   * 交換授權碼取得 Token
   * @param code 授權碼
   * @param state OAuth state 參數
   * @param additionalParams 平台特定的額外參數
   * @returns Token payload 或錯誤
   */
  exchangeToken(
    code: string,
    state: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }>

  /**
   * 刷新 Access Token
   * @param refreshToken Refresh token
   * @param additionalParams 平台特定的額外參數
   * @returns 新的 Token payload 或錯誤
   */
  refreshToken(
    refreshToken: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }>

  /**
   * 取得平台帳戶資訊（用於 Connection displayName）
   * @param accessToken Access token
   * @returns 帳戶資訊或錯誤
   */
  getIdentity(
    accessToken: string
  ): Promise<{ success: true; data: IdentityInfo } | { success: false; error: PlatformError }>
}

