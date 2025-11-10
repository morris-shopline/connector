import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import type { ParsedUrlQuery } from 'querystring'
import { useStoreStore } from '../stores/useStoreStore'
import {
  clearConnectionCache,
  loadConnectionCache,
  saveConnectionCache,
} from '../utils/connectionCache'

export type ConnectionParams = {
  platform: string | null
  connectionId: string | null
  connectionItemId: string | null
}

export type ResolveConnectionResult = {
  platform?: string | null
  connectionId?: string | null
  connectionItemId?: string | null
}

export type ConnectionResolver = (
  connectionItemId: string
) => Promise<ResolveConnectionResult | null> | ResolveConnectionResult | null

export const parseConnectionQuery = (query: ParsedUrlQuery): ConnectionParams => {
  const platform = typeof query.platform === 'string' ? query.platform : null
  const connectionId = typeof query.connectionId === 'string' ? query.connectionId : null
  const connectionItemId = typeof query.connectionItemId === 'string' ? query.connectionItemId : null

  return {
    platform,
    connectionId,
    connectionItemId,
  }
}

export const buildConnectionQuery = (params: ConnectionParams): Record<string, string> => {
  const result: Record<string, string> = {}

  if (params.platform) {
    result.platform = params.platform
  }

  if (params.connectionId) {
    result.connectionId = params.connectionId
  }

  if (params.connectionItemId) {
    result.connectionItemId = params.connectionItemId
  }

  return result
}

export type UseConnectionRoutingOptions = {
  resolveConnectionItem?: ConnectionResolver
}

// 保留 ApplyConnectionOptions 類型以保持向後兼容，但現階段不使用
export type ApplyConnectionOptions = {
  shallow?: boolean
  scroll?: boolean
}

export const useConnectionRouting = (options?: UseConnectionRoutingOptions) => {
  const router = useRouter()
  const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
  const resetState = useStoreStore((state) => state.resetState)
  const initializedRef = useRef(false) // 追蹤是否已初始化（只做一次）

  // ✅ 正確：URL → 初始化一次 Zustand（單向，只做一次）
  // 這不會造成 Dual Source of Truth，因為：
  // 1. 只依賴 router.isReady（不依賴 router.query，避免閉包問題）
  // 2. 使用 initializedRef 確保只執行一次
  // 3. 單向：URL → Zustand，不會回寫 URL
  // 4. 檢查 Zustand 狀態，避免不必要的更新
  useEffect(() => {
    if (!router.isReady || initializedRef.current) {
      return
    }

    initializedRef.current = true

    const initializeFromUrl = async () => {
      // 讀取 URL query（只在初始化時讀取一次）
      const parsed = parseConnectionQuery(router.query)
      const isParsedEmpty = !parsed.platform && !parsed.connectionId && !parsed.connectionItemId

      // 先檢查當前 Zustand 狀態
      const currentState = useStoreStore.getState()

      if (isParsedEmpty) {
        // URL 沒有 Connection 參數
        // 如果 Zustand 已有狀態，不需要從 cache 恢復（用戶已經選擇了）
        if (
          currentState.selectedPlatform !== null ||
          currentState.selectedConnectionId !== null ||
          currentState.selectedConnectionItemId !== null
        ) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[useConnectionRouting] initializeFromUrl: Zustand already has state, skip cache restore')
          }
          return
        }

        // Zustand 沒有狀態，嘗試從 cache 恢復
        const cached = loadConnectionCache()
        if (cached) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[useConnectionRouting] initializeFromUrl: using cache', cached)
          }
          setSelectedConnection({
            platform: cached.platform,
            connectionId: cached.connectionId,
            connectionItemId: cached.connectionItemId,
          })
        }
        return
      }

      // URL 有 Connection 參數，解析並初始化 Zustand
      // 檢查是否與當前狀態相同，避免不必要的更新
      if (
        currentState.selectedPlatform === (parsed.platform ?? null) &&
        currentState.selectedConnectionId === (parsed.connectionId ?? null) &&
        currentState.selectedConnectionItemId === (parsed.connectionItemId ?? null)
      ) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[useConnectionRouting] initializeFromUrl: Zustand already matches URL, skip update')
        }
        return
      }

      try {
        let resolved = parsed

        // 如果需要解析缺失的參數
        if (options?.resolveConnectionItem && parsed.connectionItemId && (!parsed.platform || !parsed.connectionId)) {
          const resolvedResult = await options.resolveConnectionItem(parsed.connectionItemId)
          if (resolvedResult) {
            resolved = {
              platform: resolvedResult.platform ?? parsed.platform ?? null,
              connectionId: resolvedResult.connectionId ?? parsed.connectionId ?? null,
              connectionItemId: resolvedResult.connectionItemId ?? parsed.connectionItemId ?? null,
            }
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log('[useConnectionRouting] initializeFromUrl: resolved', { parsed, resolved })
        }

        // ✅ 只更新 Zustand，不更新 URL（單向初始化）
        setSelectedConnection({
          platform: resolved.platform,
          connectionId: resolved.connectionId,
          connectionItemId: resolved.connectionItemId,
        })
      } catch (error) {
        console.error('[useConnectionRouting] initializeFromUrl error:', error)
      }
    }

    initializeFromUrl()
    // ✅ 只依賴 router.isReady，不依賴 router.query（避免閉包問題和重複執行）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  // 用戶操作：只更新 Zustand（不更新 URL）
  // Zustand 是唯一的 Source of Truth，URL 不參與狀態管理
  const applyConnection = useCallback(
    (params: ConnectionParams) => {
      // 1. 更新 Zustand（Source of Truth）
      setSelectedConnection({
        platform: params.platform,
        connectionId: params.connectionId,
        connectionItemId: params.connectionItemId,
      })

      // 2. 保存到 cache（刷新頁面時恢復）
      if (params.connectionItemId) {
        saveConnectionCache({
          platform: params.platform,
          connectionId: params.connectionId,
          connectionItemId: params.connectionItemId,
        })
      } else {
        clearConnectionCache()
      }
    },
    [setSelectedConnection]
  )

  const resetConnection = useCallback(() => {
    resetState()
    clearConnectionCache()
  }, [resetState])

  const selectedPlatform = useStoreStore((state) => state.selectedPlatform)
  const selectedConnectionId = useStoreStore((state) => state.selectedConnectionId)
  const selectedConnectionItemId = useStoreStore((state) => state.selectedConnectionItemId)

  const currentConnection = useMemo<ConnectionParams>(
    () => ({
      platform: selectedPlatform,
      connectionId: selectedConnectionId,
      connectionItemId: selectedConnectionItemId,
    }),
    [selectedPlatform, selectedConnectionId, selectedConnectionItemId]
  )

  return {
    currentConnection,
    applyConnection,
    resetConnection,
  }
}
