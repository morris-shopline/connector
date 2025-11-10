import { useState } from 'react'
import { apiClient } from '../lib/api'
import { ProductListParams, CreateProductInput, OrderListParams, CreateOrderInput } from '../types'
import { useStoreStore } from '../stores/useStoreStore'

type AdminApiContext = {
  handle: string | null
  connectionItemId: string | null
}

export function useAdminAPI({ handle, connectionItemId }: AdminApiContext) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // ✅ 標準做法：直接訂閱 Actions（它們是穩定的）
  const lockConnectionItem = useStoreStore((state) => state.lockConnectionItem)
  const unlockConnectionItem = useStoreStore((state) => state.unlockConnectionItem)

  const resolveContext = () => {
    const state = useStoreStore.getState()
    const resolvedHandle = handle ?? null
    const resolvedConnectionItemId =
      state.lockedConnectionItemId ?? connectionItemId ?? state.selectedConnectionItemId

    if (!resolvedHandle) {
      throw new Error('Handle is required')
    }

    if (!resolvedConnectionItemId) {
      throw new Error('Connection item id is required')
    }

    return {
      resolvedHandle,
      resolvedConnectionItemId,
    }
  }

  const lockConnectionForOperation = (): { handle: string } => {
    const { resolvedHandle, resolvedConnectionItemId } = resolveContext()
    lockConnectionItem(resolvedConnectionItemId)
    return { handle: resolvedHandle }
  }

  const unlockConnectionForOperation = () => {
    unlockConnectionItem()
  }

  const getStoreInfo = async () => {
    // 鎖定 connection item，確保整個操作使用同一個來源
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.getStoreInfo(currentHandle)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '取得商店資訊失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const getProducts = async (params?: ProductListParams) => {
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.getProducts(currentHandle, params)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '取得產品列表失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const getProduct = async (productId: string) => {
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.getProduct(currentHandle, productId)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '取得產品失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const createProduct = async (productData?: CreateProductInput) => {
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.createProduct(currentHandle, productData)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '建立產品失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const getOrders = async (params?: OrderListParams) => {
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.getOrders(currentHandle, params)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '取得訂單列表失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const createOrder = async (orderData?: CreateOrderInput) => {
    // 多步驟操作：鎖定 handle，確保整個流程使用同一個 handle
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 整個 createOrder 流程（包括後端的 getProducts, getLocations）都使用同一個 handle
      const result = await apiClient.createOrder(currentHandle, orderData)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '建立訂單失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  const getLocations = async () => {
    const { handle: currentHandle } = lockConnectionForOperation()
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiClient.getLocations(currentHandle)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '取得 Locations 失敗'
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
      unlockConnectionForOperation()
    }
  }

  return {
    getStoreInfo,
    getProducts,
    getProduct,
    createProduct,
    getOrders,
    createOrder,
    getLocations,
    isLoading,
    error
  }
}

