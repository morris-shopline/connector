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
import { getBackendUrl } from '../lib/api'

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
          bodyDescription: func.bodyDescription
        }
      })
    })
    return functions
  }, [apiConfig])

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

  const selectFunction = (funcKey: string) => {
    setSelectedFunction(funcKey)
    setResponse(null)
    setError(null)
    setIsBodyOpen(false)
    setIsErrorOpen(false)
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
      let result: any

      // Next Engine API 呼叫
      if (selectedConnection.platform === 'next-engine') {
        if (!connectionId) {
          setError('請先選擇一個 Connection')
          setIsLoading(false)
          return
        }

        const endpoint = func.endpoint(connectionId)
        const backendUrl = getBackendUrl()
        const fullUrl = `${backendUrl}${endpoint}`
        const token = localStorage.getItem('auth_token')

        switch (selectedFunction) {
          case 'neSearchShops': {
            const body = {
              fields: paramValues.fields || 'shop_id,shop_name,shop_abbreviated_name,shop_note'
            }
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(body)
            })
            const responseData = await response.json()
            if (!response.ok || !responseData.success) {
              throw new Error(responseData.error || responseData.message || 'API 呼叫失敗')
            }
            result = responseData
            break
          }
          case 'neCreateShop': {
            if (!paramValues.xmlData) {
              setError('請輸入 XML 資料')
              setIsLoading(false)
              return
            }
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ data: paramValues.xmlData })
            })
            const responseData = await response.json()
            if (!response.ok || !responseData.success) {
              throw new Error(responseData.error || responseData.message || 'API 呼叫失敗')
            }
            result = responseData
            break
          }
          case 'neSearchGoods': {
            const body: any = {
              fields: paramValues.fields || 'goods_id,goods_name,stock_quantity,supplier_name',
              offset: paramValues.offset || '0',
              limit: paramValues.limit || '100'
            }
            if (paramValues.goods_id_eq) {
              body.goods_id_eq = paramValues.goods_id_eq
            }
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(body)
            })
            const responseData = await response.json()
            if (!response.ok || !responseData.success) {
              throw new Error(responseData.error || responseData.message || 'API 呼叫失敗')
            }
            result = responseData
            break
          }
          case 'neUploadGoods': {
            if (!paramValues.csvData) {
              setError('請輸入 CSV 資料')
              setIsLoading(false)
              return
            }
            const response = await fetch(fullUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ data: paramValues.csvData })
            })
            const responseData = await response.json()
            if (!response.ok || !responseData.success) {
              throw new Error(responseData.error || responseData.message || 'API 呼叫失敗')
            }
            result = responseData
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
      return connectionId ? currentFunction.endpoint(connectionId) : ''
    } else {
      return activeHandle ? currentFunction.endpoint(activeHandle).replace(':id', paramValues.productId || ':id') : ''
    }
  }, [currentFunction, selectedConnection?.platform, connectionId, activeHandle, paramValues.productId])

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

                    {/* Next Engine API 參數輸入 */}
                    {selectedConnection?.platform === 'next-engine' && selectedFunction && (
                      <>
                        {selectedFunction === 'neSearchShops' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Fields（選填）
                            </label>
                            <input
                              type="text"
                              value={paramValues.fields || 'shop_id,shop_name,shop_abbreviated_name,shop_note'}
                              onChange={(e) => setParamValues({ ...paramValues, fields: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="shop_id,shop_name,shop_abbreviated_name,shop_note"
                            />
                          </div>
                        )}
                        {selectedFunction === 'neCreateShop' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              XML 資料（必填）
                            </label>
                            <textarea
                              value={paramValues.xmlData || ''}
                              onChange={(e) => setParamValues({ ...paramValues, xmlData: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                              rows={10}
                              placeholder={`<?xml version="1.0" encoding="utf-8"?>
<root>
  <shop>
    <shop_mall_id>90</shop_mall_id>
    <shop_note>店舖備註</shop_note>
    <shop_name>店舖名稱</shop_name>
    <shop_abbreviated_name>SL</shop_abbreviated_name>
    <shop_tax_id>0</shop_tax_id>
    <shop_tax_calculation_sequence_id>0</shop_tax_calculation_sequence_id>
    <shop_currency_unit_id>1</shop_currency_unit_id>
  </shop>
</root>`}
                            />
                          </div>
                        )}
                        {selectedFunction === 'neSearchGoods' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fields（選填）
                              </label>
                              <input
                                type="text"
                                value={paramValues.fields || 'goods_id,goods_name,stock_quantity,supplier_name'}
                                onChange={(e) => setParamValues({ ...paramValues, fields: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="goods_id,goods_name,stock_quantity,supplier_name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Goods ID（選填，用於精確查詢）
                              </label>
                              <input
                                type="text"
                                value={paramValues.goods_id_eq || ''}
                                onChange={(e) => setParamValues({ ...paramValues, goods_id_eq: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="例如：TestP001"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Offset（選填）
                                </label>
                                <input
                                  type="text"
                                  value={paramValues.offset || '0'}
                                  onChange={(e) => setParamValues({ ...paramValues, offset: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Limit（選填）
                                </label>
                                <input
                                  type="text"
                                  value={paramValues.limit || '100'}
                                  onChange={(e) => setParamValues({ ...paramValues, limit: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="100"
                                />
                              </div>
                            </div>
                          </>
                        )}
                        {selectedFunction === 'neUploadGoods' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CSV 資料（必填）
                            </label>
                            <textarea
                              value={paramValues.csvData || ''}
                              onChange={(e) => setParamValues({ ...paramValues, csvData: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                              rows={10}
                              placeholder={`syohin_code,sire_code,jan_code,maker_name,maker_kana,maker_jyusyo,maker_yubin_bangou,kataban,iro,syohin_name,gaikoku_syohin_name,syohin_kbn,toriatukai_kbn,genka_tnk,hyoji_tnk,baika_tnk,gaikoku_baika_tnk,kake_ritu,omosa,haba,okuyuki,takasa,yusou_kbn,syohin_status_kbn,hatubai_bi,zaiko_teisu,hachu_ten,lot,keisai_tantou,keisai_bi,bikou,daihyo_syohin_code,visible_flg,mail_tag,tag,location,mail_send_flg,mail_send_num,gift_ok_flg,size,org_select1,org_select2,org_select3,org_select4,org_select5,org_select6,org_select7,org_select8,org_select9,org_select10,org1,org2,org3,org4,org5,org6,org7,org8,org9,org10,org11,org12,org13,org14,org15,org16,org17,org18,org19,org20,maker_kataban,zaiko_threshold,orosi_threshold,hasou_houhou_kbn,hasoumoto_code,zaiko_su,yoyaku_zaiko_su,nyusyukko_riyu,hit_syohin_alert_quantity,nouki_kbn,nouki_sitei_bi,syohin_setumei_html,syohin_setumei_text,spec_html,spec_text,chui_jiko_html,chui_jiko_text,syohin_jyotai_kbn,syohin_jyotai_setumei,category_code_yauc,category_text,image_url_http,image_alt
TestP001,9999,,,,,,,,登録時必須,,0,0,120000,,150000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,`}
                            />
                          </div>
                        )}
                      </>
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
                        (selectedFunction === 'neUploadGoods' && !paramValues.csvData)
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
