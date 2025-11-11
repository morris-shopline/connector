/**
 * useAuditLogs Hook
 * 
 * Story 4.3: 從後端 API 讀取審計記錄
 */

import useSWR from 'swr'
import api from '../lib/api'

export interface AuditLog {
  id: string
  userId: string
  connectionId: string | null
  connectionItemId: string | null
  operation: string
  result: 'success' | 'error'
  errorCode: string | null
  errorMessage: string | null
  metadata: Record<string, any> | null
  createdAt: string
  user?: {
    id: string
    email: string
    name: string | null
  }
  connection?: {
    id: string
    displayName: string | null
    externalAccountId: string
  }
  connectionItem?: {
    id: string
    displayName: string | null
    externalResourceId: string
  }
}

interface AuditLogsResponse {
  success: boolean
  data: AuditLog[]
}

const fetcher = async (url: string): Promise<AuditLog[]> => {
  try {
    const response = await api.get<AuditLogsResponse>(url)
    if (response.data.success) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * 取得所有審計記錄（用於 Activity Dock）
 */
export function useAuditLogs(limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR<AuditLog[]>(
    `/api/audit-logs?limit=${limit}`,
    fetcher,
    {
      refreshInterval: 5000, // 每 5 秒自動刷新
      revalidateOnFocus: true,
    }
  )

  return {
    logs: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * 取得指定 Connection 的審計記錄
 */
export function useConnectionAuditLogs(connectionId: string | null, limit: number = 50) {
  const { data, error, isLoading, mutate } = useSWR<AuditLog[]>(
    connectionId ? `/api/connections/${connectionId}/logs?limit=${limit}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  )

  return {
    logs: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

