/**
 * Shopline Platform Adapter
 * 
 * Story 5.4: 實作 Shopline 平台的 OAuth 流程與 API 呼叫，與 Next Engine Adapter 一致的介面。
 * 
 * 參考文件：
 * - docs/reference/guides/SHOPLINE_OAUTH_IMPLEMENTATION.md
 */

import { PlatformAdapter, PlatformError, TokenPayload, IdentityInfo } from '../types/platform'
import { signPostRequest, verifyGetSignature, verifyWebhookSignature as verifyWebhookSignatureUtil } from '../utils/signature'
import {
  StoreInfoResponse,
  ProductListParams,
  ProductListResponse,
  Product,
  CreateProductInput,
  OrderListParams,
  OrderListResponse,
  Order,
  CreateOrderInput,
  LocationListResponse
} from '../types'

interface ShoplineTokenApiResponse {
  code: number
  data?: {
    accessToken: string
    expireTime: string
    refreshToken: string
    refreshExpireTime: string
    scope: string
  }
  message?: string
}

export class ShoplineAdapter implements PlatformAdapter {
  private appKey: string
  private appSecret: string
  private redirectUri: string

  constructor() {
    // 統一使用環境變數，不依賴 config.json
    const appType = process.env.APP_TYPE || 'custom'
    
    if (appType === 'public') {
      // 使用 Public App 配置
      this.appKey = process.env.SHOPLINE_PUBLIC_APP_KEY || ''
      this.appSecret = process.env.SHOPLINE_PUBLIC_APP_SECRET || ''
    } else {
      // 使用 Custom App 配置（預設）
      this.appKey = process.env.SHOPLINE_CUSTOM_APP_KEY || ''
      this.appSecret = process.env.SHOPLINE_CUSTOM_APP_SECRET || ''
    }
    
    // 檢查必要的環境變數
    if (!this.appKey || !this.appSecret) {
      throw new Error(`缺少必要的環境變數: ${appType === 'public' ? 'SHOPLINE_PUBLIC_APP_KEY, SHOPLINE_PUBLIC_APP_SECRET' : 'SHOPLINE_CUSTOM_APP_KEY, SHOPLINE_CUSTOM_APP_SECRET'}`)
    }
    
    // Redirect URI 必須從環境變數讀取
    this.redirectUri = process.env.SHOPLINE_REDIRECT_URI || ''
    
    if (!this.redirectUri) {
      throw new Error('缺少必要的環境變數: SHOPLINE_REDIRECT_URI')
    }
  }

  /**
   * 取得授權 URL
   * 
   * Shopline OAuth 流程：
   * GET https://{handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey={APP_KEY}&responseType=code&scope={SCOPE}&redirectUri={REDIRECT_URI}&state={STATE}
   * 
   * @param state OAuth state 參數（包含 Session ID）
   * @param additionalParams 必須包含 handle（商店 handle）
   */
  getAuthorizeUrl(state: string, additionalParams?: Record<string, any>): string {
    if (!additionalParams || !additionalParams.handle) {
      throw new Error('Shopline adapter requires handle in additionalParams')
    }

    const handle = additionalParams.handle as string
    const scope = 'read_products,read_orders' // 根據需求設定權限範圍
    
    return `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${this.appKey}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(this.redirectUri)}&state=${encodeURIComponent(state)}`
  }

  /**
   * 交換授權碼取得 Token
   * 
   * Shopline Token 交換：
   * POST https://{handle}.myshopline.com/admin/oauth/token/create
   * Content-Type: application/json
   * Headers: appkey, timestamp, sign
   * Body: { code }
   * 
   * @param code 授權碼
   * @param state OAuth state 參數（此處不使用，但保留以符合介面）
   * @param additionalParams 必須包含 handle（商店 handle）
   */
  async exchangeToken(
    code: string,
    state: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }> {
    try {
      if (!additionalParams || !additionalParams.handle) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Shopline adapter requires handle in additionalParams',
            raw: { hasHandle: !!additionalParams?.handle },
          },
        }
      }

      const handle = additionalParams.handle as string
      const timestamp = Date.now().toString()
      const body = JSON.stringify({ code })
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await fetch(
        `https://${handle}.myshopline.com/admin/oauth/token/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign
          },
          body
        }
      )

      const responseData: any = await response.json()
      const data = responseData as ShoplineTokenApiResponse
      
      if (data.code === 200 && data.data && data.data.accessToken) {
        // 解析 expiresAt（從 expireTime 字串或 JWT）
        let expiresAt: Date | undefined
        let refreshExpiresAt: Date | undefined

        // 嘗試從 expireTime 解析
        if (data.data.expireTime) {
          expiresAt = new Date(data.data.expireTime)
        } else {
          // 如果沒有 expireTime，嘗試從 JWT 解析
          try {
            const jwtPayload = JSON.parse(Buffer.from(data.data.accessToken.split('.')[1], 'base64').toString())
            if (jwtPayload.exp) {
              expiresAt = new Date(jwtPayload.exp * 1000)
            }
          } catch (error) {
            // JWT 解析失敗，使用預設值（1小時後過期）
            expiresAt = new Date(Date.now() + 60 * 60 * 1000)
          }
        }

        // 嘗試從 refreshExpireTime 解析
        if (data.data.refreshExpireTime) {
          refreshExpiresAt = new Date(data.data.refreshExpireTime)
        }

        return {
          success: true,
          data: {
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            expiresAt: expiresAt?.toISOString(),
            refreshExpiresAt: refreshExpiresAt?.toISOString(),
            scope: data.data.scope,
            // Shopline 特定欄位
            handle: handle,
          },
        }
      } else {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: data.message || 'Token exchange failed',
            raw: data,
          },
        }
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
   * 注意：Shopline 的 refresh token 機制可能需要額外的 API 端點
   * 目前根據官方文件，可能需要重新授權或使用 refresh token API
   * 
   * @param refreshToken Refresh token
   * @param additionalParams 必須包含 handle（商店 handle）
   */
  async refreshToken(
    refreshToken: string,
    additionalParams?: Record<string, any>
  ): Promise<{ success: true; data: TokenPayload } | { success: false; error: PlatformError }> {
    // Shopline 目前沒有標準的 refresh token API
    // 如果 token 過期，需要重新授權
    // 這裡先返回錯誤，提示需要重新授權
    return {
      success: false,
      error: {
        type: 'TOKEN_REFRESH_FAILED',
        message: 'Shopline does not support token refresh. Please reauthorize.',
        raw: { platform: 'shopline' },
      },
    }
  }

  /**
   * 取得平台帳戶資訊（用於 Connection displayName）
   * 
   * Shopline Store Info：
   * GET https://{handle}.myshopline.com/admin/openapi/{apiVersion}/merchants/shop.json
   * Headers: Authorization: Bearer {accessToken}
   * 
   * 注意：此方法從 JWT 中解析 storeId 和 domain
   * 如果需要完整的商店名稱，需要在路由層級提供 handle 並呼叫 API
   * 
   * @param accessToken Access token（JWT）
   * @returns 帳戶資訊或錯誤
   */
  async getIdentity(
    accessToken: string
  ): Promise<{ success: true; data: IdentityInfo } | { success: false; error: PlatformError }> {
    try {
      // 從 JWT 中解析 storeId
      let storeId: string | undefined
      let domain: string | undefined

      try {
        const jwtPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
        storeId = jwtPayload.storeId
        domain = jwtPayload.domain
      } catch (error) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Failed to parse access token',
            raw: error,
          },
        }
      }

      if (!storeId) {
        return {
          success: false,
          error: {
            type: 'PLATFORM_ERROR',
            message: 'Missing storeId in access token',
            raw: { accessToken: accessToken.substring(0, 20) + '...' },
          },
        }
      }

      // 從 JWT 中取得基本資訊
      // 注意：如果需要完整的商店名稱，需要在路由層級提供 handle 並呼叫 API
      // 這裡只返回從 JWT 中解析的資訊
      return {
        success: true,
        data: {
          id: storeId,
          name: domain || `Shopline Store ${storeId}`, // 使用 domain 或預設名稱
          // Shopline 特定欄位
          storeId: storeId,
          domain: domain,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'PLATFORM_ERROR',
          message: error.message || 'Failed to get identity',
          raw: error,
        },
      }
    }
  }

  /**
   * 驗證應用安裝請求（Shopline 特定方法，保留以向後相容）
   * 
   * 注意：這個方法不在 PlatformAdapter 介面中，但保留以支援現有的驗證邏輯
   */
  async verifyInstallRequest(params: {
    appkey: string
    handle: string
    timestamp: string
    sign: string
    [key: string]: any
  }): Promise<boolean> {
    // 檢查 appkey 是否匹配
    if (params.appkey !== this.appKey) {
      console.error('App key 不匹配')
      return false
    }

    // 驗證時間戳 (5分鐘內有效)
    const now = Date.now()
    const requestTime = params.timestamp.length >= 13 ? parseInt(params.timestamp) : parseInt(params.timestamp) * 1000
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      console.error(`時間戳驗證失敗: now=${now}, request=${requestTime}, diff=${Math.abs(now - requestTime)}`)
      return false
    }

    // 驗證簽名 - 排除 sign 後自動排序所有參數
    const allParams: Record<string, string> = {}
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'sign' && value !== undefined) {
        allParams[key] = String(value)
      }
    })
    const isValidSignature = verifyGetSignature(allParams, params.sign, this.appSecret)
    if (!isValidSignature) {
      console.error('簽名驗證失敗')
      return false
    }

    return true
  }

  // ==================== API Methods ====================

  /**
   * 處理 Shopline API 錯誤回應
   */
  private handleApiError(response: Response, text: string): Error {
    // 嘗試解析錯誤訊息
    let errorMessage = text || response.statusText
    
    try {
      const errorData = JSON.parse(text)
      if (errorData.errors) {
        errorMessage = errorData.errors
      } else if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch (parseError) {
      // 如果無法解析 JSON，使用原始文字
    }

    // 針對特定狀態碼提供更友好的錯誤訊息
    if (response.status === 401) {
      if (errorMessage.includes('expired') || errorMessage.includes('過期')) {
        return new Error('ACCESS_TOKEN_EXPIRED: Access Token 已過期，請重新授權商店')
      }
      return new Error(`AUTHENTICATION_FAILED: 認證失敗 - ${errorMessage}`)
    }

    if (response.status === 403) {
      return new Error(`AUTHORIZATION_FAILED: 權限不足 - ${errorMessage}`)
    }

    if (response.status === 404) {
      return new Error(`NOT_FOUND: 資源不存在 - ${errorMessage}`)
    }

    return new Error(`HTTP ${response.status}: ${errorMessage}`)
  }

  /**
   * 取得商店資訊（從 Shopline API）
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getStoreInfoFromAPI(
    accessToken: string,
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<StoreInfoResponse> {
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/merchants/shop.json`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as StoreInfoResponse
    } catch (error: any) {
      console.error('Get store info error:', error)
      throw error
    }
  }

  /**
   * 取得產品列表
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param params 查詢參數
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getProducts(
    accessToken: string,
    handle: string,
    params?: ProductListParams,
    apiVersion: string = 'v20250601'
  ): Promise<ProductListResponse> {
    // 構建查詢參數
    const queryParams = new URLSearchParams()
    if (params?.ids) queryParams.append('ids', params.ids)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const queryString = queryParams.toString()
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/products/products.json${queryString ? '?' + queryString : ''}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as ProductListResponse
    } catch (error: any) {
      console.error('Get products error:', error)
      throw error
    }
  }

  /**
   * 取得單一產品
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param productId 產品 ID
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getProduct(
    accessToken: string,
    handle: string,
    productId: string,
    apiVersion: string = 'v20250601'
  ): Promise<{ product: Product }> {
    const products = await this.getProducts(accessToken, handle, { ids: productId }, apiVersion)
    if (!products.products || products.products.length === 0) {
      throw new Error(`Product not found: ${productId}`)
    }
    return { product: products.products[0] }
  }

  /**
   * 建立產品（含動態隨機機制生成唯一 handle）
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param productData 產品資料（可選）
   * @param apiVersion API 版本（預設 v20250601）
   */
  async createProduct(
    accessToken: string,
    handle: string,
    productData?: Partial<CreateProductInput>,
    apiVersion: string = 'v20250601'
  ): Promise<{ product: Product }> {
    // 生成唯一的 handle
    const generateUniqueHandle = (): string => {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 11)
      return `shopline-${timestamp}-${random}`
    }

    // 如果沒有提供 productData，使用預設值
    const uniqueHandle = generateUniqueHandle()
    const defaultProductData: CreateProductInput = {
      product: {
        handle: uniqueHandle,
        title: uniqueHandle,
        tags: ['test', 'api'],
        variants: [
          {
            sku: `T${Date.now()}`,
            price: '1000',
            required_shipping: true,
            taxable: true,
            inventory_tracker: true
          }
        ],
        status: 'active',
        published_scope: 'web'
      }
    }

    const finalProductData = productData 
      ? { ...defaultProductData, product: { ...defaultProductData.product, ...productData.product, handle: productData.product?.handle || uniqueHandle } }
      : defaultProductData

    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/products/products.json`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(finalProductData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as { product: Product }
    } catch (error: any) {
      console.error('Create product error:', error)
      throw error
    }
  }

  /**
   * 取得訂單列表
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param params 查詢參數
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getOrders(
    accessToken: string,
    handle: string,
    params?: OrderListParams,
    apiVersion: string = 'v20250601'
  ): Promise<OrderListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    
    const queryString = queryParams.toString()
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/orders.json${queryString ? '?' + queryString : ''}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as OrderListResponse
    } catch (error: any) {
      console.error('Get orders error:', error)
      throw error
    }
  }

  /**
   * 取得 Locations 列表
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getLocations(
    accessToken: string,
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<LocationListResponse> {
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/locations/list.json`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as LocationListResponse
    } catch (error: any) {
      console.error('Get locations error:', error)
      throw error
    }
  }

  /**
   * 建立訂單（含隨機產品選擇機制）
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param orderData 訂單資料（可選）
   * @param apiVersion API 版本（預設 v20250601）
   */
  async createOrder(
    accessToken: string,
    handle: string,
    orderData?: Partial<CreateOrderInput>,
    apiVersion: string = 'v20250601'
  ): Promise<{ order: Order }> {
    // 如果沒有提供 orderData，自動生成
    let finalOrderData: CreateOrderInput

    if (!orderData || !orderData.order) {
      // 1. 取得產品列表
      const productsResponse = await this.getProducts(accessToken, handle, {}, apiVersion)
      
      if (!productsResponse.products || productsResponse.products.length === 0) {
        throw new Error('No products found. Please create a product first.')
      }

      // 2. 隨機選擇一個產品
      const randomProduct = productsResponse.products[Math.floor(Math.random() * productsResponse.products.length)]
      
      // 3. 取得 variant_id（確保是字串且有效）
      if (!randomProduct.variants || randomProduct.variants.length === 0) {
        throw new Error('Selected product has no variants')
      }
      
      // 找到第一個有效的 variant（有 id 且 id 不為空）
      const validVariant = randomProduct.variants.find((v: any) => v && v.id && String(v.id).trim() !== '')
      
      if (!validVariant) {
        throw new Error('Selected product has no valid variants (missing variant ID)')
      }
      
      // 確保 variant_id 是字串格式
      const variantId = String(validVariant.id).trim()
      const variantPrice = validVariant.price || '100'
      
      // 驗證 variant_id 格式（應該是有效的 ID）
      if (!variantId || variantId === 'undefined' || variantId === 'null') {
        throw new Error(`Invalid variant ID: ${variantId}`)
      }
      
      console.log('Selected product:', {
        productId: randomProduct.id,
        productTitle: randomProduct.title,
        variantId: variantId,
        variantPrice: variantPrice,
        totalVariants: randomProduct.variants.length
      })

      // 4. 取得 location_id（從 Locations API）
      let locationId = ''
      try {
        const locationsResponse = await this.getLocations(accessToken, handle, apiVersion)
        if (locationsResponse.locations && locationsResponse.locations.length > 0) {
          // 使用第一個 location
          locationId = locationsResponse.locations[0].id
        } else {
          throw new Error('No locations found')
        }
      } catch (error) {
        console.error('Could not get location_id from locations API:', error)
        throw new Error('Failed to get location_id. Please ensure the store has locations configured.')
      }

      // 5. 生成訂單資料
      finalOrderData = {
        order: {
          tags: 'API_Test',
          price_info: {
            total_shipping_price: '8.00'
          },
          line_items: [
            {
              location_id: locationId,
              price: variantPrice,
              quantity: 1,
              title: randomProduct.title || 'Test Product',
              variant_id: variantId
            }
          ]
        }
      }
    } else {
      finalOrderData = orderData as CreateOrderInput
    }

    // 建立訂單
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/orders.json`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(finalOrderData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.handleApiError(response, errorText)
      }

      const data: any = await response.json()
      return data as { order: Order }
    } catch (error: any) {
      console.error('Create order error:', error)
      throw error
    }
  }

  // ==================== Webhook Methods ====================

  /**
   * 驗證 Webhook 簽名
   * 根據官方文件：對整個 Request Body 進行 HMAC-SHA256
   * 
   * @param rawBody 原始 Request Body（字串）
   * @param signature Webhook 簽名
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return verifyWebhookSignatureUtil(rawBody, signature, this.appSecret)
  }

  /**
   * 訂閱 Webhook
   * 使用商店的 Access Token 訂閱特定事件
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param topic Webhook topic
   * @param webhookUrl Webhook URL
   * @param apiVersion API 版本（預設 v20250601）
   */
  async subscribeWebhook(
    accessToken: string,
    handle: string,
    topic: string,
    webhookUrl: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks.json`
    
    try {
      let webhookApiVersion = 'v20240601' // Webhook 事件版本（必須 v20240601 或更高）
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          webhook: {
            address: webhookUrl,
            api_version: webhookApiVersion,
            topic: topic
          }
        })
      })

      // 先讀取回應內容（只能讀一次）
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      // 檢查回應狀態
      if (!response.ok) {
        console.error(`Webhook subscribe error (${response.status}):`, text)
        throw this.handleApiError(response, text)
      }

      // 檢查是否為空回應
      if (!text || text.trim() === '') {
        return { success: true, code: 200, message: 'Subscription created successfully' }
      }

      // 檢查 Content-Type 是否為 JSON（如果提供了的話）
      if (contentType && !contentType.includes('application/json')) {
        console.error('Non-JSON response:', text)
        throw new Error(`Expected JSON but got ${contentType}`)
      }

      // 嘗試解析 JSON
      try {
        const data = JSON.parse(text)
        console.log('Webhook subscription successful:', data)
        return data
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', text)
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.error('Webhook subscribe request error:', error)
      throw error
    }
  }

  /**
   * 取得訂閱的 Webhook 列表
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getSubscribedWebhooks(
    accessToken: string,
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks.json`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      // 先讀取回應內容（只能讀一次）
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      // 檢查回應狀態
      if (!response.ok) {
        console.error(`Get webhooks error (${response.status}):`, text)
        throw this.handleApiError(response, text)
      }

      // 檢查是否為空回應
      if (!text || text.trim() === '') {
        return { webhooks: [], count: 0 }
      }

      // 檢查 Content-Type 是否為 JSON（如果提供了的話）
      if (contentType && !contentType.includes('application/json')) {
        console.error('Non-JSON response:', text)
        throw new Error(`Expected JSON but got ${contentType}`)
      }

      // 嘗試解析 JSON
      try {
        const data = JSON.parse(text)
        console.log('Webhook subscriptions retrieved:', { count: data?.webhooks?.length || 0 })
        return data
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', text)
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.error('Get webhooks request error:', error)
      throw error
    }
  }

  /**
   * 取消訂閱 Webhook
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param webhookId Webhook ID
   * @param apiVersion API 版本（預設 v20250601）
   */
  async unsubscribeWebhook(
    accessToken: string,
    handle: string,
    webhookId: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks/${webhookId}.json`
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      // 檢查回應狀態
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Unsubscribe webhook error (${response.status}):`, errorText)
        throw this.handleApiError(response, errorText)
      }

      // DELETE 請求可能返回空回應或 JSON
      const text = await response.text()
      if (!text || text.trim() === '') {
        return { success: true, code: 200, message: 'Unsubscribed successfully' }
      }

      try {
        const data = JSON.parse(text)
        return data
      } catch (parseError) {
        // 如果不是 JSON，視為成功（某些 API 在成功時返回空）
        return { success: true, code: 200, message: 'Unsubscribed successfully' }
      }
    } catch (error: any) {
      console.error('Unsubscribe webhook request error:', error)
      throw error
    }
  }

  /**
   * 取得訂閱數量
   * 
   * @param accessToken Access token
   * @param handle 商店 handle
   * @param apiVersion API 版本（預設 v20250601）
   */
  async getWebhookCount(
    accessToken: string,
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    // 使用列表 API 然後計算數量
    const subscriptions = await this.getSubscribedWebhooks(accessToken, handle, apiVersion)
    return { count: subscriptions?.webhooks?.length || 0 }
  }
}

