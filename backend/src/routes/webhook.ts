import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { authMiddleware } from '../middleware/auth'
import { filterWebhookEventsByUser } from '../utils/query-filter'

const shoplineService = new ShoplineService()

export async function webhookRoutes(fastify: FastifyInstance, options: any) {
  // 為 Webhook 路由配置原始 body 解析器（用於簽名驗證）
  // 需要在處理前取得原始字串
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      // 將原始字串存到 request.rawBody 供後續使用
      ;(req as any).rawBody = body
      // 同時解析為 JSON 供業務邏輯使用
      done(null, JSON.parse(body as string))
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  // 處理 Shopline Webhook
  // 根據官方文件：https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview/?version=v20260301
  fastify.post('/webhook/shopline', async (request, reply) => {
    const startTime = Date.now()

    try {
      // 1. 取得原始 Request Body（未解析的 JSON 字串）
      // 使用 rawBody（由 content-type-parser 提供）或 JSON.stringify 作為備用
      const rawBody = (request as any).rawBody || JSON.stringify(request.body)

      // 2. 取得必要的 Headers（官方格式）
      const topic = request.headers['x-shopline-topic'] as string
      const signature = request.headers['x-shopline-hmac-sha256'] as string
      const shopDomain = request.headers['x-shopline-shop-domain'] as string
      const shopId = request.headers['x-shopline-shop-id'] as string
      const merchantId = request.headers['x-shopline-merchant-id'] as string
      const apiVersion = request.headers['x-shopline-api-version'] as string
      const webhookId = request.headers['x-shopline-webhook-id'] as string

      // 3. 驗證必要的 Headers
      if (!signature || !topic || !shopId || !webhookId) {
        fastify.log.warn('Missing required webhook headers', {
          hasSignature: !!signature,
          hasTopic: !!topic,
          hasShopId: !!shopId,
          hasWebhookId: !!webhookId
        })
        return reply.status(400).send({
          success: false,
          error: 'Missing required headers'
        })
      }

      // 4. 驗證簽名（必須在處理業務邏輯前完成）
      const isValidSignature = shoplineService.verifyWebhookSignature(rawBody, signature)
      if (!isValidSignature) {
        fastify.log.warn('Invalid webhook signature', { webhookId })
        return reply.status(401).send({
          success: false,
          error: 'Invalid signature'
        })
      }

      // 5. 檢查是否為重複事件（使用 Webhook ID 去重）
      const isDuplicate = await shoplineService.isWebhookProcessed(webhookId)
      if (isDuplicate) {
        fastify.log.info('Duplicate webhook event, returning success', { webhookId })
        // 根據官方文件：如果已處理過，應返回成功回應
        return reply.status(200).send()
      }

      // 6. 取得商店資訊
      // 使用 shoplineId（來自 X-Shopline-Shop-Id header）來查找 store
      const store = await shoplineService.getStoreInfo(shopId)
      if (!store) {
        fastify.log.error('Store not found for webhook', { 
          shopId, 
          webhookId, 
          shopDomain,
          topic,
          headers: {
            'x-shopline-shop-id': shopId,
            'x-shopline-shop-domain': shopDomain
          }
        })
        // 即使找不到 store，也要返回 200 避免重試
        // 但記錄錯誤以便排查
        reply.status(200).send()
        return
      }

      // 7. 立即回應 HTTP 200（必須在 5 秒內回應，避免觸發重試）
      // 注意：在儲存資料前回應，確保能在時限內回應
      reply.status(200).send()

      // 8. 非同步處理：儲存 Webhook 事件
      // 由於已回應，後續處理不會影響回應時間
      try {
        // Story 4.3: 加強安全驗證 - 找到對應的 ConnectionItem
        const { connectionRepository } = await import('../repositories/connectionRepository')
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        // 根據 shoplineId 找到對應的 ConnectionItem
        const connectionItem = await prisma.connectionItem.findFirst({
          where: {
            platform: 'shopline',
            externalResourceId: shopId,
            status: 'active',
          },
          include: {
            integrationAccount: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        })
        
        // 驗證 ConnectionItem 的 userId 與 store.userId 一致
        if (connectionItem && connectionItem.integrationAccount.userId !== store.userId) {
          fastify.log.warn('Webhook security: ConnectionItem userId mismatch', {
            webhookId,
            shopId,
            storeUserId: store.userId,
            connectionItemUserId: connectionItem.integrationAccount.userId,
          })
          // 記錄安全事件（非阻塞，因為已經回應 200）
          setImmediate(async () => {
            try {
              const { auditLogRepository } = await import('../repositories/auditLogRepository')
              await auditLogRepository.createAuditLog({
                userId: store.userId,
                connectionId: connectionItem.integrationAccount.id,
                connectionItemId: connectionItem.id,
                operation: 'webhook.security_mismatch',
                result: 'error',
                errorCode: 'USER_ID_MISMATCH',
                errorMessage: `Webhook userId mismatch: store.userId=${store.userId}, connectionItem.userId=${connectionItem.integrationAccount.userId}`,
                metadata: {
                  webhookId,
                  shopId,
                  topic,
                },
              })
            } catch (auditError) {
              fastify.log.error('Failed to create security audit log (non-blocking):', auditError)
            }
          })
        }
        
        await shoplineService.saveWebhookEvent(
          store.id,
          webhookId,
          topic,
          shopDomain || null,
          shopId,
          merchantId || null,
          apiVersion || null,
          request.body,
          connectionItem?.id || null // 傳入 connectionItemId
        )

        const processingTime = Date.now() - startTime
        fastify.log.info('Webhook received and saved', {
          webhookId,
          topic,
          shopId,
          storeId: store.id,
          connectionItemId: connectionItem?.id || null,
          processingTime: `${processingTime}ms`
        })
        
        await prisma.$disconnect()
      } catch (saveError) {
        // 記錄儲存錯誤，但不影響回應（因為已回應 200）
        fastify.log.error('Error saving webhook event', {
          webhookId,
          topic,
          error: saveError
        })
      }

      // 注意：reply 已在步驟 7 完成，這裡不需要再回應
      return
    } catch (error) {
      const processingTime = Date.now() - startTime
      fastify.log.error('Webhook processing error', {
        error,
        processingTime: `${processingTime}ms`
      })

      // 如果還沒有回應，返回錯誤
      if (!reply.sent) {
        return reply.status(500).send({
          success: false,
          error: 'Internal server error'
        })
      }

      // 如果已回應，只記錄錯誤
      return
    }
  })

  // 取得 webhook 事件列表（需要登入）
  // Story 5.3.1: 支援 connectionId 過濾，確保只顯示當前 Connection 的事件
  fastify.get('/webhook/events', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const userId = request.user.id
      const { connectionId } = request.query as { connectionId?: string }
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()

      // 建立 where 條件
      const where: any = filterWebhookEventsByUser(userId)
      
      // 如果有 connectionId，過濾該 Connection 的事件
      if (connectionId) {
        // 透過 ConnectionItem 關聯過濾
        where.connectionItem = {
          integrationAccountId: connectionId
        }
      }

      const events = await prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          store: {
            select: {
              shoplineId: true,
              domain: true
            }
          },
          connectionItem: {
            select: {
              id: true,
              integrationAccountId: true,
              displayName: true
            }
          }
        }
      })
      
      await prisma.$disconnect()

      // 解析 payload JSON 字串
      const eventsWithParsedPayload = events.map(event => ({
        ...event,
        payload: JSON.parse(event.payload)
      }))

      return reply.send({
        success: true,
        data: eventsWithParsedPayload
      })
    } catch (error) {
      fastify.log.error('Get events error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })

  // === Webhook 訂閱管理 API（測試用） ===

  // 訂閱 Webhook（需要登入）
  fastify.post('/webhook/subscribe', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { handle, topic, webhookUrl, apiVersion } = request.body as {
        handle?: string
        topic?: string
        webhookUrl?: string
        apiVersion?: string
      }

      if (!handle || !topic || !webhookUrl) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: handle, topic, webhookUrl'
        })
      }

      // 驗證 URL 不是測試用的假 URL
      const invalidTestUrls = ['test.example.com', 'example.com', 'test.com', 'localhost.com']
      const isInvalidUrl = invalidTestUrls.some(invalid => 
        webhookUrl.toLowerCase().includes(invalid.toLowerCase())
      )
      
      if (isInvalidUrl) {
        return reply.status(400).send({
          success: false,
          error: `不能使用測試用的假 URL（${webhookUrl}）。請使用正確的 ngrok URL 或正式站 URL`
        })
      }

      // 驗證 URL 格式
      if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        return reply.status(400).send({
          success: false,
          error: 'Webhook URL 必須以 http:// 或 https:// 開頭'
        })
      }

      fastify.log.info('Subscribing webhook', { handle, topic, webhookUrl })
      
      const result = await shoplineService.subscribeWebhook(
        handle,
        topic,
        webhookUrl,
        apiVersion || 'v20250601'
      )

      fastify.log.info('Webhook subscription result', { result })

      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      fastify.log.error('Subscribe webhook error:', error)
      fastify.log.error('Error details:', {
        message: error.message,
        stack: error.stack
      })

      // 處理 Token 過期錯誤
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          error: 'ACCESS_TOKEN_EXPIRED',
          message: 'Access Token 已過期，請重新授權商店',
          code: 'TOKEN_EXPIRED'
        })
      }

      // 處理認證失敗錯誤
      if (error.message?.includes('AUTHENTICATION_FAILED')) {
        return reply.status(401).send({
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: error.message.replace('AUTHENTICATION_FAILED: ', ''),
          code: 'AUTH_FAILED'
        })
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // 取得訂閱列表
  fastify.get('/webhook/subscribe', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { handle } = request.query as { handle?: string }

      if (!handle) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameter: handle'
        })
      }

      fastify.log.info('Getting webhook subscriptions', { handle })
      
      const result = await shoplineService.getSubscribedWebhooks(handle)

      fastify.log.info('Webhook subscriptions result', { 
        handle, 
        result,
        webhooksCount: result?.webhooks?.length || 0 
      })

      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      fastify.log.error('Get subscribed webhooks error:', error)
      fastify.log.error('Error details:', {
        message: error.message,
        stack: error.stack
      })

      // 處理 Token 過期錯誤
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          error: 'ACCESS_TOKEN_EXPIRED',
          message: 'Access Token 已過期，請重新授權商店',
          code: 'TOKEN_EXPIRED'
        })
      }

      // 處理認證失敗錯誤
      if (error.message?.includes('AUTHENTICATION_FAILED')) {
        return reply.status(401).send({
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: error.message.replace('AUTHENTICATION_FAILED: ', ''),
          code: 'AUTH_FAILED'
        })
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // 取消訂閱
  fastify.delete('/webhook/subscribe/:webhookId', async (request, reply) => {
    try {
      const { webhookId } = request.params as { webhookId: string }
      const { handle } = request.query as { handle?: string }

      if (!handle) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameter: handle'
        })
      }

      const result = await shoplineService.unsubscribeWebhook(handle, webhookId)

      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      fastify.log.error('Unsubscribe webhook error:', error)

      // 處理 Token 過期錯誤
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          error: 'ACCESS_TOKEN_EXPIRED',
          message: 'Access Token 已過期，請重新授權商店',
          code: 'TOKEN_EXPIRED'
        })
      }

      // 處理認證失敗錯誤
      if (error.message?.includes('AUTHENTICATION_FAILED')) {
        return reply.status(401).send({
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: error.message.replace('AUTHENTICATION_FAILED: ', ''),
          code: 'AUTH_FAILED'
        })
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // 取得訂閱數量
  fastify.get('/webhook/subscribe/count', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { handle } = request.query as { handle?: string }

      if (!handle) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameter: handle'
        })
      }

      const result = await shoplineService.getWebhookCount(handle)

      return reply.send({
        success: true,
        data: result
      })
    } catch (error: any) {
      fastify.log.error('Get webhook count error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })
}
