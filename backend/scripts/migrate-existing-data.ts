import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function migrateExistingData() {
  try {
    console.log('開始資料遷移...')

    // 1. 建立系統使用者（如果不存在）
    let systemUser = await prisma.user.findUnique({
      where: { email: 'system@admin.com' },
    })

    if (!systemUser) {
      console.log('建立系統使用者...')
      // 生成一個隨機密碼（系統使用者不需要實際登入）
      const systemPassword = await bcrypt.hash('system-password-' + Date.now(), 10)
      systemUser = await prisma.user.create({
        data: {
          email: 'system@admin.com',
          password: systemPassword,
          name: 'System Admin',
        },
      })
      console.log('系統使用者已建立:', systemUser.id)
    } else {
      console.log('系統使用者已存在:', systemUser.id)
    }

    // 2. 更新所有 Store 的 userId（將 null 設為系統使用者 ID）
    // 使用 SQL 直接查詢和更新（因為 Prisma 無法查詢 null 的必填欄位）
    const storesCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM stores
      WHERE "userId" IS NULL
    `
    const nullCount = Number(storesCount[0]?.count || 0)
    console.log(`找到 ${nullCount} 個沒有 userId 的 Store`)

    if (nullCount > 0) {
      // 使用 SQL 直接更新所有 null userId 的 Store
      const result = await prisma.$executeRaw`
        UPDATE stores 
        SET "userId" = ${systemUser.id}
        WHERE "userId" IS NULL
      `
      console.log(`已更新 ${result} 個 Store 的 userId`)
    }

    // 3. 更新所有 WebhookEvent 的 userId（透過 Store 關聯）
    // 先取得所有 WebhookEvent（因為 userId 欄位可能還不存在或為 null）
    const allEvents = await prisma.webhookEvent.findMany({
      include: { store: true },
    })
    
    const eventsWithoutUserId = allEvents.filter(event => !event.userId)

    console.log(`找到 ${eventsWithoutUserId.length} 個沒有 userId 的 WebhookEvent`)

    if (eventsWithoutUserId.length > 0) {
      // 透過 Store 取得 userId 並更新
      for (const event of eventsWithoutUserId) {
        if (event.store && event.store.userId) {
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { userId: event.store.userId },
          })
        } else {
          // 如果 Store 沒有 userId，使用系統使用者
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { userId: systemUser.id },
          })
        }
      }
      console.log('所有 WebhookEvent 的 userId 已更新')
    }

    console.log('資料遷移完成！')
  } catch (error) {
    console.error('資料遷移失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateExistingData()

