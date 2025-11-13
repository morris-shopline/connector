import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAdminAPI } from '../hooks/useAdminAPI'
import { useStoreStore } from '../stores/useStoreStore'
import { PrimaryLayout } from '../components/layout/PrimaryLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useSelectedConnection } from '../hooks/useSelectedConnection'
import { useConnectionStore } from '../stores/useConnectionStore'
import { ConnectionSelectorDropdown } from '../components/connections/ConnectionSelectorDropdown'
import { getPlatformApiConfig, type PlatformApiConfig, type ApiGroup, type ApiFunction as ConfigApiFunction } from '../content/platforms/api-configs'
import { apiClient } from '../lib/api'

// 舊的 API 功能定義（保留用於 Shopline，待遷移）
type LegacyApiFunction = {
  name: string
  group: string
  method: string
  endpoint: (handle: string) => string
  hasBody: boolean
  requiresParam?: { name: string; label: string; type: string }
  bodyDescription?: string
}

// Shopline API 功能（舊版，待遷移到設定檔）
const SHOPLINE_API_FUNCTIONS: Record<string, LegacyApiFunction> = {
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

// 舊的 FUNCTION_GROUPS（保留用於 Shopline fallback）
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
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBodyOpen, setIsBodyOpen] = useState<boolean>(false)
  const [isErrorOpen, setIsErrorOpen] = useState<boolean>(false)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [defaultNeProductCode, setDefaultNeProductCode] = useState<string | null>(null)
  const [lastExecutedFunction, setLastExecutedFunction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Story 5.3.1: 跟隨 Context Bar 的 selectedConnectionId
  const { selectedConnection, connectionId, handle: selectedHandle, connectionItemId: selectedConnectionItemId } = useSelectedConnection()

  const activeHandle = selectedHandle || null
  const activeConnectionItemId = selectedConnectionItemId || null

  // 根據 platform 選擇 API 設定檔
  const apiConfig: PlatformApiConfig | null = useMemo(() => {
    const platform = selectedConnection?.platform as 'shopline' | 'next-engine' | undefined
    const config = getPlatformApiConfig(platform)
    // 自動展開所有 groups
    if (config && openGroups.size === 0) {
      setOpenGroups(new Set(config.groups.map(g => g.id)))
    }
    return config
  }, [selectedConnection?.platform, openGroups.size])

  // 將設定檔轉換為舊格式（暫時相容）
  const API_FUNCTIONS = useMemo(() => {
    if (!apiConfig) {
      return SHOPLINE_API_FUNCTIONS // fallback
    }

    // 將設定檔轉換為舊格式
    const functions: Record<string, any> = {}
    apiConfig.groups.forEach((group: ApiGroup) => {
      group.functions.forEach((func: ConfigApiFunction) => {
        functions[func.id] = {
          name: func.name,
          group: func.group,
          method: func.method,
          endpoint: func.endpoint,
          hasBody: func.hasBody,
          requiresParam: func.requiresParam,
          bodyDescription: func.bodyDescription,
          paramConfig: func.paramConfig // 保留 paramConfig
        }
      })
    })
    return functions
  }, [apiConfig])

  // 取得當前選中的 API 函數配置
  const currentApiFunction = useMemo(() => {
    if (!apiConfig || !selectedFunction) return null
    for (const group of apiConfig.groups) {
      const func = group.functions.find(f => f.id === selectedFunction)
      if (func) return func
    }
    return null
  }, [apiConfig, selectedFunction])

  const adminAPI = useAdminAPI({
    handle: activeHandle,
    connectionItemId: activeConnectionItemId,
  })

  const toggleGroup = (group: string) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(group)) {
      newOpenGroups.delete(group)
    } else {
      newOpenGroups.add(group)
    }
    setOpenGroups(newOpenGroups)
  }

  const fetchFirstNextEngineProduct = useCallback(async () => {
    if (selectedConnection?.platform !== 'next-engine' || !connectionId) {
      setDefaultNeProductCode(null)
      return
    }

    try {
      const result = await apiClient.searchGoods(connectionId, {
        fields: 'goods_id',
        offset: '0',
        limit: '1'
      })

      if (result?.success) {
        const first =
          result.data?.data?.[0]?.goods_id ||
          result.data?.data?.[0]?.goodsId ||
          result.data?.data?.[0]?.goodsCode ||
          null
        setDefaultNeProductCode(first || null)
      } else {
        setDefaultNeProductCode(null)
      }
    } catch (fetchError) {
      console.error('Failed to fetch default Next Engine product code:', fetchError)
      setDefaultNeProductCode(null)
    }
  }, [connectionId, selectedConnection?.platform])

  useEffect(() => {
    fetchFirstNextEngineProduct()
  }, [fetchFirstNextEngineProduct])

  useEffect(() => {
    if (
      selectedConnection?.platform === 'next-engine' &&
      connectionId &&
      lastExecutedFunction === 'neUploadGoods' &&
      response
    ) {
      fetchFirstNextEngineProduct()
    }
  }, [response, lastExecutedFunction, selectedConnection?.platform, connectionId, fetchFirstNextEngineProduct])

  useEffect(() => {
    if (
      selectedConnection?.platform === 'next-engine' &&
      selectedFunction === 'neUpdateWarehouseStock' &&
      defaultNeProductCode &&
      (!paramValues.productCode || paramValues.productCode.trim().length === 0)
    ) {
      setParamValues((prev) => ({
        ...prev,
        productCode: defaultNeProductCode
      }))
    }
  }, [defaultNeProductCode, selectedConnection?.platform, selectedFunction, paramValues.productCode])

  const selectFunction = (funcKey: string) => {
    setSelectedFunction(funcKey)
    setResponse(null)
    setError(null)
    setIsBodyOpen(false)
    setIsErrorOpen(false)
    setLastExecutedFunction(null)

    if (selectedConnection?.platform === 'next-engine' && funcKey === 'neUpdateWarehouseStock') {
      setParamValues({
        productCode: defaultNeProductCode || '',
        newStock: '10',
        warehouseId: '0'
      })
    } else {
      setParamValues({})
    }
  }

  const handleSubmit = async () => {
    if (!selectedConnection || !selectedFunction) return

    setError(null)
    setResponse(null)
    setIsErrorOpen(false)
    setIsLoading(true)

    const func = API_FUNCTIONS[selectedFunction]
    if (!func) {
      setError('未知的功能')
      setIsLoading(false)
      return
    }

    try {
      setLastExecutedFunction(selectedFunction)
      let result: any

      // Next Engine API 呼叫（使用統一的 apiClient，與 Shopline 一致）
      if (selectedConnection.platform === 'next-engine') {
        if (!connectionId) {
          setError('請先選擇一個 Connection')
          setIsLoading(false)
          return
        }

        switch (selectedFunction) {
          case 'neSearchShops': {
            result = await apiClient.searchShops(
              connectionId,
              paramValues.fields || 'shop_id,shop_name,shop_abbreviated_name,shop_note'
            )
            break
          }
          case 'neCreateShop': {
            if (!paramValues.xmlData) {
              setError('請輸入 XML 資料')
              setIsLoading(false)
              return
            }
            result = await apiClient.createShop(connectionId, paramValues.xmlData)
            break
          }
          case 'neSearchGoods': {
            result = await apiClient.searchGoods(connectionId, {
              fields: paramValues.fields || 'goods_id,goods_name,stock_quantity,supplier_name',
              offset: paramValues.offset || '0',
              limit: paramValues.limit || '100',
              goods_id_eq: paramValues.goods_id_eq
            })
            break
          }
          case 'neUploadGoods': {
            // 優先使用動態參數，若未提供則使用 CSV
            if (paramValues.productCode || paramValues.productName || paramValues.price || paramValues.cost) {
              result = await apiClient.uploadGoods(connectionId, {
                productCode: paramValues.productCode,
                productName: paramValues.productName,
                price: paramValues.price ? parseInt(paramValues.price) : undefined,
                cost: paramValues.cost ? parseInt(paramValues.cost) : undefined
              })
            } else if (paramValues.csvData) {
              result = await apiClient.uploadGoods(connectionId, { csvData: paramValues.csvData })
            } else {
              // 都不提供時，使用動態模式（不傳參數）
              result = await apiClient.uploadGoods(connectionId)
            }
            break
          }
          case 'neGetMasterStock': {
            result = await apiClient.getMasterStock(connectionId, paramValues.productCode)
            break
          }
          case 'neGetWarehouseStock': {
            {
              const warehouseId = paramValues.warehouseId && paramValues.warehouseId.trim().length > 0
                ? paramValues.warehouseId
                : '0'
              result = await apiClient.getWarehouseStock(connectionId, warehouseId, paramValues.productCode)
            }
            break
          }
          case 'neGetWarehouses': {
            result = await apiClient.getWarehouses(connectionId)
            break
          }
          case 'neUpdateWarehouseStock': {
            const resolvedProductCode =
              (paramValues.productCode && paramValues.productCode.trim()) ||
              defaultNeProductCode ||
              ''

            if (!resolvedProductCode) {
              setError('尚未找到可用的商品，請先建立商品後再更新庫存')
              setIsLoading(false)
              return
            }

            const resolvedNewStock =
              paramValues.newStock && paramValues.newStock.trim().length > 0
                ? paramValues.newStock.trim()
                : '10'

            const parsedNewStock = parseInt(resolvedNewStock, 10)
            if (Number.isNaN(parsedNewStock)) {
              setError('New Stock 必須為數字')
              setIsLoading(false)
              return
            }

            const warehouseId = paramValues.warehouseId && paramValues.warehouseId.trim().length > 0
              ? paramValues.warehouseId.trim()
              : '0'

            result = await apiClient.updateWarehouseStock(
              connectionId, 
              resolvedProductCode, 
              parsedNewStock,
              warehouseId
            )

            if (result?.success) {
              setParamValues((prev) => ({
                ...prev,
                productCode: resolvedProductCode,
                newStock: resolvedNewStock,
                warehouseId
              }))
            }
            break
          }
          case 'neGetInventoryQueueStatus': {
            const queueId = paramValues.queueId && paramValues.queueId.trim()
            if (!queueId) {
              setError('請輸入 Queue ID')
              setIsLoading(false)
              return
            }
            result = await apiClient.getInventoryQueueStatus(connectionId, queueId)
            break
          }
          case 'neGetOrderBase': {
            result = await apiClient.getOrderBase(connectionId, {
              shopId: paramValues.shopId,
              orderId: paramValues.orderId,
              dateFrom: paramValues.dateFrom,
              dateTo: paramValues.dateTo,
              offset: paramValues.offset ? parseInt(paramValues.offset) : undefined,
              limit: paramValues.limit ? parseInt(paramValues.limit) : undefined
            })
            break
          }
          case 'neGetOrderRows': {
            result = await apiClient.getOrderRows(connectionId, {
              orderId: paramValues.orderId,
              productCode: paramValues.productCode,
              shopId: paramValues.shopId,
              offset: paramValues.offset ? parseInt(paramValues.offset) : undefined,
              limit: paramValues.limit ? parseInt(paramValues.limit) : undefined
            })
            break
          }
          case 'neAnalyzeStockAllocation': {
            if (!paramValues.productCode) {
              setError('請輸入 Product Code')
              setIsLoading(false)
              return
            }
            result = await apiClient.analyzeStockAllocation(connectionId, paramValues.productCode)
            break
          }
          default:
            setError('未知的 Next Engine API 功能')
            setIsLoading(false)
            return
        }
      } else {
        // Shopline API 呼叫（原有邏輯）
        if (!activeHandle) {
          setError('請先選擇商店')
          setIsLoading(false)
          return
        }

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
              setIsLoading(false)
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
            setIsLoading(false)
          return
        }
      }

      setResponse(result)
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'API 呼叫失敗'
      setError(errorMessage)
      setIsErrorOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const currentFunction = selectedFunction ? API_FUNCTIONS[selectedFunction as keyof typeof API_FUNCTIONS] : null
  const endpoint = useMemo(() => {
    if (!currentFunction) return ''
    
    if (selectedConnection?.platform === 'next-engine') {
      if (!connectionId) return ''

      let endpointTemplate = currentFunction.endpoint(connectionId)

      if (endpointTemplate.includes(':warehouseId')) {
        const warehouseIdValue =
          paramValues.warehouseId && paramValues.warehouseId.trim().length > 0
            ? paramValues.warehouseId
            : 'default'
        endpointTemplate = endpointTemplate.replace(':warehouseId', encodeURIComponent(warehouseIdValue))
      }

      return endpointTemplate
    } else {
      return activeHandle ? currentFunction.endpoint(activeHandle).replace(':id', paramValues.productId || ':id') : ''
    }
  }, [currentFunction, selectedConnection?.platform, connectionId, activeHandle, paramValues.productId, paramValues.warehouseId])

  return (
    <PrimaryLayout>
      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Store Selector & Toggle Menu */}
          <div className="lg:col-span-1 space-y-4">
            {/* Story 5.3.1: 連線選擇（跟隨 Context Bar） */}
            <div className="bg-white p-4 rounded-lg shadow">
              <ConnectionSelectorDropdown />
            </div>

            {/* Toggle Menu - 使用設定檔 */}
            <div className="bg-white rounded-lg shadow p-4 space-y-2">
              {apiConfig ? (
                apiConfig.groups.map((group: ApiGroup) => {
                  const isOpen = openGroups.has(group.id)
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <span>{group.name}</span>
                        <span>{isOpen ? '▼' : '▶'}</span>
                      </button>
                      {isOpen && (
                        <div className="pl-4 space-y-1 mt-1">
                          {group.functions.map((func: ConfigApiFunction) => (
                            <button
                              key={func.id}
                              onClick={() => selectFunction(func.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedFunction === func.id
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
                })
              ) : (
                // Fallback: 使用舊的 FUNCTION_GROUPS（Shopline）
                Object.entries(FUNCTION_GROUPS).map(([groupKey, groupName]) => {
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
                })
              )}
            </div>
          </div>

          {/* Right Panel - Request & Response */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedConnection ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">請先在 Connection Dashboard 選擇一個 Connection</p>
              </div>
            ) : selectedConnection.platform === 'next-engine' && !connectionId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">請先選擇一個 Next Engine Connection</p>
              </div>
            ) : selectedConnection.platform === 'shopline' && !activeHandle ? (
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

                    {/* Next Engine API 參數輸入 - 使用 paramConfig 動態渲染 */}
                    {selectedConnection?.platform === 'next-engine' && currentApiFunction?.paramConfig && currentApiFunction.paramConfig.length > 0 && (
                      <div className="space-y-4">
                        {currentApiFunction.paramConfig.map((param) => (
                          <div key={param.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {param.label}
                            </label>
                            {param.type === 'textarea' ? (
                              <textarea
                                value={paramValues[param.id] || ''}
                                onChange={(e) => setParamValues({ ...paramValues, [param.id]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                rows={10}
                                placeholder={param.placeholder || ''}
                              />
                            ) : (
                              <input
                                type={param.type}
                                value={paramValues[param.id] || param.defaultValue || ''}
                                onChange={(e) => setParamValues({ ...paramValues, [param.id]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={param.placeholder || ''}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Body (Toggle) - 僅 Shopline API 顯示 */}
                    {currentFunction?.hasBody && selectedConnection?.platform !== 'next-engine' && (
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
                      disabled={
                        !selectedConnection ||
                        (selectedConnection.platform === 'shopline' && !activeHandle) ||
                        (selectedConnection.platform === 'next-engine' && !connectionId) ||
                        isLoading ||
                        (currentFunction?.requiresParam && !paramValues[currentFunction.requiresParam.name]) ||
                        (selectedFunction === 'neCreateShop' && !paramValues.xmlData) ||
                        false // neUploadGoods 支援動態模式，不需要強制要求參數
                      }
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '執行中...' : '送出測試'}
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
    </div>
    </PrimaryLayout>
  )
}

export default function AdminAPITestPage() {
  return (
    <ProtectedRoute>
      <AdminAPITest />
    </ProtectedRoute>
  )
}
