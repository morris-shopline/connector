#!/usr/bin/env node

// API 測試腳本

const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3001'

async function testAPI() {
  console.log('🧪 開始測試 API...\n')

  try {
    // 測試健康檢查
    console.log('1️⃣ 測試健康檢查...')
    const healthResponse = await fetch(`${API_BASE}/api/health`)
    const healthData = await healthResponse.json()
    console.log('✅ 健康檢查:', healthData.message)

    // 測試取得商店列表
    console.log('\n2️⃣ 測試取得商店列表...')
    const storesResponse = await fetch(`${API_BASE}/api/stores`)
    const storesData = await storesResponse.json()
    console.log('✅ 商店列表:', storesData.data?.length || 0, '個商店')

    // 測試 Webhook 事件
    console.log('\n3️⃣ 測試取得 Webhook 事件...')
    const eventsResponse = await fetch(`${API_BASE}/webhook/events`)
    const eventsData = await eventsResponse.json()
    console.log('✅ Webhook 事件:', eventsData.data?.length || 0, '個事件')

    // 測試授權 URL 生成
    console.log('\n4️⃣ 測試授權 URL...')
    const authResponse = await fetch(`${API_BASE}/auth/shopline?appkey=4c951e966557c8374d9a61753dfe3c52441aba3b&handle=paykepoc&timestamp=${Math.floor(Date.now() / 1000)}&sign=test`)
    console.log('✅ 授權 URL 狀態:', authResponse.status)

    console.log('\n🎉 所有測試完成！')
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }
}

testAPI()
