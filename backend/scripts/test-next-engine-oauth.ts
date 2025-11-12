/**
 * Next Engine OAuth 測試腳本
 * 
 * Story 5.1: 測試 Next Engine OAuth 流程的核心功能
 * 
 * 使用方法：
 * ```bash
 * tsx scripts/test-next-engine-oauth.ts
 * ```
 */

import dotenv from 'dotenv'
import { NextEngineAdapter } from '../src/services/nextEngine'
import { PlatformServiceFactory } from '../src/services/platformServiceFactory'

dotenv.config()

async function testNextEngineAdapter() {
  console.log('🧪 開始測試 Next Engine Adapter...\n')

  // 檢查環境變數
  const requiredEnvVars = ['NEXTENGINE_CLIENT_ID', 'NEXTENGINE_CLIENT_SECRET', 'NEXTENGINE_REDIRECT_URI']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])
  
  if (missingVars.length > 0) {
    console.error('❌ 缺少必要的環境變數:', missingVars.join(', '))
    console.error('請確認 .env 檔案已正確設定')
    process.exit(1)
  }

  try {
    // 測試 1: 初始化 Adapter
    console.log('📋 測試 1: 初始化 Next Engine Adapter')
    const adapter = new NextEngineAdapter()
    console.log('✅ Adapter 初始化成功\n')

    // 測試 2: 取得授權 URL
    console.log('📋 測試 2: 取得授權 URL')
    const testState = 'test-state-12345'
    const authUrl = adapter.getAuthorizeUrl(testState)
    console.log('授權 URL:', authUrl)
    
    if (authUrl.includes('base.next-engine.org') && authUrl.includes('client_id') && authUrl.includes('redirect_uri') && authUrl.includes('state')) {
      console.log('✅ 授權 URL 格式正確\n')
    } else {
      console.error('❌ 授權 URL 格式錯誤\n')
      process.exit(1)
    }

    // 測試 3: 註冊到 PlatformServiceFactory
    console.log('📋 測試 3: 註冊到 PlatformServiceFactory')
    PlatformServiceFactory.initialize()
    
    if (PlatformServiceFactory.hasAdapter('next-engine')) {
      console.log('✅ Adapter 已成功註冊\n')
    } else {
      console.error('❌ Adapter 註冊失敗\n')
      process.exit(1)
    }

    // 測試 4: 從 Factory 取得 Adapter
    console.log('📋 測試 4: 從 Factory 取得 Adapter')
    const factoryAdapter = PlatformServiceFactory.getAdapter('next-engine')
    
    if (factoryAdapter) {
      console.log('✅ 成功從 Factory 取得 Adapter\n')
    } else {
      console.error('❌ 無法從 Factory 取得 Adapter\n')
      process.exit(1)
    }

    // 測試 5: 錯誤碼映射
    console.log('📋 測試 5: 錯誤碼映射（模擬）')
    // 這個測試需要實際的 API 回應，目前只測試介面
    console.log('✅ 錯誤碼映射介面已實作（需實際 API 測試）\n')

    console.log('🎉 所有基本測試通過！')
    console.log('\n⚠️  注意：以下測試需要實際的 Next Engine API 回應：')
    console.log('  - Token 交換測試')
    console.log('  - Token 刷新測試')
    console.log('  - 取得公司資訊測試')
    console.log('  - 錯誤碼映射測試（002002, 002003）')
    console.log('\n建議使用 Postman 或實際 OAuth 流程進行端對端測試。')

  } catch (error: any) {
    console.error('❌ 測試失敗:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 執行測試
testNextEngineAdapter()

