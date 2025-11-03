#!/usr/bin/env node

/**
 * Webhook 訂閱測試腳本
 * 使用資料庫中已授權的 paykepoc 商店進行測試
 */

// Node.js 18+ 內建 fetch，無需額外安裝

const BASE_URL = 'http://localhost:3001'
const NGROK_URL = 'https://f79597ed859e.ngrok-free.app'
const HANDLE = 'paykepoc'

// 測試用的事件主題
const TEST_TOPICS = [
  'orders/create',
  'orders/update',
  'products/create',
  'products/update'
]

async function testSubscribeWebhook(topic) {
  console.log(`\n🔔 測試訂閱 Webhook: ${topic}`)
  
  try {
    const response = await fetch(`${BASE_URL}/webhook/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        handle: HANDLE,
        topic: topic,
        webhookUrl: `${NGROK_URL}/webhook/shopline`,
        apiVersion: 'v20230901'
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ 訂閱成功: ${topic}`)
      console.log(`   訂閱 ID: ${data.data?.id || 'N/A'}`)
    } else {
      console.log(`❌ 訂閱失敗: ${topic}`)
      console.log(`   錯誤: ${data.error}`)
    }

    return data
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`)
    return null
  }
}

async function testGetSubscribedWebhooks() {
  console.log(`\n📋 取得訂閱列表`)
  
  try {
    const response = await fetch(`${BASE_URL}/webhook/subscribe?handle=${HANDLE}`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ 取得訂閱列表成功`)
      const webhooks = data.data?.webhooks || []
      console.log(`   共 ${webhooks.length} 個訂閱`)
      
      webhooks.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.topic} (ID: ${webhook.id})`)
      })
    } else {
      console.log(`❌ 取得訂閱列表失敗: ${data.error}`)
    }

    return data
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`)
    return null
  }
}

async function testGetWebhookCount() {
  console.log(`\n📊 取得訂閱數量`)
  
  try {
    const response = await fetch(`${BASE_URL}/webhook/subscribe/count?handle=${HANDLE}`)
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ 訂閱數量: ${data.data?.count || 0}`)
    } else {
      console.log(`❌ 取得訂閱數量失敗: ${data.error}`)
    }

    return data
  } catch (error) {
    console.log(`❌ 請求失敗: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🧪 Webhook 訂閱功能測試')
  console.log(`📦 商店 Handle: ${HANDLE}`)
  console.log(`🌐 Webhook URL: ${NGROK_URL}/webhook/shopline`)
  console.log('=' .repeat(60))

  // 1. 取得當前訂閱列表
  await testGetSubscribedWebhooks()
  await testGetWebhookCount()

  // 2. 測試訂閱 Webhook
  console.log('\n' + '=' .repeat(60))
  console.log('開始測試訂閱...')
  
  for (const topic of TEST_TOPICS) {
    await testSubscribeWebhook(topic)
    await new Promise(resolve => setTimeout(resolve, 500)) // 避免請求過快
  }

  // 3. 再次取得訂閱列表
  console.log('\n' + '=' .repeat(60))
  console.log('訂閱後檢查...')
  await testGetSubscribedWebhooks()
  await testGetWebhookCount()

  console.log('\n' + '=' .repeat(60))
  console.log('✅ 測試完成！')
}

main().catch(console.error)

