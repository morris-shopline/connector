import { useState } from 'react'
import { apiClient } from '../lib/api'

export function useUnsubscribeWebhook() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const unsubscribe = async (webhookId: string, handle: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.unsubscribeWebhook(webhookId, handle)
      return { success: true, data: result.data }
    } catch (err: any) {
      // 處理各種錯誤情況
      let errorMessage = '取消訂閱失敗'
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
      
      console.error('Unsubscribe webhook error details:', err)
      setError(new Error(errorMessage))
      return { success: false, error: errorMessage, code: errorCode }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    unsubscribe,
    isLoading,
    error
  }
}

