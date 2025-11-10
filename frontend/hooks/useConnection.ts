import { useCallback, useMemo } from 'react'
import { useStoreStore } from '../stores/useStoreStore'
import {
  clearConnectionCache,
  saveConnectionCache,
} from '../utils/connectionCache'

export type ConnectionParams = {
  platform: string | null
  connectionId: string | null
  connectionItemId: string | null
}

/**
 * ✅ 標準 Zustand 用法：直接訂閱值，Actions 直接使用
 * 
 * 這個 hook 可以在任何頁面組件中使用，用來讀取和設置 Connection 狀態。
 * 初始化應該由 `useInitConnectionFromURL` 在 Layout 層級處理。
 */
export const useConnection = () => {
  // ✅ 標準做法：直接訂閱單個值（Zustand 會自動優化，只在值改變時重新渲染）
  const selectedPlatform = useStoreStore((state) => state.selectedPlatform)
  const selectedConnectionId = useStoreStore((state) => state.selectedConnectionId)
  const selectedConnectionItemId = useStoreStore((state) => state.selectedConnectionItemId)
  
  // ✅ Actions 直接從 store 獲取（它們是穩定的）
  const setSelectedConnection = useStoreStore((state) => state.setSelectedConnection)
  const resetState = useStoreStore((state) => state.resetState)

  // ✅ 組合值使用 useMemo（只在值改變時重新計算）
  const currentConnection = useMemo<ConnectionParams>(
    () => ({
      platform: selectedPlatform,
      connectionId: selectedConnectionId,
      connectionItemId: selectedConnectionItemId,
    }),
    [selectedPlatform, selectedConnectionId, selectedConnectionItemId]
  )

  // ✅ 包裝的函數使用 useCallback 保持穩定（Actions 是穩定的，但包裝函數需要 useCallback）
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

  // ✅ 使用 useMemo 包裝返回對象，確保引用穩定（避免依賴此 hook 的 useMemo 無限循環）
  return useMemo(
    () => ({
      currentConnection,
      applyConnection,
      resetConnection,
    }),
    [currentConnection, applyConnection, resetConnection]
  )
}

