import axios from 'axios'
import { ApiResponse, StoreInfo } from '@/types'

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
  }
}

export default api
