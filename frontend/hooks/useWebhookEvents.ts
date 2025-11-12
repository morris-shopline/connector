import useSWR from 'swr'
import { apiClient } from '../lib/api'

// Story 5.3.1: 支援 connectionId 參數，確保只顯示當前 Connection 的事件
export function useWebhookEvents(connectionId?: string | null) {
  const swrKey = connectionId ? `webhook-events-${connectionId}` : 'webhook-events'
  
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    swrKey,
    () => apiClient.getWebhookEvents(connectionId || undefined).then(res => res.data || []),
    {
      refreshInterval: 10000, // 10秒自動刷新
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  )

  return {
    events: data || [],
    isLoading,
    isError: error,
    mutate
  }
}
