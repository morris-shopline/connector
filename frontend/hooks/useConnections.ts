/**
 * useConnections Hook
 * 
 * R3.0/R3.1: 取得使用者的所有 Connection 及底下項目
 * 
 * 提供方法：
 * - connections: Connection 列表
 * - isLoading: 載入狀態
 * - isError: 錯誤狀態
 * - mutate: 重新取得資料
 */

import useSWR from 'swr'
import { apiClient } from '../lib/api'

export interface ConnectionItem {
  id: string
  platform: string
  externalResourceId: string
  displayName: string | null
  metadata: Record<string, any> | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Connection {
  id: string
  userId: string
  platform: string
  externalAccountId: string
  displayName: string | null
  authPayload: Record<string, any>
  status: string
  createdAt: Date
  updatedAt: Date
  connectionItems: ConnectionItem[]
}

export function useConnections() {
  const { data, error, isLoading, mutate } = useSWR<Connection[]>(
    'connections',
    async () => {
      const response = await apiClient.getConnections()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch connections')
      }
      return response.data || []
    },
    {
      refreshInterval: 30000, // 30秒自動刷新
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10秒內不重複請求
    }
  )

  return {
    connections: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

