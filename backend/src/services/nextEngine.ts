/**
 * Next Engine Platform Adapter
 * 
 * Story 5.1: 實作 Next Engine 平台的 OAuth 流程與 API 呼叫。
 * 
 * 參考文件：
 * - docs/reference/platform-apis/NEXTENGINE_API_REFERENCE.md
 * - docs/reference/design-specs/NEXT_ENGINE_PLATFORM_SPEC.md
 */

import { PlatformAdapter, PlatformError, TokenPayload, IdentityInfo } from '../types/platform'

interface NextEngineTokenResponse {
  access_token: string
  refresh_token: string
  access_token_end_date: string // 格式: "YYYY-MM-DD HH:mm:ss"
  refresh_token_end_date: string // 格式: "YYYY-MM-DD HH:mm:ss"
  code?: string // 錯誤碼（例如 "002002", "002003"）
  error_description?: string // 錯誤描述（日文）
}

interface NextEngineCompanyInfoResponse {
  result: string
  code?: string
  data?: {
    company_id: string
    company_name: string
    [key: string]: any
  }
  error_description?: string
}

export class NextEngineAdapter implements PlatformAdapter {
  private clientId: string
  private clientSecret: string
  private baseRedirectUri: string

  constructor() {
    this.clientId = process.env.NEXTENGINE_CLIENT_ID || ''
    this.clientSecret = process.env.NEXTENGINE_CLIENT_SECRET || ''
    this.baseRedirectUri = process.env.NEXTENGINE_REDIRECT_URI || ''

    if (!this.clientId || !this.clientSecret || !this.baseRedirectUri) {
      throw new Error('缺少必要的 Next Engine 環境變數: NEXTENGINE_CLIENT_ID, NEXTENGINE_CLIENT_SECRET, NEXTENGINE_REDIRECT_URI')
    }
  }

  /**
   * 取得授權 URL
   * 
   * Next Engine OAuth 流程：
   * GET https://base.next-engine.org/users/sign_in/?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}
   * 
   * 重要：Next Engine 會自己生成 state，我們無法自訂
   * 授權 URL 只接受 client_id 和 redirect_uri，不接受 state 參數
   * 我們不能對 Next Engine 丟 state
   */
  getAuthorizeUrl(state: string, additionalParams?: Record<string, any>): string {
    // Next Engine 只接受 client_id 和 redirect_uri，不加入任何額外參數
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.baseRedirectUri,
    })

    return `https://base.next-engine.org/users/sign_in/?${params.toString()}`
  }

  /**
   * 交換授權碼取得 Token
   * 
   * Next Engine Token 交換：
   * POST https://api.next-engine.org/api_neauth
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - client_id
   * - client_secret
   * - uid (從 callback 的 query 參數取得)
   * - state
   */
  async exchangeToken(
    code: string,
    state: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }> {
    try {
      // Next Engine 的 callback 會回傳 uid 而非 code
      // 根據 API 文件，token 交換使用 uid 參數
      const uid = code // Next Engine 使用 uid 作為授權碼

      // 檢查必要參數
      if (!this.clientId || !this.clientSecret) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Missing client_id or client_secret',
            raw: { clientId: !!this.clientId, clientSecret: !!this.clientSecret },
          },
        }
      }

      if (!uid || !state) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Missing uid or state',
            raw: { uid: !!uid, state: !!state },
          },
        }
      }

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        uid: uid,
        state: state,
      })

      const response = await fetch('https://api.next-engine.org/api_neauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: NextEngineTokenResponse = await response.json()

      // 檢查錯誤碼
      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data.error_description || '', data),
        }
      }

      // 解析 expiresAt
      const expiresAt = this.parseDateTime(data.access_token_end_date)
      const refreshExpiresAt = this.parseDateTime(data.refresh_token_end_date)

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: expiresAt.toISOString(),
          refreshExpiresAt: refreshExpiresAt.toISOString(),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Token exchange failed',
          raw: error,
        },
      }
    }
  }

  /**
   * 刷新 Access Token
   * 
   * Next Engine Refresh Token：
   * POST https://api.next-engine.org/api_neauth
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - client_id
   * - client_secret
   * - uid (需要從 Connection 的 metadata 或 authPayload 取得)
   * - state (需要從 Connection 的 metadata 或 authPayload 取得)
   * - refresh_token
   */
  async refreshToken(
    refreshToken: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }> {
    try {
      // Next Engine refresh 需要 uid 和 state，這些應該存在 Connection 的 metadata 中
      const uid = additionalParams?.uid
      const state = additionalParams?.state

      if (!uid || !state) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Missing uid or state for token refresh',
          },
        }
      }

      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        uid: uid,
        state: state,
        refresh_token: refreshToken,
      })

      const response = await fetch('https://api.next-engine.org/api_neauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: NextEngineTokenResponse = await response.json()

      // 完整記錄原始 response（開發階段，方便追查）
      console.log('[NextEngineAdapter] Token refresh response:', JSON.stringify(data, null, 2))

      // 檢查錯誤碼
      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data.error_description || '', data),
        }
      }

      // 解析 expiresAt
      // 注意：如果 Next Engine 回傳的日期時間格式不完整，我們需要根據 token 更新時間計算
      const expiresAt = this.parseDateTime(data.access_token_end_date)
      const refreshExpiresAt = this.parseDateTime(data.refresh_token_end_date)

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: expiresAt.toISOString(),
          refreshExpiresAt: refreshExpiresAt.toISOString(),
          // 保留原始 response 以便追查（開發階段）
          rawResponse: {
            access_token_end_date: data.access_token_end_date,
            refresh_token_end_date: data.refresh_token_end_date,
            fullResponse: data,
          },
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Token refresh failed',
          raw: error,
        },
      }
    }
  }

  /**
   * 取得公司資訊（用於 Connection displayName）
   * 
   * Next Engine Company Info：
   * POST https://api.next-engine.org/api_v1_system_company/info
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - access_token
   * - fields=company_id,company_name
   */
  async getIdentity(
    accessToken: string
  ): Promise<{ success: true; data: IdentityInfo } | { success: false; error: PlatformError }> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'company_id,company_name',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_system_company/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: NextEngineCompanyInfoResponse = await response.json()

      // 檢查錯誤碼
      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data.error_description || '', data),
        }
      }

      if (!data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Company info not found',
            raw: data,
          },
        }
      }

      return {
        success: true,
        data: {
          id: data.data.company_id,
          name: data.data.company_name,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Get identity failed',
          raw: error,
        },
      }
    }
  }

  /**
   * 映射 Next Engine 錯誤碼
   * 
   * 錯誤碼對照：
   * - 001001: POSTパラメータにuidが指定されていません → PLATFORM_ERROR
   * - 001003: 可能是 client_secret 未指定 → PLATFORM_ERROR
   * - 002001: POSTパラメータにaccess_tokenが指定されていません → PLATFORM_ERROR
   * - 002002: Token 過期 → TOKEN_EXPIRED
   * - 002003: Refresh 失敗 → TOKEN_REFRESH_FAILED
   * - 其他: PLATFORM_UNKNOWN
   */
  private mapErrorCode(code: string, description: string, raw: any): PlatformError {
    switch (code) {
      case '001001':
        return {
          type: 'PLATFORM_ERROR',
          message: 'Missing uid parameter',
          raw: { code, description, ...raw },
        }
      case '001003':
        return {
          type: 'PLATFORM_ERROR',
          message: 'Missing client_secret or invalid parameter',
          raw: { code, description, ...raw },
        }
      case '002001':
        return {
          type: 'PLATFORM_ERROR',
          message: 'Missing access_token parameter',
          raw: { code, description, ...raw },
        }
      case '002002':
        return {
          type: 'TOKEN_EXPIRED',
          message: 'Token expired',
          raw: { code, description, ...raw },
        }
      case '002003':
        return {
          type: 'TOKEN_REFRESH_FAILED',
          message: 'Token refresh failed',
          raw: { code, description, ...raw },
        }
      default:
        return {
          type: 'PLATFORM_UNKNOWN',
          message: description || `Unknown error code: ${code}`,
          raw: { code, description, ...raw },
        }
    }
  }

  /**
   * 取得店舖列表
   * 
   * Next Engine Shop List：
   * POST https://api.next-engine.org/api_v1_master_shop/search
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - access_token
   * - fields=shop_id,shop_name,shop_abbreviated_name,shop_note
   */
  async getShops(accessToken: string): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'shop_id,shop_name,shop_abbreviated_name,shop_note',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_master_shop/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: any = await response.json()

      // 檢查錯誤碼
      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data.error_description || '', data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get shops',
            raw: data,
          },
        }
      }

      return {
        success: true,
        data: Array.isArray(data.data) ? data.data : [],
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Get shops failed',
          raw: error,
        },
      }
    }
  }

  /**
   * 取得訂單摘要
   * 
   * Next Engine Order Summary：
   * POST https://api.next-engine.org/api_v1_receiveorder_base/search
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - access_token
   * - fields=receive_order_id,receive_order_date
   * - limit=1 (只取得總數)
   */
  async getOrderSummary(accessToken: string): Promise<{ success: true; data: { total: number; lastUpdated?: string } } | { success: false; error: PlatformError }> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'receive_order_id,receive_order_date',
        limit: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_receiveorder_base/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: any = await response.json()

      // 檢查錯誤碼
      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data.error_description || '', data),
        }
      }

      if (data.result !== 'success') {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get order summary',
            raw: data,
          },
        }
      }

      const total = parseInt(data.count || '0', 10)
      const lastUpdated = data.data && data.data.length > 0 ? data.data[0].receive_order_date : undefined

      return {
        success: true,
        data: {
          total,
          lastUpdated,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Get order summary failed',
          raw: error,
        },
      }
    }
  }

  /**
   * 解析 Next Engine 日期時間字串
   * 格式: "YYYY-MM-DD HH:mm:ss"
   */
  private parseDateTime(dateTimeString: string | undefined | null): Date {
    // 如果沒有日期時間，返回當前時間
    if (!dateTimeString) {
      return new Date()
    }
    
    // Next Engine 使用 "YYYY-MM-DD HH:mm:ss" 格式
    // 轉換為 ISO 8601 格式
    const [datePart, timePart] = dateTimeString.split(' ')
    
    // 如果格式不正確，返回當前時間
    if (!datePart || !timePart) {
      return new Date()
    }
    
    const [year, month, day] = datePart.split('-')
    const [hour, minute, second] = timePart.split(':')
    
    // 如果日期或時間部分不完整，返回當前時間
    if (!year || !month || !day || !hour || !minute || !second) {
      return new Date()
    }
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1, // JavaScript month is 0-indexed
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    )
  }
}

