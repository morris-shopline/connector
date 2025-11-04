import { useState } from 'react'
import { apiClient } from '../lib/api'

export function useSubscribeWebhook() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const subscribe = async (data: {
    handle: string
    topic: string
    webhookUrl: string
    apiVersion?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.subscribeWebhook(data)
      
      // 檢查後端回應格式
      if (result.success && result.data) {
        return { success: true, data: result.data }
      } else if (result.success) {
        // 後端成功但沒有 data，可能表示訂閱成功但 API 返回空回應
        return { success: true, data: { message: '訂閱成功' } }
      } else {
        return { success: false, error: result.error || '訂閱失敗' }
      }
    } catch (err: any) {
      // 處理各種錯誤情況
      let errorMessage = '訂閱失敗'
      let errorCode = null
      
      // 檢查是否為 Token 過期錯誤
      if (err.response?.data?.code === 'TOKEN_EXPIRED' || err.response?.data?.error === 'ACCESS_TOKEN_EXPIRED') {
        errorMessage = 'Access Token 已過期，請重新授權商店'
        errorCode = 'TOKEN_EXPIRED'
      } else if (err.response?.data?.code === 'AUTH_FAILED' || err.response?.data?.error === 'AUTHENTICATION_FAILED') {
        errorMessage = err.response.data.message || '認證失敗'
        errorCode = 'AUTH_FAILED'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      console.error('Subscribe webhook error details:', err)
      setError(new Error(errorMessage))
      return { success: false, error: errorMessage, code: errorCode }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    subscribe,
    isLoading,
    error
  }
}

