import { PrismaClient } from '@prisma/client'
import { 
  generateSignature, 
  verifySignature, 
  verifyGetSignature, 
  verifyTimestamp,
  signPostRequest,
  verifyWebhookSignature as verifyWebhookSignatureUtil
} from '../utils/signature'
import { ShoplineAuthParams, ShoplineTokenResponse } from '../../shared/types'

const prisma = new PrismaClient()

export class ShoplineService {
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
   * 驗證應用安裝請求
   */
  async verifyInstallRequest(params: ShoplineAuthParams): Promise<boolean> {
    const { appkey, handle, timestamp, sign } = params
    
    // 檢查 appkey 是否匹配
    if (appkey !== this.appKey) {
      console.error('App key 不匹配')
      return false
    }

    // 驗證時間戳 (5分鐘內有效)
    const now = Date.now()
    // 判斷 timestamp 是秒還是毫秒（13位數以上是毫秒）
    const requestTime = timestamp.length >= 13 ? parseInt(timestamp) : parseInt(timestamp) * 1000
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
    const isValidSignature = verifyGetSignature(allParams, sign, this.appSecret)
    if (!isValidSignature) {
      console.error('簽名驗證失敗')
      return false
    }

    return true
  }

  /**
   * 生成授權 URL
   * 根據 temp 腳本的正確實現
   */
  generateAuthUrl(state: string, handle: string): string {
    const scope = 'read_products,read_orders' // 根據需求設定權限範圍
    return `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${this.appKey}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(this.redirectUri)}`
  }

  /**
   * 交換授權碼獲取存取令牌
   * 根據 temp 腳本的正確實現
   */
  async exchangeCodeForToken(code: string, handle: string): Promise<ShoplineTokenResponse> {
    try {
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

      const data = await response.json()
      
      if (data.code === 200) {
        return {
          success: true,
          data: data.data
        }
      } else {
        throw new Error(data.message || 'Token request failed')
      }
    } catch (error) {
      console.error('Token 請求錯誤:', error)
      throw error
    }
  }

  /**
   * 儲存商店資訊
   */
  async saveStoreInfo(tokenData: ShoplineTokenResponse, handle: string): Promise<void> {
    if (!tokenData.success || !tokenData.data) {
      throw new Error('Invalid token data')
    }

    // 取得欄位
    const access_token = tokenData.data.accessToken
    const scope = tokenData.data.scope
    
    // 從 JWT 中解碼 storeId、exp 和 domain
    const jwtPayload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64').toString())
    const shop_id = jwtPayload.storeId
    const shop_domain = jwtPayload.domain || null
    const expiresAt = jwtPayload.exp ? new Date(jwtPayload.exp * 1000) : null
    
    if (!shop_id) {
      throw new Error(`Missing storeId in JWT payload. JWT payload: ${JSON.stringify(jwtPayload)}`)
    }
    if (!access_token) {
      throw new Error(`Missing accessToken in token data`)
    }

    await prisma.store.upsert({
      where: { shoplineId: shop_id },
      update: {
        handle: handle,
        accessToken: access_token,
        scope: scope,
        domain: shop_domain,
        expiresAt: expiresAt,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shoplineId: shop_id,
        handle: handle,
        accessToken: access_token,
        scope: scope,
        domain: shop_domain,
        expiresAt: expiresAt,
        isActive: true
      }
    }).catch((error: any) => {
      console.error('Prisma error:', error)
      throw error
    })
  }

  /**
   * 取得商店資訊
   */
  async getStoreInfo(shoplineId: string) {
    return prisma.store.findUnique({
      where: { shoplineId }
    })
  }

  /**
   * 根據 handle 取得商店資訊
   */
  async getStoreByHandle(handle: string) {
    return prisma.store.findFirst({
      where: { handle, isActive: true }
    })
  }

  /**
   * 取得所有已授權的商店
   */
  async getAllStores() {
    return prisma.store.findMany({
      where: { isActive: true },
      select: {
        id: true,
        shoplineId: true,
        handle: true,
        name: true,
        domain: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
  }

  /**
   * 驗證 Webhook 簽名
   * 根據官方文件：對整個 Request Body 進行 HMAC-SHA256
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    return verifyWebhookSignatureUtil(body, signature, this.appSecret)
  }

  /**
   * 儲存 Webhook 事件
   */
  async saveWebhookEvent(
    storeId: string,
    webhookId: string,
    topic: string,
    shopDomain: string | null,
    shoplineId: string | null,
    merchantId: string | null,
    apiVersion: string | null,
    payload: any
  ): Promise<void> {
    await prisma.webhookEvent.create({
      data: {
        storeId,
        webhookId,
        topic,
        eventType: topic, // 保留作為兼容欄位
        shopDomain,
        shoplineId,
        merchantId,
        apiVersion,
        payload: JSON.stringify(payload)
      }
    })
  }

  /**
   * 檢查 Webhook ID 是否已處理過（防止重複處理）
   */
  async isWebhookProcessed(webhookId: string): Promise<boolean> {
    const event = await prisma.webhookEvent.findUnique({
      where: { webhookId },
      select: { id: true }
    })
    return !!event
  }

  /**
   * 訂閱 Webhook
   * 使用商店的 Access Token 訂閱特定事件
   * 根據官方文件：POST /admin/openapi/v20260301/webhooks.json
   * 參考：https://developer.shopline.com/docs/admin-rest-api/webhook/subscribe-to-a-webhook?version=v20250601
   */
  async subscribeWebhook(
    handle: string,
    topic: string,
    webhookUrl: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const store = await this.getStoreByHandle(handle)
    if (!store) {
      throw new Error(`Store not found for handle: ${handle}`)
    }

    // 官方文件：POST /admin/openapi/v20250601/webhooks.json
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks.json`
    
    try {
      // 官方文件要求的請求格式：{ webhook: { address, api_version, topic } }
      // 注意：api_version 是 webhook 事件版本，不同 topic 可能需要不同版本
      // 根據官方文件：大部分 topic 使用 v20240601，但需要根據實際 topic 調整
      // 先嘗試 v20240601，如果失敗再根據錯誤訊息調整
      let webhookApiVersion = 'v20240601' // Webhook 事件版本（必須 v20240601 或更高）
      
      // 某些 topic 可能需要更高的版本，先統一使用 v20240601
      // 如果訂閱失敗，會根據錯誤訊息判斷是否需要調整
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8', // 官方要求
          'Authorization': `Bearer ${store.accessToken}`
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
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
      }

      // 檢查是否為空回應
      if (!text || text.trim() === '') {
        // 空回應可能是成功（某些 API 在成功時返回空）
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
        // 官方文件回應格式：{ webhook: { id, topic, address, api_version, created_at, updated_at } }
        console.log('Webhook subscription successful:', data)
        return data
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', text)
        
        // 檢查錯誤訊息內容（直接返回 API 的原始錯誤訊息）
        // 不應該猜測錯誤訊息格式，直接返回 API 返回的錯誤內容
        
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
      }
    } catch (error: any) {
      console.error('Webhook subscribe request error:', error)
      throw error
    }
  }

  /**
   * 取得訂閱的 Webhook 列表
   * 根據官方文件：GET /admin/openapi/v20260301/webhooks.json
   * 參考：https://developer.shopline.com/docs/admin-rest-api/webhook/get-a-list-of-subscribed-webhooks?version=v20250601
   */
  async getSubscribedWebhooks(
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const store = await this.getStoreByHandle(handle)
    if (!store) {
      throw new Error(`Store not found for handle: ${handle}`)
    }

    // 官方文件：GET /admin/openapi/v20250601/webhooks.json
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks.json`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8', // 官方要求
          'Authorization': `Bearer ${store.accessToken}`
        }
      })

      // 先讀取回應內容（只能讀一次）
      const text = await response.text()
      const contentType = response.headers.get('content-type')

      // 檢查回應狀態
      if (!response.ok) {
        console.error(`Get webhooks error (${response.status}):`, text)
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
      }

      // 檢查是否為空回應
      if (!text || text.trim() === '') {
        // 空回應返回空陣列
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
        // 官方文件回應格式：{ webhooks: [{ id, topic, address, api_version, created_at, updated_at }] }
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
   * 根據官方文件：DELETE /admin/openapi/v20260301/webhooks/{webhook_id}.json
   * 注意：官方文件沒有明確說明 DELETE 端點，但根據 RESTful 慣例應該是這個格式
   */
  async unsubscribeWebhook(
    handle: string,
    webhookId: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    const store = await this.getStoreByHandle(handle)
    if (!store) {
      throw new Error(`Store not found for handle: ${handle}`)
    }

    // 根據 RESTful 慣例推測：DELETE /admin/openapi/v20250601/webhooks/{id}.json
    const url = `https://${handle}.myshopline.com/admin/openapi/${apiVersion}/webhooks/${webhookId}.json`
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json; charset=utf-8', // 官方要求
          'Authorization': `Bearer ${store.accessToken}`
        }
      })

      // 檢查回應狀態
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Unsubscribe webhook error (${response.status}):`, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
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
   * 注意：官方文件中沒有明確的 count 端點，可以從列表 API 計算
   * 使用 GET /admin/openapi/v20260301/webhooks.json 然後計算數量
   */
  async getWebhookCount(
    handle: string,
    apiVersion: string = 'v20250601'
  ): Promise<any> {
    // 使用列表 API 然後計算數量
    const subscriptions = await this.getSubscribedWebhooks(handle, apiVersion)
    return { count: subscriptions?.webhooks?.length || 0 }
  }
}
