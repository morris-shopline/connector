import useSWR from 'swr'
import { apiClient } from '../lib/api'

export function useWebhookEvents() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    'webhook-events',
    () => apiClient.getWebhookEvents().then(res => res.data || []),
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
