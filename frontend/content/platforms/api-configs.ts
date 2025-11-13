// 平台 API 配置檔案
// 定義不同平台（Shopline、Next Engine）的 API 功能群組和函數

export type ApiFunction = {
  id: string
  name: string
  group: string
  method: string
  endpoint: (connectionId: string) => string
  hasBody: boolean
  bodyDescription?: string
  requiresParam?: { name: string; label: string; type: string }
  paramConfig?: Array<{
    id: string
    label: string
    type: 'text' | 'textarea'
    defaultValue?: string
    placeholder?: string
  }>
}

export type ApiGroup = {
  id: string
  name: string
  functions: ApiFunction[]
}

export type PlatformApiConfig = {
  platform: 'shopline' | 'next-engine'
  groups: ApiGroup[]
}

// Shopline API 配置
export const shoplineApiConfig: PlatformApiConfig = {
  platform: 'shopline',
  groups: [
    {
      id: 'store',
      name: '商家',
      functions: [
        {
          id: 'getStoreInfo',
          name: 'Get Store Info',
          group: 'store',
          method: 'GET',
          endpoint: (handle: string) => `/api/stores/${handle}/info`,
          hasBody: false
        }
      ]
    },
    {
      id: 'products',
      name: '商品',
      functions: [
        {
          id: 'getProducts',
          name: 'Get Products',
          group: 'products',
          method: 'GET',
          endpoint: (handle: string) => `/api/stores/${handle}/products`,
          hasBody: false
        },
        {
          id: 'getProduct',
          name: 'Get Product by ID',
          group: 'products',
          method: 'GET',
          endpoint: (handle: string) => `/api/stores/${handle}/products/:id`,
          hasBody: false,
          requiresParam: { name: 'productId', label: 'Product ID', type: 'text' }
        },
        {
          id: 'createProduct',
          name: 'Create Product',
          group: 'products',
          method: 'POST',
          endpoint: (handle: string) => `/api/stores/${handle}/products`,
          hasBody: true,
          bodyDescription: '自動生成隨機 handle 和預設值'
        }
      ]
    },
    {
      id: 'orders',
      name: '訂單',
      functions: [
        {
          id: 'getOrders',
          name: 'Get Orders',
          group: 'orders',
          method: 'GET',
          endpoint: (handle: string) => `/api/stores/${handle}/orders`,
          hasBody: false
        },
        {
          id: 'createOrder',
          name: 'Create Order',
          group: 'orders',
          method: 'POST',
          endpoint: (handle: string) => `/api/stores/${handle}/orders`,
          hasBody: true,
          bodyDescription: '自動選擇隨機產品和 location_id'
        }
      ]
    },
    {
      id: 'inventory',
      name: '庫存',
      functions: [
        {
          id: 'getLocations',
          name: 'Get Locations',
          group: 'inventory',
          method: 'GET',
          endpoint: (handle: string) => `/api/stores/${handle}/locations`,
          hasBody: false
        }
      ]
    }
  ]
}

// Next Engine API 配置
export const nextEngineApiConfig: PlatformApiConfig = {
  platform: 'next-engine',
  groups: [
    {
      id: 'shops',
      name: '店舖',
      functions: [
        {
          id: 'neSearchShops',
          name: '取得店舖列表',
          group: 'shops',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/shops/search`,
          hasBody: true,
          bodyDescription: '查詢 Next Engine 店舖清單',
          paramConfig: [
            { id: 'fields', label: 'Fields（選填）', type: 'text', defaultValue: 'shop_id,shop_name,shop_abbreviated_name,shop_note' }
          ]
        },
        {
          id: 'neCreateShop',
          name: '建立店舖',
          group: 'shops',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/shops/create`,
          hasBody: true,
          bodyDescription: '建立新的 Next Engine 店舖（需要 XML 格式資料）',
          paramConfig: [
            { 
              id: 'xmlData', 
              label: 'XML 資料（必填）', 
              type: 'textarea', 
              placeholder: `<?xml version="1.0" encoding="utf-8"?>
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
</root>` 
            }
          ]
        }
      ]
    },
    {
      id: 'goods',
      name: '商品',
      functions: [
        {
          id: 'neSearchGoods',
          name: '查詢商品',
          group: 'goods',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/goods/search`,
          hasBody: true,
          bodyDescription: '查詢 Next Engine 商品資料',
          paramConfig: [
            { id: 'fields', label: 'Fields（選填）', type: 'text', defaultValue: 'goods_id,goods_name,stock_quantity,supplier_name' },
            { id: 'goods_id_eq', label: 'Goods ID（選填，用於精確查詢）', type: 'text', placeholder: '例如：TestP001' },
            { id: 'offset', label: 'Offset（選填）', type: 'text', defaultValue: '0' },
            { id: 'limit', label: 'Limit（選填）', type: 'text', defaultValue: '100' }
          ]
        },
        {
          id: 'neUploadGoods',
          name: '建立商品（支援動態參數）',
          group: 'goods',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/goods/upload`,
          hasBody: true,
          bodyDescription: '支援動態參數或 CSV 格式',
          paramConfig: [
            { id: 'productCode', label: 'Product Code（選填，動態模式）', type: 'text' },
            { id: 'productName', label: 'Product Name（選填，動態模式）', type: 'text' },
            { id: 'price', label: 'Price（選填，動態模式）', type: 'text', defaultValue: '1500' },
            { id: 'cost', label: 'Cost（選填，動態模式）', type: 'text', defaultValue: '1000' },
            { 
              id: 'csvData', 
              label: 'CSV 資料（選填，手動模式）', 
              type: 'textarea',
              placeholder: '若未提供動態參數，則使用 CSV 資料'
            }
          ]
        }
      ]
    },
    {
      id: 'inventory',
      name: '庫存',
      functions: [
        {
          id: 'neGetMasterStock',
          name: '查詢主倉庫存',
          group: 'inventory',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory`,
          hasBody: true,
          paramConfig: [
            { id: 'productCode', label: 'Product Code（選填）', type: 'text' }
          ]
        },
        {
          id: 'neGetWarehouseStock',
          name: '查詢分倉庫存',
          group: 'inventory',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory/warehouse/:warehouseId`,
          hasBody: true,
          paramConfig: [
            { id: 'warehouseId', label: 'Warehouse ID（選填，預設 default 代表基本拠点）', type: 'text', defaultValue: 'default', placeholder: 'default' },
            { id: 'productCode', label: 'Product Code（選填）', type: 'text' }
          ]
        },
        {
          id: 'neGetWarehouses',
          name: '查詢倉庫列表',
          group: 'inventory',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/warehouses`,
          hasBody: true
        },
        {
          id: 'neUpdateWarehouseStock',
          name: '更新分倉庫存',
          group: 'inventory',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory/warehouse`,
          hasBody: true,
          paramConfig: [
            { id: 'productCode', label: 'Product Code（必填；留空時會自動取得第一筆商品，若尚未建立請先新增）', type: 'text' },
            { id: 'newStock', label: 'New Stock（必填）', type: 'text', defaultValue: '10' },
            { id: 'warehouseId', label: 'Warehouse ID（必填，預設值 0 代表基本拠点）', type: 'text', defaultValue: '0', placeholder: '0' }
          ]
        },
        {
          id: 'neGetInventoryQueueStatus',
          name: '查詢庫存更新佇列狀態',
          group: 'inventory',
          method: 'GET',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/inventory/queue/:queueId`,
          hasBody: false,
          paramConfig: [
            { id: 'queueId', label: 'Queue ID（必填）', type: 'text', placeholder: 'que_id' }
          ]
        }
      ]
    },
    {
      id: 'orders',
      name: '訂單',
      functions: [
        {
          id: 'neGetOrderBase',
          name: '查詢訂單 Base',
          group: 'orders',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/base`,
          hasBody: true,
          paramConfig: [
            { id: 'shopId', label: 'Shop ID（選填）', type: 'text' },
            { id: 'orderId', label: 'Order ID（選填）', type: 'text' },
            { id: 'dateFrom', label: '開始日期（選填）', type: 'text', placeholder: 'YYYY-MM-DD' },
            { id: 'dateTo', label: '結束日期（選填）', type: 'text', placeholder: 'YYYY-MM-DD' },
            { id: 'offset', label: 'Offset（選填）', type: 'text', defaultValue: '0' },
            { id: 'limit', label: 'Limit（選填）', type: 'text', defaultValue: '100' }
          ]
        },
        {
          id: 'neGetOrderRows',
          name: '查詢訂單 Rows（明細）',
          group: 'orders',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/rows`,
          hasBody: true,
          paramConfig: [
            { id: 'orderId', label: 'Order ID（選填）', type: 'text' },
            { id: 'productCode', label: 'Product Code（選填）', type: 'text' },
            { id: 'shopId', label: 'Shop ID（選填）', type: 'text' },
            { id: 'offset', label: 'Offset（選填）', type: 'text', defaultValue: '0' },
            { id: 'limit', label: 'Limit（選填）', type: 'text', defaultValue: '100' }
          ]
        },
        {
          id: 'neAnalyzeStockAllocation',
          name: '扣庫分析',
          group: 'orders',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/orders/analyze-allocation`,
          hasBody: true,
          paramConfig: [
            { id: 'productCode', label: 'Product Code（必填）', type: 'text' }
          ]
        }
      ]
    }
  ]
}

/**
 * 根據 platform 取得對應的 API 配置
 */
export function getPlatformApiConfig(platform: 'shopline' | 'next-engine' | null | undefined): PlatformApiConfig | null {
  switch (platform) {
    case 'shopline':
      return shoplineApiConfig
    case 'next-engine':
      return nextEngineApiConfig
    default:
      return null
  }
}

