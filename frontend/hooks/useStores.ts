import useSWR from 'swr'
import { apiClient } from '../lib/api'
import { StoreInfo } from '@/types'

export function useStores() {
  const { data, error, isLoading, mutate } = useSWR<StoreInfo[]>(
    'stores',
    () => apiClient.getStores().then(res => res.data || []),
    {
      refreshInterval: 30000, // 30秒自動刷新
      revalidateOnFocus: true,
      dedupingInterval: 10000 // 10秒內不重複請求
    }
  )

  return {
    stores: data || [],
    isLoading,
    isError: error,
    mutate
  }
}

export function useStore(shopId: string) {
  const { data, error, isLoading, mutate } = useSWR<StoreInfo>(
    shopId ? `store-${shopId}` : null,
    () => apiClient.getStore(shopId).then(res => res.data),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  return {
    store: data,
    isLoading,
    isError: error,
    mutate
  }
}
