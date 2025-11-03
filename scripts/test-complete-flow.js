#!/usr/bin/env node

// 完整流程測試腳本

// 使用內建的 fetch (Node.js 18+)
const crypto = require('crypto')

const API_BASE = 'http://localhost:3001'
const APP_KEY = '4c951e966557c8374d9a61753dfe3c52441aba3b'
const APP_SECRET = 'dd46269d6920f49b07e810862d3093062b0fb858'

// 生成簽名
function generateSignature(params, secret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex')
}

async function testCompleteFlow() {
  console.log('🧪 開始完整流程測試...\n')

  try {
    // 1. 測試健康檢查
    console.log('1️⃣ 測試健康檢查...')
    const healthResponse = await fetch(`${API_BASE}/api/health`)
    const healthData = await healthResponse.json()
    console.log('✅ 健康檢查:', healthData.message)

    // 2. 測試取得商店列表
    console.log('\n2️⃣ 測試取得商店列表...')
    const storesResponse = await fetch(`${API_BASE}/api/stores`)
    const storesData = await storesResponse.json()
    console.log('✅ 商店列表:', storesData.data?.length || 0, '個商店')

    // 3. 測試 Webhook 事件
    console.log('\n3️⃣ 測試取得 Webhook 事件...')
    const eventsResponse = await fetch(`${API_BASE}/webhook/events`)
    const eventsData = await eventsResponse.json()
    console.log('✅ Webhook 事件:', eventsData.data?.length || 0, '個事件')

    // 4. 測試授權 URL 生成 (模擬安裝請求)
    console.log('\n4️⃣ 測試授權 URL 生成...')
    const timestamp = Math.floor(Date.now() / 1000)
    const installParams = {
      appkey: APP_KEY,
      handle: 'paykepoc',
      timestamp: timestamp.toString()
    }
    const signature = generateSignature(installParams, APP_SECRET)
    
    const authUrl = `${API_BASE}/auth/shopline?appkey=${APP_KEY}&handle=paykepoc&timestamp=${timestamp}&sign=${signature}`
    console.log('✅ 授權 URL 已生成')
    console.log('🔗 授權 URL:', authUrl)

    // 5. 測試簽名驗證
    console.log('\n5️⃣ 測試簽名驗證...')
    const testParams = {
      appkey: APP_KEY,
      handle: 'paykepoc',
      timestamp: timestamp.toString()
    }
    const testSignature = generateSignature(testParams, APP_SECRET)
    console.log('✅ 簽名生成成功:', testSignature.substring(0, 16) + '...')

    console.log('\n🎉 所有測試完成！')
    console.log('\n📋 下一步：')
    console.log('1. 啟動 ngrok: ./scripts/start-ngrok.sh')
    console.log('2. 更新 Shopline 應用設定中的回調 URL')
    console.log('3. 訪問前端: http://localhost:3000')
    console.log('4. 點擊「新增商店授權」開始 OAuth 流程')

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }
}

testCompleteFlow()
