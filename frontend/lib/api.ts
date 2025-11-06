import axios from 'axios'
import { ApiResponse, StoreInfo, StoreInfoResponse, ProductListParams, ProductListResponse, Product, CreateProductInput, OrderListParams, OrderListResponse, Order, CreateOrderInput, LocationListResponse } from '@/types'

// 生產環境必須設定 NEXT_PUBLIC_BACKEND_URL
// 開發環境可以使用 NEXT_PUBLIC_NGROK_URL（ngrok）或 NEXT_PUBLIC_API_URL
const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (process.env.NEXT_PUBLIC_NGROK_URL) {
    return process.env.NEXT_PUBLIC_NGROK_URL
  }
  // 生產環境不應該到這裡，應該拋出錯誤
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ 錯誤：生產環境必須設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
    throw new Error('NEXT_PUBLIC_BACKEND_URL is required in production')
  }
  // 開發環境允許使用 localhost
  return 'http://localhost:3001'
}

const api = axios.create({
  baseURL: getBackendUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    
    // 加入 Token（如果存在）
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message)
    
    // 處理 401 錯誤（未授權）
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      // 清除 Zustand Store 中的認證狀態
      if (typeof window !== 'undefined') {
        const { useAuthStore } = require('../stores/useAuthStore')
        useAuthStore.getState().logout()
        // 只在非登入/註冊頁面時重導向
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export const apiClient = {
  // 取得所有商店
  async getStores(): Promise<ApiResponse<StoreInfo[]>> {
    const response = await api.get('/api/stores')
    return response.data
  },

  // 取得特定商店
  async getStore(shopId: string): Promise<ApiResponse<StoreInfo>> {
    const response = await api.get(`/api/stores/${shopId}`)
    return response.data
  },

  // 健康檢查
  async healthCheck(): Promise<ApiResponse> {
    const response = await api.get('/api/health')
    return response.data
  },

  // 取得 Webhook 事件
  async getWebhookEvents(): Promise<ApiResponse<any[]>> {
    const response = await api.get('/webhook/events')
    return response.data
  },

  // Webhook 訂閱管理
  async getWebhookSubscriptions(handle: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/webhook/subscribe?handle=${handle}`)
      return response.data
    } catch (error: any) {
      console.error('Get webhook subscriptions error:', error)
      throw error
    }
  },

  async subscribeWebhook(data: {
    handle: string
    topic: string
    webhookUrl: string
    apiVersion?: string
  }): Promise<ApiResponse<any>> {
    try {
      const response = await api.post('/webhook/subscribe', data)
      return response.data
    } catch (error: any) {
      console.error('Subscribe webhook error:', error)
      // 提取更詳細的錯誤訊息
      const errorMessage = error.response?.data?.error || error.message || '訂閱失敗'
      throw new Error(errorMessage)
    }
  },

  async unsubscribeWebhook(webhookId: string, handle: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.delete(`/webhook/subscribe/${webhookId}?handle=${handle}`)
      return response.data
    } catch (error: any) {
      console.error('Unsubscribe webhook error:', error)
      const errorMessage = error.response?.data?.error || error.message || '取消訂閱失敗'
      throw new Error(errorMessage)
    }
  },

  async getWebhookCount(handle: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/webhook/subscribe/count?handle=${handle}`)
      return response.data
    } catch (error: any) {
      console.error('Get webhook count error:', error)
      throw error
    }
  },

  // Admin API Methods
  async getStoreInfo(handle: string): Promise<ApiResponse<StoreInfoResponse>> {
    try {
      const response = await api.get(`/api/stores/${handle}/info`)
      return response.data
    } catch (error: any) {
      console.error('Get store info error:', error)
      throw error
    }
  },

  async getProducts(handle: string, params?: ProductListParams): Promise<ApiResponse<ProductListResponse>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.ids) queryParams.append('ids', params.ids)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      const queryString = queryParams.toString()
      const response = await api.get(`/api/stores/${handle}/products${queryString ? '?' + queryString : ''}`)
      return response.data
    } catch (error: any) {
      console.error('Get products error:', error)
      throw error
    }
  },

  async getProduct(handle: string, productId: string): Promise<ApiResponse<{ product: Product }>> {
    try {
      const response = await api.get(`/api/stores/${handle}/products/${productId}`)
      return response.data
    } catch (error: any) {
      console.error('Get product error:', error)
      throw error
    }
  },

  async createProduct(handle: string, productData?: CreateProductInput): Promise<ApiResponse<{ product: Product }>> {
    try {
      const response = await api.post(`/api/stores/${handle}/products`, productData || {})
      return response.data
    } catch (error: any) {
      console.error('Create product error:', error)
      throw error
    }
  },

  async getOrders(handle: string, params?: OrderListParams): Promise<ApiResponse<OrderListResponse>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      
      const queryString = queryParams.toString()
      const response = await api.get(`/api/stores/${handle}/orders${queryString ? '?' + queryString : ''}`)
      return response.data
    } catch (error: any) {
      console.error('Get orders error:', error)
      throw error
    }
  },

  async createOrder(handle: string, orderData?: CreateOrderInput): Promise<ApiResponse<{ order: Order }>> {
    try {
      const response = await api.post(`/api/stores/${handle}/orders`, orderData || {})
      return response.data
    } catch (error: any) {
      console.error('Create order error:', error)
      throw error
    }
  },

  async getLocations(handle: string): Promise<ApiResponse<LocationListResponse>> {
    try {
      const response = await api.get(`/api/stores/${handle}/locations`)
      return response.data
    } catch (error: any) {
      console.error('Get locations error:', error)
      throw error
    }
  }
}

// 認證相關 API
export async function register(email: string, password: string, name?: string) {
  const response = await api.post('/api/auth/register', { email, password, name })
  return response.data
}

export async function login(email: string, password: string) {
  const response = await api.post('/api/auth/login', { email, password })
  return response.data
}

export async function logout() {
  const response = await api.post('/api/auth/logout')
  return response.data
}

export async function getCurrentUser() {
  const response = await api.get('/api/auth/me')
  return response.data
}

export default api
