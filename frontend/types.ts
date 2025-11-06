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
  code?: string
}

// Admin API Types

// Store Info
export interface StoreInfoResponse {
  shop?: {
    id?: string
    name?: string
    domain?: string
    location_id?: string
    [key: string]: any
  }
}

// Products
export interface Product {
  id: string
  handle: string
  title: string
  variants: ProductVariant[]
  images?: Array<{ src: string; alt: string }>
  subtitle?: string
  body_html?: string
  status: string
  published_scope: string
  tags?: string[]
  [key: string]: any
}

export interface ProductVariant {
  id: string
  sku: string
  price: string
  required_shipping: boolean
  taxable: boolean
  inventory_tracker: boolean
  image?: { alt: string; src: string }
  [key: string]: any
}

export interface ProductListParams {
  page?: number
  limit?: number
  ids?: string
}

export interface ProductListResponse {
  products: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

export interface CreateProductInput {
  product: {
    handle?: string
    title: string
    tags: string[]
    variants: Array<{
      sku: string
      price: string
      required_shipping: boolean
      taxable: boolean
      image?: { alt: string; src: string }
      inventory_tracker: boolean
    }>
    images?: Array<{ src: string; alt: string }>
    subtitle?: string
    body_html?: string
    status: string
    published_scope: string
  }
}

// Orders
export interface Order {
  id: string
  [key: string]: any
}

export interface OrderListParams {
  page?: number
  limit?: number
  status?: string
}

export interface OrderListResponse {
  orders: Order[]
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

export interface CreateOrderInput {
  order?: {
    tags?: string
    price_info?: {
      total_shipping_price: string
    }
    line_items?: Array<{
      location_id: string
      price: string
      quantity: number
      title: string
      variant_id: string
    }>
  }
}

// Locations
export interface Location {
  id: string
  name?: string
  [key: string]: any
}

export interface LocationListResponse {
  locations?: Location[]
  [key: string]: any
}

// Auth Types
export interface User {
  id: string
  email: string
  name: string | null
}

export interface AuthResponse {
  success: boolean
  token?: string
  sessionId?: string
  user?: User
  error?: string
  message?: string
}

