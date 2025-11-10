import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useStores } from '../hooks/useStores'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { useStoreStore } from '../stores/useStoreStore'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useConnection, type ConnectionParams } from '../hooks/useConnection'
import type { StoreInfo } from '@/types'

type StoreLike = StoreInfo & {
  platform?: string | null
  connectionId?: string | null
  connectionItemId?: string | null
}

// API 功能定義
type ApiFunction = {
  name: string
  group: string
  method: string
  endpoint: (handle: string) => string
  hasBody: boolean
  requiresParam?: { name: string; label: string; type: string }
  bodyDescription?: string
}

const API_FUNCTIONS: Record<string, ApiFunction> = {
  // 商家
  getStoreInfo: {
    name: 'Get Store Info',
    group: 'store',
    method: 'GET',
    endpoint: (handle: string) => `/api/stores/${handle}/info`,
    hasBody: false
  },
  // 商品
  getProducts: {
    name: 'Get Products',
    group: 'products',
    method: 'GET',
    endpoint: (handle: string) => `/api/stores/${handle}/products`,
    hasBody: false
  },
  getProduct: {
    name: 'Get Product by ID',
    group: 'products',
    method: 'GET',
    endpoint: (handle: string) => `/api/stores/${handle}/products/:id`,
    hasBody: false,
    requiresParam: { name: 'productId', label: 'Product ID', type: 'text' }
  },
  createProduct: {
    name: 'Create Product',
    group: 'products',
    method: 'POST',
    endpoint: (handle: string) => `/api/stores/${handle}/products`,
    hasBody: true,
    bodyDescription: '自動生成隨機 handle 和預設值'
  },
  // 訂單
  getOrders: {
    name: 'Get Orders',
    group: 'orders',
    method: 'GET',
    endpoint: (handle: string) => `/api/stores/${handle}/orders`,
    hasBody: false
  },
  createOrder: {
    name: 'Create Order',
    group: 'orders',
    method: 'POST',
    endpoint: (handle: string) => `/api/stores/${handle}/orders`,
    hasBody: true,
    bodyDescription: '自動選擇隨機產品和 location_id'
  },
  // 庫存
  getLocations: {
    name: 'Get Locations',
    group: 'inventory',
    method: 'GET',
    endpoint: (handle: string) => `/api/stores/${handle}/locations`,
    hasBody: false
  }
}

const FUNCTION_GROUPS = {
  store: '商家',
  products: '商品',
  orders: '訂單',
  inventory: '庫存'
}

function AdminAPITest() {
  const router = useRouter()
  const lockedConnectionItemId = useStoreStore((state) => state.lockedConnectionItemId)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['store', 'products', 'orders', 'inventory']))
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBodyOpen, setIsBodyOpen] = useState<boolean>(false)
  const [isErrorOpen, setIsErrorOpen] = useState<boolean>(false)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  const { stores } = useStores()
  const mapStoreToConnection = useCallback((store: StoreLike): ConnectionParams => {
    const platform = store.platform ?? 'shopline'
    const connectionId = store.connectionId ?? store.shoplineId ?? store.id ?? null
    const connectionItem = store.connectionItemId ?? store.id ?? store.shoplineId ?? null

    return {
      platform,
      connectionId,
      connectionItemId: connectionItem,
    }
  }, [])

  const resolveConnectionItem = useCallback(
    (connectionItemId: string) => {
      const target = stores.find((store) => {
        if (!store) return false
        const enriched = store as StoreLike
        const candidateIds = [enriched.id, enriched.shoplineId, enriched.connectionItemId]
        return candidateIds.filter(Boolean).includes(connectionItemId)
      })

      if (!target) {
        return null
      }

      return mapStoreToConnection(target as StoreLike)
    },
    [stores, mapStoreToConnection]
  )

  const { currentConnection, applyConnection } = useConnection()

  const defaultConnection = useMemo(() => {
    if (!stores.length) {
      return null
    }
    return mapStoreToConnection(stores[0])
  }, [stores, mapStoreToConnection])

  // ⚠️ 移除自動設置 Connection 的邏輯（違反 State 分層原則）
  // 如果 URL 沒有 Connection 參數，應該顯示「請選擇商店」，不自動設置
  // useEffect(() => {
  //   if (!defaultConnection) {
  //     return
  //   }
  //   if (currentConnection.connectionItemId) {
  //     return
  //   }
  //   applyConnection(defaultConnection)
  // }, [applyConnection, currentConnection.connectionItemId, defaultConnection])

  const activeStore = useMemo(() => {
    return (
      stores.find((store) => {
        if (!store) return false
        const params = mapStoreToConnection(store)
        if (currentConnection.connectionItemId && params.connectionItemId === currentConnection.connectionItemId) {
          return true
        }
        if (currentConnection.connectionId && params.connectionId === currentConnection.connectionId) {
          return true
        }
        return false
      }) || null
    )
  }, [currentConnection.connectionId, currentConnection.connectionItemId, stores, mapStoreToConnection])

  const activeHandle = useMemo(
    () =>
      activeStore?.handle ||
      activeStore?.shoplineId ||
      currentConnection.connectionItemId ||
      currentConnection.connectionId ||
      null,
    [activeStore, currentConnection.connectionId, currentConnection.connectionItemId]
  )

  const activeConnectionItemId = useMemo(() => {
    if (activeStore) {
      return mapStoreToConnection(activeStore).connectionItemId ?? null
    }
    return currentConnection.connectionItemId ?? null
  }, [activeStore, currentConnection.connectionItemId, mapStoreToConnection])

  const adminAPI = useAdminAPI({
    handle: activeHandle,
    connectionItemId: activeConnectionItemId,
  })

  const handleStoreChange = async (newHandle: string | null) => {
    if (!newHandle) {
      await applyConnection({
        platform: null,
        connectionId: null,
        connectionItemId: null,
      })
          setResponse(null)
          setError(null)
          setSelectedFunction(null)
      return
    }

    const targetStore = stores.find((store) => {
      if (!store) return false
      return (
        store.handle === newHandle ||
        store.shoplineId === newHandle ||
        store.id === newHandle
      )
    })

    if (!targetStore) {
      return
    }

    const params = mapStoreToConnection(targetStore)

    if (
      lockedConnectionItemId &&
      params.connectionItemId &&
      lockedConnectionItemId !== params.connectionItemId
    ) {
      alert(`無法切換商店：${lockedConnectionItemId} 正在操作中，請等待操作完成`)
      return
    }
    
    await applyConnection(params)
    setResponse(null)
    setError(null)
    setSelectedFunction(null)
  }

  const toggleGroup = (group: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(group)) {
      newOpenGroups.delete(group)
    } else {
      newOpenGroups.add(group)
    }
    setOpenGroups(newOpenGroups)
  }

  const selectFunction = (funcKey: string) => {
    setSelectedFunction(funcKey)
    setResponse(null)
    setError(null)
    setIsBodyOpen(false)
    setIsErrorOpen(false)
  }

  const handleSubmit = async () => {
    if (!activeHandle || !selectedFunction) return

    setError(null)
    setResponse(null)
    setIsErrorOpen(false)

    const func = API_FUNCTIONS[selectedFunction]
    if (!func) return

    try {
      let result: any

      switch (selectedFunction) {
        case 'getStoreInfo':
          result = await adminAPI.getStoreInfo()
          break
        case 'getProducts':
          result = await adminAPI.getProducts()
          break
        case 'getProduct':
          if (!paramValues.productId) {
            setError('請輸入 Product ID')
            return
          }
          result = await adminAPI.getProduct(paramValues.productId)
          break
        case 'createProduct':
          result = await adminAPI.createProduct()
          break
        case 'getOrders':
          result = await adminAPI.getOrders()
          break
        case 'createOrder':
          result = await adminAPI.createOrder()
          break
        case 'getLocations':
          result = await adminAPI.getLocations()
          break
        default:
          setError('未知的功能')
          return
      }

      setResponse(result)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'API 呼叫失敗'
      setError(errorMessage)
      setIsErrorOpen(true)
    }
  }

  const currentFunction = selectedFunction ? API_FUNCTIONS[selectedFunction as keyof typeof API_FUNCTIONS] : null
  const endpoint = currentFunction && activeHandle
    ? currentFunction.endpoint(activeHandle).replace(':id', paramValues.productId || ':id')
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Store Selector & Toggle Menu */}
          <div className="lg:col-span-1 space-y-4">
            {/* Store Selector */}
            <div className="bg-white p-4 rounded-lg shadow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇商店
              </label>
              <select
                value={activeHandle || ''}
                onChange={(e) => {
                  handleStoreChange(e.target.value || null)
                }}
                disabled={!!lockedConnectionItemId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">請選擇商店</option>
                {stores.map(store => (
                  <option key={store.id} value={store.handle || store.shoplineId}>
                    {store.handle || store.shoplineId}
                  </option>
                ))}
              </select>
              {lockedConnectionItemId && (
                <p className="mt-2 text-xs text-yellow-600">
                  ⚠️ {lockedConnectionItemId} 正在操作中，無法切換商店
                </p>
              )}
            </div>

            {/* Toggle Menu */}
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              {Object.entries(FUNCTION_GROUPS).map(([groupKey, groupName]) => {
                const groupFunctions = Object.entries(API_FUNCTIONS).filter(
                  ([_, func]) => func.group === groupKey
                )
                const isOpen = openGroups.has(groupKey)

                return (
                  <div key={groupKey}>
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                    >
                      <span>{groupName}</span>
                      <span>{isOpen ? '▼' : '▶'}</span>
                    </button>
                    {isOpen && (
                      <div className="pl-4 space-y-1 mt-1">
                        {groupFunctions.map(([funcKey, func]) => (
                          <button
                            key={funcKey}
                            onClick={() => selectFunction(funcKey)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                              selectedFunction === funcKey
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            • {func.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Panel - Request & Response */}
          <div className="lg:col-span-2 space-y-4">
            {!activeHandle ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">請先選擇商店</p>
              </div>
            ) : !selectedFunction ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">請從左側選單選擇要測試的 API 功能</p>
              </div>
            ) : (
              <>
                {/* Request Panel */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    測試功能: {currentFunction?.name}
                  </h2>

                  <div className="space-y-4">
                    {/* Endpoint */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endpoint
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm">
                        {currentFunction?.method} {endpoint}
                      </div>
                    </div>

                    {/* Parameter Input (if needed) */}
                    {currentFunction?.requiresParam && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentFunction.requiresParam.label}
                        </label>
                        <input
                          type={currentFunction.requiresParam.type}
                          value={paramValues[currentFunction.requiresParam.name] || ''}
                          onChange={(e) => setParamValues({
                            ...paramValues,
                            [currentFunction.requiresParam!.name]: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`請輸入 ${currentFunction.requiresParam.label}`}
                        />
                      </div>
                    )}

                    {/* Body (Toggle) */}
                    {currentFunction?.hasBody && (
                      <div>
                        <button
                          onClick={() => setIsBodyOpen(!isBodyOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md"
                        >
                          <span>Body</span>
                          <span>{isBodyOpen ? '▼' : '▶'}</span>
                        </button>
                        {isBodyOpen && (
                          <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-xs text-gray-600 mb-2">
                              {currentFunction.bodyDescription || '請求 Body 內容'}
                            </p>
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                              {currentFunction.method === 'POST' && currentFunction.name === 'Create Product'
                                ? JSON.stringify({
                                    product: {
                                      handle: `shopline-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                                      title: 'Auto-generated Product',
                                      tags: ['test', 'api'],
                                      variants: [{
                                        sku: `T${Date.now()}`,
                                        price: '1000',
                                        required_shipping: true,
                                        taxable: true,
                                        inventory_tracker: true
                                      }],
                                      status: 'active',
                                      published_scope: 'web'
                                    }
                                  }, null, 2)
                                : currentFunction.method === 'POST' && currentFunction.name === 'Create Order'
                                ? JSON.stringify({
                                    order: {
                                      tags: 'API_Test',
                                      price_info: {
                                        total_shipping_price: '8.00'
                                      },
                                      line_items: [{
                                        location_id: '<auto>',
                                        price: '<auto>',
                                        quantity: 1,
                                        title: '<auto>',
                                        variant_id: '<auto>'
                                      }]
                                    },
                                    note: '系統會自動選擇隨機產品和 location_id'
                                  }, null, 2)
                                : '{}'
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 送出測試按鈕 */}
                    <button
                      onClick={handleSubmit}
                      disabled={!activeHandle || adminAPI.isLoading || (currentFunction.requiresParam && !paramValues[currentFunction.requiresParam.name])}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {adminAPI.isLoading ? '執行中...' : '送出測試'}
                    </button>
                  </div>
                </div>

                {/* Response Panel */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Response
                  </h2>

                  <div className="space-y-4">
                    {/* 錯誤訊息 (Toggle) */}
                    {error && (
                      <div>
                        <button
                          onClick={() => setIsErrorOpen(!isErrorOpen)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                        >
                          <span>錯誤訊息</span>
                          <span>{isErrorOpen ? '▼' : '▶'}</span>
                        </button>
                        {isErrorOpen && (
                          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 回應內容 (固定框, 溢出 scroll) */}
                    {response && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          回應內容
                        </label>
                        <div className="h-96 border border-gray-200 rounded-md bg-gray-50 overflow-auto">
                          <pre className="p-4 text-xs text-gray-800 whitespace-pre-wrap">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* 空狀態 */}
                    {!response && !error && (
                      <div className="text-center py-12 text-gray-500">
                        <p>點擊「送出測試」查看回應內容</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminAPITestPage() {
  return (
    <ProtectedRoute>
      <AdminAPITest />
    </ProtectedRoute>
  )
}
