import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStores() {
  try {
    console.log('檢查資料庫中的 Store 和 User 資料...\n')
    
    // 取得所有 User
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })
    
    console.log('📊 Users:')
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`)
      console.log(`    名稱: ${user.name || 'N/A'}`)
      console.log(`    建立時間: ${user.createdAt}`)
    })
    
    console.log('\n📊 Stores:')
    
    // 取得所有 Store
    const stores = await prisma.store.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (stores.length === 0) {
      console.log('  ❌ 沒有 Store 資料')
    } else {
      stores.forEach(store => {
        console.log(`  - Store ID: ${store.id}`)
        console.log(`    Shopline ID: ${store.shoplineId}`)
        console.log(`    Handle: ${store.handle || 'N/A'}`)
        console.log(`    User ID: ${store.userId}`)
        console.log(`    使用者: ${store.user?.email || 'N/A'} (${store.user?.name || 'N/A'})`)
        console.log(`    建立時間: ${store.createdAt}`)
        console.log(`    更新時間: ${store.updatedAt}`)
        console.log('')
      })
    }
    
    console.log('\n📊 WebhookEvents:')
    const events = await prisma.webhookEvent.findMany({
      select: {
        id: true,
        userId: true,
        storeId: true,
        topic: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    if (events.length === 0) {
      console.log('  ❌ 沒有 WebhookEvent 資料')
    } else {
      console.log(`  最近 ${events.length} 筆:`)
      events.forEach(event => {
        console.log(`  - Event ID: ${event.id}`)
        console.log(`    User ID: ${event.userId}`)
        console.log(`    Store ID: ${event.storeId}`)
        console.log(`    Topic: ${event.topic}`)
        console.log(`    建立時間: ${event.createdAt}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ 檢查失敗:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkStores()

