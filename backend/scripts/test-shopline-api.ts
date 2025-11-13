/**
 * Shopline API 測試腳本
 * 
 * 使用資料庫中有效的 Store token 測試 Shopline API 端點
 * 決策記錄：docs/memory/decisions/testing-with-database-tokens.md
 */

import { PrismaClient } from '@prisma/client'
import { PlatformServiceFactory } from '../src/services/platformServiceFactory'
import { ShoplineAdapter } from '../src/services/shoplineAdapter'

const prisma = new PrismaClient()

async function testShoplineAPI() {
  try {
    console.log('=== Shopline API 測試開始 ===\n')

    // 1. 從資料庫取得有效的 Store
    console.log('步驟 1: 從資料庫取得有效的 Store...')
    const stores = await prisma.store.findMany({
      where: { 
        isActive: true
      },
      select: {
        handle: true,
        accessToken: true,
        name: true
      }
    })
    
    // 過濾掉 accessToken 為空或無效的 store
    const store = stores.find(s => s.accessToken && s.accessToken.length > 0 && s.handle)

    if (!store || !store.accessToken) {
      console.log('⚠️ 資料庫中沒有有效的 Store，跳過測試')
      return
    }

    console.log(`✅ 找到 Store: ${store.handle} (${store.name || 'N/A'})`)
    console.log(`   AccessToken: ${store.accessToken.substring(0, 20)}...\n`)

    // 2. 初始化 Factory
    console.log('步驟 2: 初始化 PlatformServiceFactory...')
    PlatformServiceFactory.initialize()
    const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
    console.log('✅ PlatformServiceFactory 初始化成功\n')

    // 3. 測試 Store Info API
    console.log('步驟 3: 測試 Store Info API...')
    try {
      const storeInfo = await adapter.getStoreInfoFromAPI(store.accessToken, store.handle)
      console.log('✅ Store Info API 成功')
      console.log(`   Store Name: ${storeInfo.shop?.name || 'N/A'}\n`)
    } catch (error: any) {
      console.log(`❌ Store Info API 失敗: ${error.message}\n`)
    }

    // 4. 測試 Products API
    console.log('步驟 4: 測試 Products API...')
    try {
      const products = await adapter.getProducts(store.accessToken, store.handle, { page: 1, limit: 5 })
      console.log('✅ Products API 成功')
      console.log(`   產品數量: ${products.products?.length || 0}\n`)
    } catch (error: any) {
      console.log(`❌ Products API 失敗: ${error.message}\n`)
    }

    // 5. 測試 Orders API
    console.log('步驟 5: 測試 Orders API...')
    try {
      const orders = await adapter.getOrders(store.accessToken, store.handle, { page: 1, limit: 5 })
      console.log('✅ Orders API 成功')
      console.log(`   訂單數量: ${orders.orders?.length || 0}\n`)
    } catch (error: any) {
      console.log(`❌ Orders API 失敗: ${error.message}\n`)
    }

    // 6. 測試 Locations API
    console.log('步驟 6: 測試 Locations API...')
    try {
      const locations = await adapter.getLocations(store.accessToken, store.handle)
      console.log('✅ Locations API 成功')
      console.log(`   地點數量: ${locations.locations?.length || 0}\n`)
    } catch (error: any) {
      console.log(`❌ Locations API 失敗: ${error.message}\n`)
    }

    // 7. 測試錯誤處理（無效 token）
    console.log('步驟 7: 測試錯誤處理（無效 token）...')
    try {
      await adapter.getStoreInfoFromAPI('invalid-token', store.handle)
      console.log('❌ 錯誤處理測試失敗：應該要拋出錯誤\n')
    } catch (error: any) {
      console.log('✅ 錯誤處理正確：無效 token 正確拋出錯誤')
      console.log(`   錯誤訊息: ${error.message}\n`)
    }

    console.log('=== Shopline API 測試完成 ===')
  } catch (error: any) {
    console.error('❌ 測試過程發生錯誤:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testShoplineAPI()

