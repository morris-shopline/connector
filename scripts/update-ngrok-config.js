#!/usr/bin/env node

// 自動更新所有配置檔案中的 ngrok URL

const fs = require('fs')
const path = require('path')

async function updateAllNgrokConfigs() {
  try {
    // 取得 ngrok 隧道資訊
    const response = await fetch('http://localhost:4040/api/tunnels')
    const data = await response.json()
    
    if (!data.tunnels || data.tunnels.length === 0) {
      console.log('❌ 找不到 ngrok 隧道，請確認 ngrok 正在運行')
      process.exit(1)
    }
    
    const ngrokUrl = data.tunnels[0].public_url
    console.log(`🌐 偵測到 ngrok URL: ${ngrokUrl}\n`)
    
    const updates = []
    
    // 1. 更新 backend/.env 中的 SHOPLINE_REDIRECT_URI 和 NGROK_URL
    const backendEnvPath = path.join(__dirname, '../backend/.env')
    if (fs.existsSync(backendEnvPath)) {
      let content = fs.readFileSync(backendEnvPath, 'utf8')
      let hasChanges = false
      
      // 更新 NGROK_URL
      const correctRedirectUri = `${ngrokUrl}/api/auth/shopline/callback`
      if (content.includes('NGROK_URL=')) {
        const oldNgrokUrl = content.match(/^NGROK_URL=.*$/m)?.[0] || ''
        content = content.replace(/NGROK_URL=.*/g, `NGROK_URL=${ngrokUrl}`)
        hasChanges = true
        updates.push(`✅ 已更新 backend/.env 中的 NGROK_URL`)
      }
      
      // 更新 SHOPLINE_REDIRECT_URI（重要：用於 OAuth 回調）
      if (content.includes('SHOPLINE_REDIRECT_URI=')) {
        const oldRedirectUri = content.match(/^SHOPLINE_REDIRECT_URI=.*$/m)?.[0] || ''
        content = content.replace(/SHOPLINE_REDIRECT_URI=.*/g, `SHOPLINE_REDIRECT_URI=${correctRedirectUri}`)
        hasChanges = true
        updates.push(`✅ 已更新 backend/.env 中的 SHOPLINE_REDIRECT_URI: ${oldRedirectUri} → ${correctRedirectUri}`)
      } else {
        // 如果沒有 SHOPLINE_REDIRECT_URI，新增它
        content += `\nSHOPLINE_REDIRECT_URI=${correctRedirectUri}\n`
        hasChanges = true
        updates.push(`✅ 已在 backend/.env 新增 SHOPLINE_REDIRECT_URI`)
      }
      
      if (hasChanges) {
        fs.writeFileSync(backendEnvPath, content)
      }
    } else {
      updates.push(`⚠️  backend/.env 不存在，請先建立`)
    }
    
    // 2. 更新 scripts/test-webhook-subscribe.js
    const testScriptPath = path.join(__dirname, 'test-webhook-subscribe.js')
    if (fs.existsSync(testScriptPath)) {
      let content = fs.readFileSync(testScriptPath, 'utf8')
      const oldUrlMatch = content.match(/const NGROK_URL = ['"]([^'"]+)['"]/)
      if (oldUrlMatch) {
        content = content.replace(/const NGROK_URL = ['"][^'"]+['"]/, `const NGROK_URL = '${ngrokUrl}'`)
        fs.writeFileSync(testScriptPath, content)
        updates.push(`✅ 已更新 scripts/test-webhook-subscribe.js: ${oldUrlMatch[1]} → ${ngrokUrl}`)
      }
    }
    
    // 3. 更新測試指南 (如果存在的話)
    const testingGuidePath = path.join(__dirname, '../docs/reference/guides/testing-guide.md')
    if (fs.existsSync(testingGuidePath)) {
      let content = fs.readFileSync(testingGuidePath, 'utf8')
      const oldUrlRegex = /https:\/\/[a-f0-9]+\.ngrok-free\.app/g
      const matches = content.match(oldUrlRegex)
      if (matches && matches.length > 0) {
        content = content.replace(oldUrlRegex, ngrokUrl)
        fs.writeFileSync(testingGuidePath, content)
        updates.push(`✅ 已更新 docs/reference/guides/testing-guide.md (${matches.length} 處)`)
      }
    }
    
    
    // 更新 frontend/.env.local
    const frontendEnvLocalPath = path.join(__dirname, '../frontend/.env.local')
    if (fs.existsSync(frontendEnvLocalPath)) {
      let content = fs.readFileSync(frontendEnvLocalPath, 'utf8')
      if (content.includes('NEXT_PUBLIC_NGROK_URL=')) {
        content = content.replace(/NEXT_PUBLIC_NGROK_URL=.*/g, `NEXT_PUBLIC_NGROK_URL=${ngrokUrl}`)
        fs.writeFileSync(frontendEnvLocalPath, content)
        updates.push(`✅ 已更新 frontend/.env.local 中的 NEXT_PUBLIC_NGROK_URL`)
      } else {
        content += `\nNEXT_PUBLIC_NGROK_URL=${ngrokUrl}\n`
        fs.writeFileSync(frontendEnvLocalPath, content)
        updates.push(`✅ 已在 frontend/.env.local 新增 NEXT_PUBLIC_NGROK_URL`)
      }
    }
    
    // 更新 frontend/.env（如果存在）
    const frontendEnvPath = path.join(__dirname, '../frontend/.env')
    if (fs.existsSync(frontendEnvPath)) {
      let content = fs.readFileSync(frontendEnvPath, 'utf8')
      if (content.includes('NEXT_PUBLIC_NGROK_URL=')) {
        content = content.replace(/NEXT_PUBLIC_NGROK_URL=.*/g, `NEXT_PUBLIC_NGROK_URL=${ngrokUrl}`)
        fs.writeFileSync(frontendEnvPath, content)
        updates.push(`✅ 已更新 frontend/.env 中的 NEXT_PUBLIC_NGROK_URL`)
      } else {
        content += `\nNEXT_PUBLIC_NGROK_URL=${ngrokUrl}\n`
        fs.writeFileSync(frontendEnvPath, content)
        updates.push(`✅ 已在 frontend/.env 新增 NEXT_PUBLIC_NGROK_URL`)
      }
    }
    
    console.log('\n📋 更新摘要:')
    updates.forEach(update => console.log(`   ${update}`))
    
    console.log('\n✅ 所有 ngrok URL 配置已更新！\n')
    console.log('📋 SHOPLINE App 設定 URL:')
    console.log(`   🔗 App URL: ${ngrokUrl}/api/auth/shopline/install`)
    console.log(`   📞 Callback URL: ${ngrokUrl}/api/auth/shopline/callback`)
    console.log(`   📡 Webhook URL: ${ngrokUrl}/webhook/shopline\n`)
    
  } catch (error) {
    console.error('❌ 更新配置失敗:', error.message)
    process.exit(1)
  }
}

updateAllNgrokConfigs()
