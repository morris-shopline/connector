import useSWR from 'swr'
import { apiClient } from '../lib/api'

export function useWebhookSubscriptions(handle: string | null) {
  const { data, error, isLoading, mutate } = useSWR<any>(
    handle ? `webhook-subscriptions-${handle}` : null,
    () => handle ? apiClient.getWebhookSubscriptions(handle).then(res => res.data) : null,
    {
      refreshInterval: 10000, // 10秒自動刷新
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  )

  return {
    subscriptions: data?.webhooks || [],
    isLoading,
    isError: error,
    mutate
  }
}

