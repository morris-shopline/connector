import { useState } from 'react'
import { apiClient } from '../lib/api'
import { ProductListParams, CreateProductInput, OrderListParams, CreateOrderInput } from '../types'
import { useStoreStore } from '../stores/useStoreStore'

export function useAdminAPI(handle: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // 使用 Zustand Store 的 lock/unlock 功能
  const { lockHandle, unlockHandle } = useStoreStore()
  
  // 獲取當前有效的 handle（優先使用鎖定的 handle）
  const getCurrentHandle = (): string => {
    const { lockedHandle, selectedHandle } = useStoreStore.getState()
    if (lockedHandle) {
      return lockedHandle
    }
    if (!handle && !selectedHandle) {
      throw new Error('Handle is required')
    }
    return handle || selectedHandle || ''
  }
  
  // 鎖定 handle（操作開始時）
  const lockHandleForOperation = (): string => {
    const currentHandle = handle || useStoreStore.getState().selectedHandle
    if (!currentHandle) {
      throw new Error('Handle is required')
    }
    lockHandle(currentHandle)
    return currentHandle
  }
  
  // 解鎖 handle（操作完成時）
  const unlockHandleForOperation = () => {
    unlockHandle()
  }

  const getStoreInfo = async () => {
    // 鎖定 handle，確保整個操作使用同一個 handle
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const getProducts = async (params?: ProductListParams) => {
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const getProduct = async (productId: string) => {
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const createProduct = async (productData?: CreateProductInput) => {
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const getOrders = async (params?: OrderListParams) => {
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const createOrder = async (orderData?: CreateOrderInput) => {
    // 多步驟操作：鎖定 handle，確保整個流程使用同一個 handle
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
    }
  }

  const getLocations = async () => {
    const currentHandle = lockHandleForOperation()
    
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
      unlockHandleForOperation()
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

