// 型別定義

export interface ShoplineAuthParams {
  appkey: string
  handle: string
  timestamp: string
  sign: string
}

export interface ShoplineTokenResponse {
  success: boolean
  data?: {
    accessToken: string
    expireTime: string
    refreshToken: string
    refreshExpireTime: string
    scope: string
  }
  error?: string
}

// 官方 Webhook Headers
export interface ShoplineWebhookHeaders {
  'x-shopline-topic': string // 事件識別符，例如：orders/update
  'x-shopline-hmac-sha256': string // Payload 的簽名
  'x-shopline-shop-domain': string // 商店域名
  'x-shopline-shop-id': string // 商店 ID
  'x-shopline-merchant-id': string // 商家 ID
  'x-shopline-api-version': string // 事件版本，例如：v20230901
  'x-shopline-webhook-id': string // Webhook 訊息的唯一 ID
}

// Webhook Request Body（依事件類型而異，此為通用結構）
export interface ShoplineWebhookPayload {
  [key: string]: any // 業務數據，依事件類型而定
}

export interface StoreInfo {
  id: string
  shoplineId: string
  handle?: string
  name?: string
  domain?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

