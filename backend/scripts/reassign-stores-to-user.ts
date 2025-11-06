import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 將系統使用者的商店重新關聯到指定使用者
 * 
 * 使用方式：
 * - 將系統使用者的所有商店重新關聯到指定使用者
 * - 或者根據 handle 將特定商店重新關聯到指定使用者
 * 
 * 參數：
 * - targetUserEmail: 目標使用者的 email
 * - handle (可選): 如果提供，只重新關聯該 handle 的商店
 */
async function reassignStoresToUser(targetUserEmail: string, handle?: string) {
  try {
    console.log('開始重新關聯商店...\n')
    
    // 1. 取得目標使用者
    const targetUser = await prisma.user.findUnique({
      where: { email: targetUserEmail }
    })
    
    if (!targetUser) {
      console.error(`❌ 找不到使用者: ${targetUserEmail}`)
      console.log('\n可用的使用者:')
      const users = await prisma.user.findMany({
        select: { email: true, name: true, id: true }
      })
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`)
      })
      process.exit(1)
    }
    
    console.log(`✅ 找到目標使用者: ${targetUser.email} (${targetUser.id})`)
    
    // 2. 取得系統使用者
    const systemUser = await prisma.user.findUnique({
      where: { email: 'system@admin.com' }
    })
    
    if (!systemUser) {
      console.error('❌ 找不到系統使用者')
      process.exit(1)
    }
    
    console.log(`✅ 找到系統使用者: ${systemUser.email} (${systemUser.id})`)
    
    // 3. 查詢需要重新關聯的商店
    const whereClause: any = {
      userId: systemUser.id
    }
    
    if (handle) {
      whereClause.handle = handle
    }
    
    const storesToReassign = await prisma.store.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    if (storesToReassign.length === 0) {
      console.log(`\n✅ 沒有需要重新關聯的商店`)
      if (handle) {
        console.log(`   (handle: ${handle})`)
      }
      process.exit(0)
    }
    
    console.log(`\n📊 找到 ${storesToReassign.length} 個需要重新關聯的商店:`)
    storesToReassign.forEach(store => {
      console.log(`  - Store ID: ${store.id}`)
      console.log(`    Shopline ID: ${store.shoplineId}`)
      console.log(`    Handle: ${store.handle || 'N/A'}`)
      console.log(`    目前使用者: ${store.user?.email || 'N/A'}`)
      console.log('')
    })
    
    // 4. 確認操作
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise<string>((resolve) => {
      rl.question(`確定要將這些商店重新關聯到 ${targetUser.email} 嗎？(yes/no): `, resolve)
    })
    
    rl.close()
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消')
      process.exit(0)
    }
    
    // 5. 重新關聯商店
    console.log('\n開始重新關聯商店...')
    
    let reassignedCount = 0
    for (const store of storesToReassign) {
      try {
        await prisma.store.update({
          where: { id: store.id },
          data: { userId: targetUser.id }
        })
        console.log(`✅ 已重新關聯: ${store.handle || store.shoplineId} -> ${targetUser.email}`)
        reassignedCount++
      } catch (error: any) {
        console.error(`❌ 重新關聯失敗: ${store.handle || store.shoplineId}`, error.message)
      }
    }
    
    // 6. 更新相關的 WebhookEvent
    console.log('\n更新相關的 WebhookEvent...')
    const updatedEvents = await prisma.webhookEvent.updateMany({
      where: {
        storeId: {
          in: storesToReassign.map(s => s.id)
        },
        userId: systemUser.id
      },
      data: {
        userId: targetUser.id
      }
    })
    console.log(`✅ 已更新 ${updatedEvents.count} 個 WebhookEvent`)
    
    console.log('\n✅ 重新關聯完成！')
    console.log(`📊 結果:`)
    console.log(`  - 重新關聯的商店: ${reassignedCount}/${storesToReassign.length}`)
    console.log(`  - 更新的 WebhookEvent: ${updatedEvents.count}`)
    
    // 7. 驗證結果
    console.log('\n驗證結果...')
    const finalStores = await prisma.store.findMany({
      where: {
        id: {
          in: storesToReassign.map(s => s.id)
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    console.log('\n📊 重新關聯後的商店:')
    finalStores.forEach(store => {
      console.log(`  - ${store.handle || store.shoplineId}`)
      console.log(`    使用者: ${store.user?.email || 'N/A'}`)
    })
    
  } catch (error) {
    console.error('❌ 重新關聯失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 從命令列參數取得目標使用者 email 和 handle（可選）
const targetUserEmail = process.argv[2]
const handle = process.argv[3]

if (!targetUserEmail) {
  console.error('❌ 請提供目標使用者的 email')
  console.log('\n使用方式:')
  console.log('  npm run reassign-stores <targetUserEmail> [handle]')
  console.log('\n範例:')
  console.log('  npm run reassign-stores morris.li@shopline.com')
  console.log('  npm run reassign-stores morris.li@shopline.com paykepoc')
  process.exit(1)
}

reassignStoresToUser(targetUserEmail, handle)

