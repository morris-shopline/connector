/**
 * R3.0: 將 stores 資料遷移到 integration_accounts 和 connection_items
 * 
 * Migration 策略：
 * 1. 為每個使用者的 stores 建立 integration_accounts（Connection）
 * 2. 將 stores 轉換為 connection_items
 * 3. 更新 webhook_events 的 connectionItemId
 * 
 * 使用方式：
 * - 開發環境：npm run migrate:connections
 * - 測試模式：npm run migrate:connections -- --sample 10
 * - 乾跑模式：npm run migrate:connections -- --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationOptions {
  sample?: number // 只處理前 N 筆資料（測試用）
  dryRun?: boolean // 乾跑模式，不實際寫入資料
}

async function migrateStoresToConnections(options: MigrationOptions = {}) {
  const { sample, dryRun = false } = options

  try {
    console.log('🚀 開始將 stores 遷移到 Connection 模型...')
    if (dryRun) {
      console.log('⚠️  乾跑模式：不會實際寫入資料')
    }
    if (sample) {
      console.log(`📊 測試模式：只處理前 ${sample} 筆 stores`)
    }

    // 1. 取得所有 stores（依使用者分組）
    const stores = await prisma.store.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: sample,
    })

    console.log(`📦 找到 ${stores.length} 筆 stores 需要遷移`)

    if (stores.length === 0) {
      console.log('✅ 沒有資料需要遷移')
      return
    }

    // 2. 依使用者分組 stores
    const storesByUser = new Map<string, typeof stores>()
    for (const store of stores) {
      const userId = store.userId
      if (!storesByUser.has(userId)) {
        storesByUser.set(userId, [])
      }
      storesByUser.get(userId)!.push(store)
    }

    console.log(`👥 涉及 ${storesByUser.size} 位使用者`)

    let integrationAccountsCreated = 0
    let connectionItemsCreated = 0
    let webhookEventsUpdated = 0

    // 3. 為每位使用者建立 integration_accounts 和 connection_items
    for (const [userId, userStores] of storesByUser.entries()) {
      console.log(`\n處理使用者 ${userId} 的 ${userStores.length} 筆 stores...`)

      // 依 handle 分組（同一個 handle 對應同一個 Connection）
      const storesByHandle = new Map<string, typeof userStores>()
      for (const store of userStores) {
        const handle = store.handle || store.shoplineId
        if (!storesByHandle.has(handle)) {
          storesByHandle.set(handle, [])
        }
        storesByHandle.get(handle)!.push(store)
      }

      for (const [handle, handleStores] of storesByHandle.entries()) {
        // 使用第一筆 store 作為 Connection 的基礎資料
        const primaryStore = handleStores[0]

        if (!primaryStore) {
          continue
        }

        // 建立 authPayload
        const authPayload = {
          accessToken: primaryStore.accessToken,
          expiresAt: primaryStore.expiresAt?.toISOString() || null,
          scope: primaryStore.scope,
        }

        if (dryRun) {
          console.log(`  [DRY-RUN] 將建立 IntegrationAccount:`)
          console.log(`    - platform: shopline`)
          console.log(`    - externalAccountId: ${handle}`)
          console.log(`    - displayName: ${handle}`)
          console.log(`    - userId: ${userId}`)
          console.log(`    - 將建立 ${handleStores.length} 個 ConnectionItem`)
          integrationAccountsCreated++
          connectionItemsCreated += handleStores.length
          continue
        }

        // 建立 integration_accounts（Connection）
        const integrationAccount = await prisma.integrationAccount.create({
          data: {
            userId,
            platform: 'shopline',
            externalAccountId: handle,
            displayName: handle,
            authPayload,
            status: primaryStore.isActive ? 'active' : 'revoked',
            createdAt: primaryStore.createdAt,
            updatedAt: primaryStore.updatedAt,
          },
        })

        integrationAccountsCreated++
        console.log(`  ✅ 建立 IntegrationAccount: ${integrationAccount.id} (${handle})`)

        // 為每個 store 建立 connection_item
        for (const store of handleStores) {
          const connectionItem = await prisma.connectionItem.create({
            data: {
              integrationAccountId: integrationAccount.id,
              platform: 'shopline',
              externalResourceId: store.shoplineId,
              displayName: store.name || store.handle || store.shoplineId,
              metadata: {
                domain: store.domain,
                handle: store.handle,
              },
              status: store.isActive ? 'active' : 'disabled',
              createdAt: store.createdAt,
              updatedAt: store.updatedAt,
            },
          })

          connectionItemsCreated++
          console.log(`    ✅ 建立 ConnectionItem: ${connectionItem.id} (${store.shoplineId})`)

          // 更新 webhook_events 的 connectionItemId
          const updateResult = await prisma.webhookEvent.updateMany({
            where: {
              storeId: store.id,
            },
            data: {
              connectionItemId: connectionItem.id,
            },
          })

          webhookEventsUpdated += updateResult.count
          if (updateResult.count > 0) {
            console.log(`      ✅ 更新 ${updateResult.count} 筆 WebhookEvent`)
          }
        }
      }
    }

    console.log('\n📊 遷移統計：')
    console.log(`  - IntegrationAccount 建立: ${integrationAccountsCreated}`)
    console.log(`  - ConnectionItem 建立: ${connectionItemsCreated}`)
    console.log(`  - WebhookEvent 更新: ${webhookEventsUpdated}`)

    if (!dryRun) {
      console.log('\n✅ 資料遷移完成！')
    } else {
      console.log('\n✅ 乾跑完成（未實際寫入資料）')
    }
  } catch (error) {
    console.error('❌ 資料遷移失敗:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 解析命令列參數
const args = process.argv.slice(2)
const options: MigrationOptions = {}

if (args.includes('--dry-run')) {
  options.dryRun = true
}

const sampleIndex = args.indexOf('--sample')
if (sampleIndex !== -1 && args[sampleIndex + 1]) {
  options.sample = parseInt(args[sampleIndex + 1], 10)
}

migrateStoresToConnections(options)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

