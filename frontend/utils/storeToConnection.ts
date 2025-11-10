/**
 * Store 到 Connection 的映射工具（過渡期）
 * 
 * 說明：
 * - R1.1 在前端使用了新的 Connection 欄位（platform、connectionId、connectionItemId）
 * - 但後端 API 和資料庫還沒有這些欄位（R3.0 才會建立）
 * - 此工具函數提供過渡期的映射邏輯
 * 
 * TODO: R3.0 完成後，後端 API 會直接回傳 Connection 結構，此映射邏輯可以移除
 */

import type { StoreInfo } from '../types'
import type { ConnectionParams } from '../hooks/useConnection'

/**
 * 將舊的 StoreInfo 映射為新的 ConnectionParams
 * 
 * 映射規則（過渡期）：
 * - platform: 硬編碼為 'shopline'（R3.0 後會從 store.platform 取得）
 * - connectionId: 使用 shoplineId，fallback 到 id
 * - connectionItemId: 使用 id，fallback 到 shoplineId
 */
export function mapStoreToConnection(store: StoreInfo): ConnectionParams {
  return {
    platform: 'shopline', // 過渡期：硬編碼，R3.0 後從 store.platform 取得
    connectionId: store.shoplineId ?? store.id ?? null,
    connectionItemId: store.id ?? store.shoplineId ?? null,
  }
}

/**
 * 從 stores 陣列中根據 connectionItemId 找到對應的 StoreInfo
 */
export function findStoreByConnectionItemId(
  stores: StoreInfo[],
  connectionItemId: string | null
): StoreInfo | null {
  if (!connectionItemId) {
    return null
  }

  return (
    stores.find(
      (store) => store.id === connectionItemId || store.shoplineId === connectionItemId
    ) ?? null
  )
}

/**
 * 從 stores 陣列中根據 connectionId 找到對應的 StoreInfo
 */
export function findStoreByConnectionId(
  stores: StoreInfo[],
  connectionId: string | null
): StoreInfo | null {
  if (!connectionId) {
    return null
  }

  return (
    stores.find(
      (store) => store.shoplineId === connectionId || store.id === connectionId
    ) ?? null
  )
}

/**
 * 從 stores 陣列中根據 handle 找到對應的 StoreInfo（向後相容）
 */
export function findStoreByHandle(
  stores: StoreInfo[],
  handle: string | null
): StoreInfo | null {
  if (!handle) {
    return null
  }

  return (
    stores.find(
      (store) => store.handle === handle || store.shoplineId === handle || store.id === handle
    ) ?? null
  )
}

/**
 * 取得預設的 Connection（用於登入後自動選擇）
 */
export function getDefaultConnection(stores: StoreInfo[]): ConnectionParams | null {
  if (stores.length === 0) {
    return null
  }

  return mapStoreToConnection(stores[0])
}

