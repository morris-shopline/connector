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
      const errorMessage = err.response?.data?.error || err.message || '取消訂閱失敗'
      setError(new Error(errorMessage))
      return { success: false, error: errorMessage }
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

