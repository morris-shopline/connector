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
  private warehouseCache: Map<string, string>
  private warehouseCacheFetchedAt: number | null
  private cachedWarehouses: any[]
  private readonly warehouseCacheTtl = 5 * 60 * 1000 // 5 分鐘快取
  private readonly defaultWarehouseId = 'default'
  private readonly defaultWarehouseName = '基本拠点'
  private readonly defaultWarehouseRemoteId = '0'

  constructor() {
    this.clientId = process.env.NEXTENGINE_CLIENT_ID || ''
    this.clientSecret = process.env.NEXTENGINE_CLIENT_SECRET || ''
    this.baseRedirectUri = process.env.NEXTENGINE_REDIRECT_URI || ''
    this.warehouseCache = new Map()
    this.cachedWarehouses = []
    this.warehouseCacheFetchedAt = null

    if (!this.clientId || !this.clientSecret || !this.baseRedirectUri) {
      throw new Error('缺少必要的 Next Engine 環境變數: NEXTENGINE_CLIENT_ID, NEXTENGINE_CLIENT_SECRET, NEXTENGINE_REDIRECT_URI')
    }
  }

  private resolveWarehouseId(warehouseId?: string): string {
    const trimmed = warehouseId?.trim()
    if (!trimmed) {
      return this.defaultWarehouseId
    }
    if (trimmed === this.defaultWarehouseRemoteId) {
      return this.defaultWarehouseId
    }
    return trimmed
  }

  private resolveWarehouseRemoteId(warehouseId?: string): string {
    const resolvedId = this.resolveWarehouseId(warehouseId)
    if (resolvedId === this.defaultWarehouseId) {
      return this.defaultWarehouseRemoteId
    }
    return resolvedId
  }

  private async resolveWarehouseReference(
    accessToken: string,
    warehouseId?: string,
    warehouseNameOverride?: string
  ): Promise<{ id: string; remoteId: string; name: string }> {
    const resolvedId = this.resolveWarehouseId(warehouseId)
    const remoteId = this.resolveWarehouseRemoteId(resolvedId)

    if (resolvedId === this.defaultWarehouseId) {
      return {
        id: resolvedId,
        remoteId,
        name: this.defaultWarehouseName,
      }
    }

    if (warehouseNameOverride) {
      this.warehouseCache.set(resolvedId, warehouseNameOverride)
      this.warehouseCacheFetchedAt = Date.now()
      return { id: resolvedId, remoteId, name: warehouseNameOverride }
    }

    if (!this.isWarehouseCacheFresh() || !this.warehouseCache.has(resolvedId)) {
      const warehousesResult = await this.fetchWarehousesFromApi(accessToken)
      if (!warehousesResult.success) {
        throw warehousesResult.error
      }
    }

    const cachedName = this.warehouseCache.get(resolvedId)
    if (!cachedName) {
      const error: PlatformError = {
        type: 'PLATFORM_ERROR',
        message: `Warehouse ${resolvedId} not found`,
        raw: { warehouseId: resolvedId },
      }
      throw error
    }

    return { id: resolvedId, remoteId, name: cachedName }
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
          error: this.mapErrorCode(data.code, data),
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
          error: this.mapErrorCode(data.code, data),
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
          error: this.mapErrorCode(data.code, data),
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
   * 從 Next Engine API 回應中提取錯誤訊息
   * 
   * Next Engine API 錯誤回應可能包含以下欄位：
   * - error_description: 錯誤描述（日文）
   * - error_message: 錯誤訊息
   * - message: 訊息
   * - error: 錯誤
   * - result: 結果狀態
   * 
   * 此函數會依序嘗試這些欄位，返回第一個非空值。
   */
  private extractErrorMessage(response: any): string {
    // 依優先順序嘗試提取錯誤訊息
    return response.error_description || 
           response.error_message || 
           response.message || 
           response.error || 
           ''
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
   * - 004001: 佇列相關錯誤（常見：佇列不存在）
   * - 004002: 佇列相關錯誤（常見：佇列 ID 無效或佇列不存在）
   * - 其他: PLATFORM_UNKNOWN（會顯示原始錯誤描述）
   */
  private mapErrorCode(code: string, response: any): PlatformError {
    const description = this.extractErrorMessage(response)
    // 優先使用 Next Engine 提供的錯誤描述
    const errorMessage = description || `Unknown error code: ${code}`
    
    switch (code) {
      case '001001':
        return {
          type: 'PLATFORM_ERROR',
          message: description || 'Missing uid parameter',
          raw: { code, description, fullResponse: response },
        }
      case '001003':
        return {
          type: 'PLATFORM_ERROR',
          message: description || 'Missing client_secret or invalid parameter',
          raw: { code, description, fullResponse: response },
        }
      case '002001':
        return {
          type: 'PLATFORM_ERROR',
          message: description || 'Missing access_token parameter',
          raw: { code, description, fullResponse: response },
        }
      case '002002':
        return {
          type: 'TOKEN_EXPIRED',
          message: description || 'Token expired',
          raw: { code, description, fullResponse: response },
        }
      case '002003':
        return {
          type: 'TOKEN_REFRESH_FAILED',
          message: description || 'Token refresh failed',
          raw: { code, description, fullResponse: response },
        }
      case '004001':
      case '004002':
        // 佇列相關錯誤（佇列不存在、佇列 ID 無效等）
        return {
          type: 'PLATFORM_ERROR',
          message: description || (code === '004001' 
            ? '佇列不存在或無法查詢' 
            : '佇列 ID 無效或佇列不存在'),
          raw: { code, description, fullResponse: response },
        }
      default:
        // 對於未知錯誤碼，優先顯示 Next Engine 提供的錯誤描述
        return {
          type: 'PLATFORM_UNKNOWN',
          message: description || `Unknown error code: ${code}`,
          raw: { code, description, fullResponse: response },
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
          error: this.mapErrorCode(data.code, data),
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
          error: this.mapErrorCode(data.code, data),
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
   * Story 5.5: 建立商品（支援動態產生測試資料）
   * 
   * Next Engine Create Product：
   * POST https://api.next-engine.org/api_v1_master_goods/upload
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 參數：
   * - access_token
   * - data_type=csv
   * - data={CSV_DATA}
   * - wait_flag=1
   */
  async createProduct(
    accessToken: string,
    options?: {
      productCode?: string
      productName?: string
      price?: number
      cost?: number
      csvData?: string
    }
  ): Promise<{ success: true; data: any } | { success: false; error: PlatformError }> {
    try {
      let csvData: string

      // 如果提供了完整 CSV，直接使用
      if (options?.csvData) {
        csvData = options.csvData
      } else {
        // 動態產生測試資料
        const timestamp = Date.now()
        const productCode = options?.productCode || `TEST_${timestamp}`
        const productName = options?.productName || `Test Product ${timestamp}`
        const cost = options?.cost || 1000
        const price = options?.price || 1500

        // 建立 CSV（只包含必填欄位）
        csvData = `syohin_code,sire_code,syohin_name,genka_tnk,baika_tnk,daihyo_syohin_code
${productCode},9999,${productName},${cost},${price},${productCode}`
      }

      const params = new URLSearchParams({
        access_token: accessToken,
        data_type: 'csv',
        data: csvData,
        wait_flag: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_master_goods/upload', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success') {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to create product',
            raw: data,
          },
        }
      }

      return {
        success: true,
        data: data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Create product failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.5: 查詢主倉庫存
   * 
   * Next Engine Master Stock：
   * POST https://api.next-engine.org/api_v1_master_stock/search
   * Content-Type: application/x-www-form-urlencoded
   */
  async getMasterStock(
    accessToken: string,
    productCode?: string
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const fields = 'stock_goods_id,stock_quantity,stock_allocation_quantity,stock_defective_quantity,stock_remaining_order_quantity,stock_out_quantity,stock_free_quantity,stock_advance_order_quantity,stock_advance_order_allocation_quantity,stock_advance_order_free_quantity,stock_deleted_flag,stock_creation_date,stock_last_modified_date'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        wait_flag: '1',
      })

      if (productCode) {
        params.append('stock_goods_id-eq', productCode)
      }

      const response = await fetch('https://api.next-engine.org/api_v1_master_stock/search', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get master stock',
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
          message: error.message || 'Get master stock failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.5: 查詢分倉庫存
   * 
   * Next Engine Warehouse Stock：
   * POST https://api.next-engine.org/api_v1_warehouse_stock/search
   * Content-Type: application/x-www-form-urlencoded
   */
  async getWarehouseStock(
    accessToken: string,
    productCode?: string,
    warehouseId?: string
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const fields = 'warehouse_stock_warehouse_id,warehouse_stock_goods_id,warehouse_stock_quantity,warehouse_stock_allocation_quantity,warehouse_stock_free_quantity'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        wait_flag: '1',
      })

      if (productCode) {
        params.append('warehouse_stock_goods_id-eq', productCode)
      }

      const targetWarehouseId = this.resolveWarehouseRemoteId(warehouseId)
      params.append('warehouse_stock_warehouse_id-eq', targetWarehouseId)

      const response = await fetch('https://api.next-engine.org/api_v1_warehouse_stock/search', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get warehouse stock',
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
          message: error.message || 'Get warehouse stock failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.5: 查詢倉庫列表
   * 
   * Next Engine Warehouse Base：
   * POST https://api.next-engine.org/api_v1_warehouse_base/search
   * Content-Type: application/x-www-form-urlencoded
   */
  async getWarehouses(
    accessToken: string
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    if (this.isWarehouseCacheFresh() && this.cachedWarehouses.length > 0) {
      return {
        success: true,
        data: this.cachedWarehouses,
      }
    }

    return this.fetchWarehousesFromApi(accessToken)
  }

  private isWarehouseCacheFresh(): boolean {
    if (this.warehouseCacheFetchedAt === null) {
      return false
    }
    return Date.now() - this.warehouseCacheFetchedAt < this.warehouseCacheTtl
  }

  private updateWarehouseCache(entries: any[]) {
    const now = Date.now()
    this.warehouseCache.clear()
    this.cachedWarehouses = Array.isArray(entries) ? entries : []

    for (const warehouse of this.cachedWarehouses) {
      const id =
        warehouse.warehouse_id ||
        warehouse.warehouseId ||
        warehouse.id ||
        warehouse.code
      if (!id) {
        continue
      }
      const name =
        warehouse.warehouse_name ||
        warehouse.warehouseName ||
        warehouse.name ||
        ''
      this.warehouseCache.set(String(id), String(name))
    }

    this.warehouseCacheFetchedAt = now
  }

  private async fetchWarehousesFromApi(
    accessToken: string
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: 'warehouse_id,warehouse_name',
        wait_flag: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_warehouse_base/search', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get warehouses',
            raw: data,
          },
        }
      }

      const list = Array.isArray(data.data) ? data.data : []
      this.updateWarehouseCache(list)

      return {
        success: true,
        data: list,
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Get warehouses failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.5: 更新分倉庫存
   * 
   * Next Engine Warehouse Stock Upload：
   * POST https://api.next-engine.org/api_v1_warehouse_stock/upload
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 流程：
   * 1. 先查詢分倉庫當前在庫數
   * 2. 計算與目標值的差異
   * 3. 判斷操作類型：增加或減少
   * 4. 動態建立 CSV，使用對應的欄位：加算数量 或 減算数量
   * 5. 上傳 CSV
   */
  async updateWarehouseStock(
    accessToken: string,
    updates: {
      productCode: string
      newStock: number
      warehouseId?: string
      warehouseName?: string
    }
  ): Promise<{ success: true; data: any } | { success: false; error: PlatformError }> {
    try {
      const warehouseReference = await this.resolveWarehouseReference(
        accessToken,
        updates.warehouseId,
        updates.warehouseName
      )
      const { remoteId: queryWarehouseId, name: warehouseName } = warehouseReference

      // 1. 先查詢分倉庫當前在庫數
      const currentStockResult = await this.getWarehouseStock(
        accessToken,
        updates.productCode,
        queryWarehouseId
      )

      if (!currentStockResult.success) {
        return currentStockResult
      }

      // 找到對應倉庫的庫存資料
      const currentStockData = currentStockResult.data.find(
        (item: any) =>
          item.warehouse_stock_warehouse_id === queryWarehouseId ||
          item.warehouse_stock_warehouse_id === warehouseReference.id ||
          item.warehouse_stock_warehouse_name === warehouseName
      )

      const currentStock = currentStockData
        ? parseInt(currentStockData.warehouse_stock_free_quantity || '0', 10)
        : 0

      // 2. 計算差異
      const diff = updates.newStock - currentStock

      if (diff === 0) {
        return {
          success: true,
          data: {
            message: '庫存無需更新',
            currentStock,
            newStock: updates.newStock,
          },
        }
      }

      // 3. 判斷操作類型並建立 CSV
      // Next Engine API 官方 CSV 格式（拠点在庫マスタアップロード）
      // 欄位：kyoten_mei, syohin_code, kasan_su, gensan_su, kyoten_syohin_sakujyo, nyusyukko_riyu
      // 規則：「加算数量」「減算数量」「拠点商品削除」いずれかの入力が必須
      let csvData: string
      if (diff > 0) {
        // 增加庫存：使用 kasan_su（加算数量），必須是 1 以上的整數
        csvData = `kyoten_mei,syohin_code,kasan_su,gensan_su,kyoten_syohin_sakujyo,nyusyukko_riyu
${warehouseName},${updates.productCode},${diff},,,在庫数調整のため`
      } else {
        // 減少庫存：使用 gensan_su（減算数量），必須是 1 以上的整數
        const absDiff = Math.abs(diff)

        // 檢查減算數量不能超過當前フリー在庫数
        if (absDiff > currentStock) {
          return {
            success: false,
            error: {
              type: 'PLATFORM_ERROR',
              message: `減算數量 (${absDiff}) 不能超過當前フリー在庫数 (${currentStock})`,
              raw: { currentStock, absDiff },
            },
          }
        }

        csvData = `kyoten_mei,syohin_code,kasan_su,gensan_su,kyoten_syohin_sakujyo,nyusyukko_riyu
${warehouseName},${updates.productCode},,${absDiff},,在庫数調整のため`
      }

      // 4. 上傳 CSV
      const params = new URLSearchParams({
        access_token: accessToken,
        data_type: 'csv',
        data: csvData,
        wait_flag: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_warehouse_stock/upload', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success') {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to update warehouse stock',
            raw: data,
          },
        }
      }

      return {
        success: true,
        data: {
          ...data,
          currentStock,
          newStock: updates.newStock,
          diff,
          warehouseId: warehouseReference.id,
          warehouseRemoteId: queryWarehouseId,
          warehouseName: warehouseName,
        },
      }
    } catch (error: any) {
      if (error && typeof error === 'object' && 'type' in error) {
        return {
          success: false,
          error: error as PlatformError,
        }
      }

      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Update warehouse stock failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.5: 查詢佇列處理狀態
   *
   * Next Engine System Queue：
   * POST https://api.next-engine.org/api_v1_system_que/search
   * Content-Type: application/x-www-form-urlencoded
   * 
   * 回傳結果判讀：
   * - result 為 success 且 data 陣列內 que_status_id 顯示 2（全て処理成功）才算完成
   * - 若是 0（処理待ち）/ 1（処理中）表示還在跑，需稍後重查
   * - -1（処理失敗）則需查看 que_message
   * 
   * 欄位說明（アップロードキュー）：
   * - que_id: アップロードキューID
   * - que_status_id: 2=全て処理成功、1=処理中、0=処理待ち、-1=処理失敗
   * - que_method_name: 機能名（直接顯示值）
   *   - SYOHIN_KIHON_CSV: 商品マスタCSVアップロード
   *   - MALL_SYOHIN_CSV_TO_MASTER: 商品情報一括登録
   * - que_upload_name: アップロード名（直接顯示值）
   *   - SYOHIN_KIHON_QUE: 商品マスタ予約アップロード
   *   - TENPO_SYOHIN: 商品情報一括登録（モール商品履歴表示用）
   *   - SYOHIN_KIHON: 商品情報一括登録（商品マスタ履歴表示用）
   *   - MALL_SYOHIN_CSV_TO_MASTER_SYOHIN_KIHON: 商品情報一括登録（商品マスタ取込用）
   *   - PAGE_SYOHIN: 商品情報一括登録（ページ管理履歴表示用）
   *   - NE_API: ネクストエンジンAPI
   * - que_file_name: ファイル名（直接顯示值）
   * - que_message: メッセージ（直接顯示值）
   *   - 処理中の場合：進捗状況
   *   - 処理失敗の場合：エラーになった理由
   * - que_creation_date: 作成日
   */
  async getQueueStatus(
    accessToken: string,
    queueId: string
  ): Promise<{ success: true; data: any } | { success: false; error: PlatformError }> {
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        wait_flag: '1',
        fields: 'que_id,que_status_id,que_method_name,que_upload_name,que_file_name,que_message,que_creation_date',
        'que_id-eq': queueId,
        limit: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_system_que/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data: any = await response.json()

      if (data.code && data.code !== '000000') {
        return {
          success: false,
          error: this.mapErrorCode(data.code, data),
        }
      }

      // 檢查 result 是否為 success 且 data 陣列存在
      if (data.result !== 'success' || !data.data || data.data.length === 0) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Queue status not found',
            raw: data,
          },
        }
      }

      const queueData = data.data[0]
      const queStatusId = queueData.que_status_id

      // 檢查 que_status_id 狀態
      // 2: 全て処理成功、1: 処理中、0: 処理待ち、-1: 処理失敗
      if (queStatusId === '2' || queStatusId === 2) {
        // 成功完成
        return {
          success: true,
          data: {
            que_id: queueData.que_id,
            que_status_id: queueData.que_status_id,
            que_method_name: queueData.que_method_name,
            que_upload_name: queueData.que_upload_name,
            que_file_name: queueData.que_file_name,
            que_message: queueData.que_message,
            que_creation_date: queueData.que_creation_date,
            status: 'done',
            completed: true,
          },
        }
      } else if (queStatusId === '-1' || queStatusId === -1) {
        // 佇列處理失敗狀態（API 呼叫成功，但佇列處理失敗）
        // que_message 是 Next Engine 返回的佇列處理失敗詳細訊息
        return {
          success: true,
          data: {
            que_id: queueData.que_id,
            que_status_id: queueData.que_status_id,
            que_method_name: queueData.que_method_name,
            que_upload_name: queueData.que_upload_name,
            que_file_name: queueData.que_file_name,
            que_message: queueData.que_message,
            que_creation_date: queueData.que_creation_date,
            status: 'failed',
            completed: true, // 處理已完成（雖然失敗）
          },
        }
      } else if (queStatusId === '0' || queStatusId === 0 || queStatusId === '1' || queStatusId === 1) {
        // 還在處理中（処理待ち/処理中）
        return {
          success: true,
          data: {
            que_id: queueData.que_id,
            que_status_id: queueData.que_status_id,
            que_method_name: queueData.que_method_name,
            que_upload_name: queueData.que_upload_name,
            que_file_name: queueData.que_file_name,
            que_message: queueData.que_message,
            que_creation_date: queueData.que_creation_date,
            status: queStatusId === '0' || queStatusId === 0 ? 'wait' : 'processing',
            completed: false,
          },
        }
      } else {
        // 未知狀態
        return {
          success: true,
          data: {
            que_id: queueData.que_id,
            que_status_id: queueData.que_status_id,
            que_method_name: queueData.que_method_name,
            que_upload_name: queueData.que_upload_name,
            que_file_name: queueData.que_file_name,
            que_message: queueData.que_message,
            que_creation_date: queueData.que_creation_date,
            status: 'unknown',
            completed: false,
          },
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Get queue status failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.6: 查詢訂單 Base
   * 
   * Next Engine Order Base：
   * POST https://api.next-engine.org/api_v1_receiveorder_base/search
   * Content-Type: application/x-www-form-urlencoded
   */
  async getOrderBase(
    accessToken: string,
    options?: {
      shopId?: string
      orderId?: string
      dateFrom?: string
      dateTo?: string
      offset?: number
      limit?: number
    }
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const fields = 'receive_order_shop_id,receive_order_id,receive_order_date,receive_order_total_amount'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        wait_flag: '1',
        offset: String(options?.offset || 0),
        limit: String(options?.limit || 100),
      })

      if (options?.shopId) {
        params.append('receive_order_shop_id-eq', options.shopId)
      }

      if (options?.orderId) {
        params.append('receive_order_id-eq', options.orderId)
      }

      if (options?.dateFrom) {
        params.append('receive_order_date-gte', options.dateFrom)
      }

      if (options?.dateTo) {
        params.append('receive_order_date-lte', options.dateTo)
      }

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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get order base',
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
          message: error.message || 'Get order base failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.6: 查詢訂單 Rows（明細）
   * 
   * Next Engine Order Rows：
   * POST https://api.next-engine.org/api_v1_receiveorder_row/search
   * Content-Type: application/x-www-form-urlencoded
   */
  async getOrderRows(
    accessToken: string,
    options?: {
      orderId?: string
      productCode?: string
      shopId?: string
      offset?: number
      limit?: number
    }
  ): Promise<{ success: true; data: any[] } | { success: false; error: PlatformError }> {
    try {
      const fields = 'receive_order_row_receive_order_id,receive_order_row_shop_cut_form_id,receive_order_row_no,receive_order_row_goods_id,receive_order_row_quantity,receive_order_row_cancel_flag,receive_order_row_stock_allocation_quantity,receive_order_row_stock_allocation_date,receive_order_row_creation_date,receive_order_row_last_modified_date'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        wait_flag: '1',
        offset: String(options?.offset || 0),
        limit: String(options?.limit || 100),
      })

      if (options?.orderId) {
        params.append('receive_order_row_receive_order_id-eq', options.orderId)
      }

      if (options?.productCode) {
        params.append('receive_order_row_goods_id-eq', options.productCode)
      }

      if (options?.shopId) {
        params.append('receive_order_row_shop_cut_form_id-eq', options.shopId)
      }

      const response = await fetch('https://api.next-engine.org/api_v1_receiveorder_row/search', {
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
          error: this.mapErrorCode(data.code, data),
        }
      }

      if (data.result !== 'success' || !data.data) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to get order rows',
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
          message: error.message || 'Get order rows failed',
          raw: error,
        },
      }
    }
  }

  /**
   * Story 5.6: 扣庫分析
   * 
   * 流程：
   * 1. 呼叫 /api_v1_receiveorder_row/search，條件為：
   *    - receive_order_row_goods_id-eq=<productCode>
   *    - receive_order_row_cancel_flag-eq=0（排除已取消）
   * 2. 分析每筆訂單的 quantity 與 stock_allocation_quantity，分類為：
   *    - 未扣庫：stock_allocation_quantity = 0
   *    - 部分扣庫：0 < stock_allocation_quantity < quantity
   *    - 已扣庫：stock_allocation_quantity = quantity
   *    - 扣庫異常：stock_allocation_quantity > quantity
   * 3. 回傳統計結果、總量與原始列資料
   */
  async analyzeStockAllocation(
    accessToken: string,
    productCode: string
  ): Promise<{ success: true; data: any } | { success: false; error: PlatformError }> {
    try {
      // 1. 查詢訂單 rows
      const rowsResult = await this.getOrderRows(accessToken, {
        productCode,
      })

      if (!rowsResult.success) {
        return rowsResult
      }

      // 2. 過濾已取消的訂單
      const validRows = rowsResult.data.filter(
        (row: any) => row.receive_order_row_cancel_flag === '0' || row.receive_order_row_cancel_flag === 0
      )

      // 3. 分析每筆訂單的扣庫狀態
      const categories = {
        notAllocated: [] as any[], // 未扣庫
        partiallyAllocated: [] as any[], // 部分扣庫
        fullyAllocated: [] as any[], // 已扣庫
        abnormalAllocation: [] as any[], // 扣庫異常
      }

      let totalQuantity = 0
      let totalAllocated = 0

      validRows.forEach((row: any) => {
        const quantity = parseInt(row.receive_order_row_quantity || '0', 10)
        const allocated = parseInt(row.receive_order_row_stock_allocation_quantity || '0', 10)

        totalQuantity += quantity
        totalAllocated += allocated

        if (allocated === 0) {
          categories.notAllocated.push(row)
        } else if (allocated === quantity) {
          categories.fullyAllocated.push(row)
        } else if (allocated > quantity) {
          categories.abnormalAllocation.push(row)
        } else {
          categories.partiallyAllocated.push(row)
        }
      })

      return {
        success: true,
        data: {
          productCode,
          summary: {
            totalOrders: validRows.length,
            totalQuantity,
            totalAllocated,
            notAllocated: categories.notAllocated.length,
            partiallyAllocated: categories.partiallyAllocated.length,
            fullyAllocated: categories.fullyAllocated.length,
            abnormalAllocation: categories.abnormalAllocation.length,
          },
          categories,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Analyze stock allocation failed',
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

