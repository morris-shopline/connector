import { useState, useRef } from 'react'
import { apiClient } from '../lib/api'
import { ProductListParams, CreateProductInput, OrderListParams, CreateOrderInput } from '../types'

export function useAdminAPI(handle: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // 鎖定 handle：確保整個操作流程使用同一個 handle，避免操作進行中時 handle 改變
  const lockedHandleRef = useRef<string | null>(null)
  
  // 獲取當前有效的 handle（優先使用鎖定的 handle）
  const getCurrentHandle = (): string => {
    if (lockedHandleRef.current) {
      return lockedHandleRef.current
    }
    if (!handle) {
      throw new Error('Handle is required')
    }
    return handle
  }
  
  // 鎖定 handle（操作開始時）
  const lockHandle = (): string => {
    if (!handle) {
      throw new Error('Handle is required')
    }
    lockedHandleRef.current = handle
    return handle
  }
  
  // 解鎖 handle（操作完成時）
  const unlockHandle = () => {
    lockedHandleRef.current = null
  }

  const getStoreInfo = async () => {
    // 鎖定 handle，確保整個操作使用同一個 handle
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const getProducts = async (params?: ProductListParams) => {
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const getProduct = async (productId: string) => {
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const createProduct = async (productData?: CreateProductInput) => {
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const getOrders = async (params?: OrderListParams) => {
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const createOrder = async (orderData?: CreateOrderInput) => {
    // 多步驟操作：鎖定 handle，確保整個流程使用同一個 handle
    const currentHandle = lockHandle()
    
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
      unlockHandle()
    }
  }

  const getLocations = async () => {
    const currentHandle = lockHandle()
    
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
      unlockHandle()
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

