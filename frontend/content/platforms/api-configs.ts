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
          name: '建立商品',
          group: 'goods',
          method: 'POST',
          endpoint: (connectionId: string) => `/api/connections/${connectionId}/goods/upload`,
          hasBody: true,
          bodyDescription: '上傳 CSV 格式的商品資料',
          paramConfig: [
            { 
              id: 'csvData', 
              label: 'CSV 資料（必填）', 
              type: 'textarea', 
              placeholder: `syohin_code,sire_code,jan_code,maker_name,maker_kana,maker_jyusyo,maker_yubin_bangou,kataban,iro,syohin_name,gaikoku_syohin_name,syohin_kbn,toriatukai_kbn,genka_tnk,hyoji_tnk,baika_tnk,gaikoku_baika_tnk,kake_ritu,omosa,haba,okuyuki,takasa,yusou_kbn,syohin_status_kbn,hatubai_bi,zaiko_teisu,hachu_ten,lot,keisai_tantou,keisai_bi,bikou,daihyo_syohin_code,visible_flg,mail_tag,tag,location,mail_send_flg,mail_send_num,gift_ok_flg,size,org_select1,org_select2,org_select3,org_select4,org_select5,org_select6,org_select7,org_select8,org_select9,org_select10,org1,org2,org3,org4,org5,org6,org7,org8,org9,org10,org11,org12,org13,org14,org15,org16,org17,org18,org19,org20,maker_kataban,zaiko_threshold,orosi_threshold,hasou_houhou_kbn,hasoumoto_code,zaiko_su,yoyaku_zaiko_su,nyusyukko_riyu,hit_syohin_alert_quantity,nouki_kbn,nouki_sitei_bi,syohin_setumei_html,syohin_setumei_text,spec_html,spec_text,chui_jiko_html,chui_jiko_text,syohin_jyotai_kbn,syohin_jyotai_setumei,category_code_yauc,category_text,image_url_http,image_alt
TestP001,9999,,,,,,,,登録時必須,,0,0,120000,,150000,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,` 
            }
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

