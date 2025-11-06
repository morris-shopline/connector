import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearStores() {
  try {
    console.log('⚠️  警告：此操作將清除所有 Store 和 WebhookEvent 資料！')
    console.log('📋 將保留：')
    console.log('   - User 資料（包括系統使用者）')
    console.log('   - 系統使用者（system@admin.com）')
    console.log('')
    
    // 確認操作
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('確定要清除所有 Store 和 WebhookEvent 資料嗎？(yes/no): ', resolve)
    })
    
    rl.close()
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消')
      process.exit(0)
    }
    
    console.log('開始清除資料...')
    
    // 先刪除 WebhookEvent（因為有外鍵關聯）
    const deletedWebhookEvents = await prisma.webhookEvent.deleteMany({})
    console.log(`✅ 已刪除 ${deletedWebhookEvents.count} 筆 WebhookEvent`)
    
    // 再刪除 Store
    const deletedStores = await prisma.store.deleteMany({})
    console.log(`✅ 已刪除 ${deletedStores.count} 筆 Store`)
    
    // 確認系統使用者存在
    const systemUser = await prisma.user.findUnique({
      where: { email: 'system@admin.com' }
    })
    
    if (!systemUser) {
      console.log('⚠️  系統使用者不存在，將建立系統使用者...')
      const bcrypt = require('bcrypt')
      const systemPassword = await bcrypt.hash('system-password-' + Date.now(), 10)
      await prisma.user.create({
        data: {
          email: 'system@admin.com',
          password: systemPassword,
          name: 'System Admin',
        },
      })
      console.log('✅ 系統使用者已建立')
    } else {
      console.log('✅ 系統使用者存在')
    }
    
    console.log('')
    console.log('✅ 資料清除完成！')
    console.log('📊 清除結果:')
    console.log(`   - 已刪除 Store: ${deletedStores.count} 筆`)
    console.log(`   - 已刪除 WebhookEvent: ${deletedWebhookEvents.count} 筆`)
    console.log(`   - 保留 User: ${await prisma.user.count()} 筆`)
    
  } catch (error) {
    console.error('❌ 清除失敗:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearStores()

