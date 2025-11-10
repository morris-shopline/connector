import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import type { ParsedUrlQuery } from 'querystring'
import { useStoreStore } from '../stores/useStoreStore'
import {
  clearConnectionCache,
  loadConnectionCache,
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

export type UseInitConnectionFromURLOptions = {
  resolveConnectionItem?: ConnectionResolver
}

/**
 * ✅ 正確：URL → 初始化一次 Zustand（單向，只做一次）
 * 
 * 這個 hook 應該放在 Layout / _app.tsx 層級，只在 app 首次載入時執行一次。
 * 頁面切換時不會重新執行，避免 initializedRef 重置造成的循環問題。
 */
export const useInitConnectionFromURL = (options?: UseInitConnectionFromURLOptions) => {
  const router = useRouter()
  const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
  const initializedRef = useRef(false) // 追蹤是否已初始化（整個 app 生命週期只執行一次）

  useEffect(() => {
    // ✅ 確保只在客戶端執行（避免 SSR 問題）
    if (typeof window === 'undefined') {
      return
    }

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
            console.log('[useInitConnectionFromURL] Zustand already has state, skip cache restore')
          }
          return
        }

        // Zustand 沒有狀態，嘗試從 cache 恢復（只在客戶端）
        try {
          const cached = loadConnectionCache()
          if (cached) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[useInitConnectionFromURL] using cache', cached)
            }
            setSelectedConnection({
              platform: cached.platform,
              connectionId: cached.connectionId,
              connectionItemId: cached.connectionItemId,
            })
          }
        } catch (error) {
          // localStorage 可能不可用（例如 SSR 或隱私模式）
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[useInitConnectionFromURL] Failed to load cache:', error)
          }
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
          console.log('[useInitConnectionFromURL] Zustand already matches URL, skip update')
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
          console.log('[useInitConnectionFromURL] resolved', { parsed, resolved })
        }

        // ✅ 只更新 Zustand，不更新 URL（單向初始化）
        setSelectedConnection({
          platform: resolved.platform,
          connectionId: resolved.connectionId,
          connectionItemId: resolved.connectionItemId,
        })
      } catch (error) {
        console.error('[useInitConnectionFromURL] error:', error)
      }
    }

    initializeFromUrl()
    // ✅ 只依賴 router.isReady，不依賴 router.query（避免閉包問題和重複執行）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])
}

