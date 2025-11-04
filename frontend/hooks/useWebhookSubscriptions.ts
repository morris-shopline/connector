import useSWR from 'swr'
import { apiClient } from '../lib/api'

export function useWebhookSubscriptions(handle: string | null) {
  const { data, error, isLoading, mutate } = useSWR<any>(
    handle ? `webhook-subscriptions-${handle}` : null,
    async () => {
      if (!handle) return null
      try {
        const res = await apiClient.getWebhookSubscriptions(handle)
        return res.data
      } catch (err: any) {
        // 檢查是否為 Token 過期錯誤
        if (err.response?.data?.code === 'TOKEN_EXPIRED' || err.response?.data?.error === 'ACCESS_TOKEN_EXPIRED') {
          // 返回特殊錯誤，讓頁面可以顯示
          throw new Error('TOKEN_EXPIRED: Access Token 已過期，請重新授權商店')
        }
        throw err
      }
    },
    {
      refreshInterval: 10000, // 10秒自動刷新
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      onError: (err) => {
        // 如果是 Token 過期，不顯示錯誤（將在頁面顯示友好訊息）
        if (err.message?.includes('TOKEN_EXPIRED')) {
          console.warn('Token expired, user should re-authorize')
        }
      }
    }
  )

  // 檢查是否為 Token 過期錯誤
  const isTokenExpired = error?.message?.includes('TOKEN_EXPIRED')

  return {
    subscriptions: data?.webhooks || [],
    isLoading,
    isError: error && !isTokenExpired, // Token 過期不算一般錯誤
    isTokenExpired,
    tokenExpiredMessage: isTokenExpired ? 'Access Token 已過期，請重新授權商店' : null,
    mutate
  }
}

