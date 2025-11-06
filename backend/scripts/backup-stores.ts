import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function backupStores() {
  try {
    console.log('開始備份 Store 和 WebhookEvent 資料...')
    
    // 備份 Store 資料
    const stores = await prisma.store.findMany({
      include: {
        webhookEvents: true
      }
    })
    
    // 備份 WebhookEvent 資料
    const webhookEvents = await prisma.webhookEvent.findMany()
    
    // 備份 User 資料（僅備份非系統使用者）
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: 'system@admin.com'
        }
      }
    })
    
    // 建立備份資料結構
    const backupData = {
      timestamp: new Date().toISOString(),
      stores: stores.map(store => ({
        id: store.id,
        userId: store.userId,
        shoplineId: store.shoplineId,
        handle: store.handle,
        name: store.name,
        domain: store.domain,
        accessToken: store.accessToken,
        expiresAt: store.expiresAt?.toISOString(),
        scope: store.scope,
        isActive: store.isActive,
        createdAt: store.createdAt.toISOString(),
        updatedAt: store.updatedAt.toISOString()
      })),
      webhookEvents: webhookEvents.map(event => ({
        id: event.id,
        userId: event.userId,
        storeId: event.storeId,
        webhookId: event.webhookId,
        topic: event.topic,
        eventType: event.eventType,
        shopDomain: event.shopDomain,
        shoplineId: event.shoplineId,
        merchantId: event.merchantId,
        apiVersion: event.apiVersion,
        payload: event.payload,
        createdAt: event.createdAt.toISOString()
      })),
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }))
    }
    
    // 建立備份目錄
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // 儲存備份檔案
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    
    console.log(`✅ 備份完成！`)
    console.log(`📁 備份檔案: ${backupFile}`)
    console.log(`📊 備份內容:`)
    console.log(`   - Stores: ${stores.length} 筆`)
    console.log(`   - WebhookEvents: ${webhookEvents.length} 筆`)
    console.log(`   - Users: ${users.length} 筆`)
    
  } catch (error) {
    console.error('❌ 備份失敗:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

backupStores()

