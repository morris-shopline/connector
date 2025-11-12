import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { authMiddleware } from '../middleware/auth'
import { requireConnectionOwner } from '../middleware/requireConnectionOwner'
import { filterStoresByUser, verifyStoreOwnership, verifyStoreHandleOwnership } from '../utils/query-filter'
import { connectionRepository } from '../repositories/connectionRepository'
import { auditLogRepository } from '../repositories/auditLogRepository'
import { PlatformServiceFactory } from '../services/platformServiceFactory'

const shoplineService = new ShoplineService()

export async function apiRoutes(fastify: FastifyInstance, options: any) {
  // R3.0: 取得所有 Connection 及底下項目（需要登入）
  fastify.get('/api/connections', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }

      const userId = request.user.id
      const connections = await connectionRepository.findConnectionsByUser(userId)

      return reply.send({
        success: true,
        data: connections
      })
    } catch (error) {
      fastify.log.error('Get connections error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
    }
  })

  // Story 5.2: 取得 Connection 的 Connection Items
  fastify.get('/api/connections/:connectionId/items', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required'
        })
      }

      const connectionId = (request.params as any).connectionId
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      // 取得 Connection Items
      const items = await connectionRepository.findConnectionItems(connectionId)

      return reply.send({
        success: true,
        data: items
      })
    } catch (error) {
      fastify.log.error('Get connection items error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
    }
  })

  // Story 5.2: 取得 Connection 的訂單摘要
  fastify.get('/api/connections/:connectionId/orders/summary', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required'
        })
      }

      const connectionId = (request.params as any).connectionId
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      // 根據平台取得訂單摘要
      if (connection.platform === 'next-engine') {
        const authPayload = connection.authPayload as any
        const accessToken = authPayload.accessToken

        if (!accessToken) {
          return reply.status(400).send({
            success: false,
            code: 'TOKEN_NOT_FOUND',
            error: 'Access token not found'
          })
        }

        PlatformServiceFactory.initialize()
        const adapter = PlatformServiceFactory.getAdapter('next-engine')
        const orderSummary = await adapter.getOrderSummary(accessToken)

        if (!orderSummary.success) {
          // 記錄錯誤
          await auditLogRepository.createAuditLog({
            userId: request.user.id,
            connectionId: connection.id,
            operation: 'connection.orders.summary',
            result: 'error',
            errorCode: orderSummary.error.type,
            errorMessage: orderSummary.error.message,
            metadata: { platform: 'next-engine', raw: orderSummary.error.raw }
          })

          return reply.status(400).send({
            success: false,
            code: orderSummary.error.type,
            error: orderSummary.error.message
          })
        }

        // 記錄成功
        await auditLogRepository.createAuditLog({
          userId: request.user.id,
          connectionId: connection.id,
          operation: 'connection.orders.summary',
          result: 'success',
          metadata: { platform: 'next-engine', total: orderSummary.data.total }
        })

        return reply.send({
          success: true,
          data: orderSummary.data
        })
      } else {
        // 其他平台（Shopline）暫時回傳空資料
        return reply.send({
          success: true,
          data: {
            total: 0,
            lastUpdated: null
          }
        })
      }
    } catch (error: any) {
      fastify.log.error('Get order summary error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
    }
  })

  // Story 4.3: 取得 Connection 的審計記錄
  fastify.get('/api/connections/:connectionId/logs', { 
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required'
        })
      }

      const connectionId = (request.params as any).connectionId
      const limit = parseInt((request.query as any).limit || '50', 10)

      const logs = await auditLogRepository.findAuditLogsByConnection(connectionId, limit)

      return reply.send({
        success: true,
        data: logs
      })
    } catch (error) {
      fastify.log.error('Get connection logs error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
    }
  })

  // Story 4.3: 取得當前使用者的審計記錄（用於 Activity Dock）
  fastify.get('/api/audit-logs', { 
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required'
        })
      }

      const userId = request.user.id
      const limit = parseInt((request.query as any).limit || '50', 10)
      // 只返回當前使用者的審計記錄
      const logs = await auditLogRepository.findAuditLogsByUser(userId, limit)

      return reply.send({
        success: true,
        data: logs
      })
    } catch (error) {
      fastify.log.error('Get audit logs error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
    }
  })

  // 更新 Connection Item 狀態（需要登入 + 擁有權驗證）
  fastify.patch('/api/connection-items/:id', { 
    preHandler: [authMiddleware, async (request, reply) => {
      // 先取得 item 的 connectionId，然後驗證擁有權
      const itemId = (request.params as any).id
      const item = await connectionRepository.findConnectionItemById(itemId)
      if (!item) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_ITEM_NOT_FOUND',
          error: 'Connection Item not found'
        })
      }
      // 將 connectionId 放入 params，讓 requireConnectionOwner 可以驗證
      ;(request.params as any).connectionId = item.integrationAccountId
      return requireConnectionOwner(request as any, reply)
    }]
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          code: 'AUTHENTICATION_REQUIRED',
          error: 'Authentication required'
        })
      }

      const userId = request.user.id
      const itemId = (request.params as any).id
      const { status } = request.body as { status?: 'active' | 'disabled' }

      if (!status || (status !== 'active' && status !== 'disabled')) {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_STATUS',
          error: 'Invalid status. Must be "active" or "disabled"'
        })
      }

      // 取得 Connection Item（已在 middleware 中驗證過擁有權）
      const item = await connectionRepository.findConnectionItemById(itemId)
      if (!item) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_ITEM_NOT_FOUND',
          error: 'Connection Item not found'
        })
      }

      // 更新狀態
      const updatedItem = await connectionRepository.updateConnectionItemStatus(itemId, status)

      // 先回傳成功回應，確保主要操作完成
      reply.send({
        success: true,
        data: updatedItem
      })

      // 寫入審計記錄（非阻塞，不影響主要操作）
      setImmediate(async () => {
        try {
          await auditLogRepository.createAuditLog({
            userId,
            connectionId: item.integrationAccountId,
            connectionItemId: itemId,
            operation: status === 'active' ? 'connection_item.enable' : 'connection_item.disable',
            result: 'success',
            metadata: {
              previousStatus: item.status,
              newStatus: status,
            },
          })
        } catch (auditError) {
          // 審計記錄失敗不影響主要操作，只記錄錯誤
          fastify.log.error('Failed to create audit log (non-blocking):', auditError)
        }
      })
    } catch (error) {
      fastify.log.error('Update connection item status error:', error)
      
      // 先回傳錯誤回應
      reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Internal server error'
      })
      
      // 寫入錯誤審計記錄（非阻塞）
      setImmediate(async () => {
        try {
          if (request.user) {
            const itemId = (request.params as any).id
            const item = await connectionRepository.findConnectionItemById(itemId)
            if (item) {
              await auditLogRepository.createAuditLog({
                userId: request.user.id,
                connectionId: item.integrationAccountId,
                connectionItemId: itemId,
                operation: 'connection_item.update',
                result: 'error',
                errorCode: 'INTERNAL_ERROR',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              })
            }
          }
        } catch (auditError) {
          fastify.log.error('Failed to create error audit log (non-blocking):', auditError)
        }
      })
    }
  })

  // 取得所有已授權的商店（需要登入）
  fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      console.log('🔍 [DEBUG] GET /api/stores 請求')
      console.log('🔍 [DEBUG] request.user:', request.user ? { id: request.user.id, email: request.user.email } : 'null')
      
      if (!request.user) {
        console.error('❌ [DEBUG] 沒有使用者認證')
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const userId = request.user.id
      console.log('🔍 [DEBUG] 查詢商店，userId:', userId)
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const filter = filterStoresByUser(userId)
      console.log('🔍 [DEBUG] 查詢條件:', JSON.stringify(filter, null, 2))
      
      const stores = await prisma.store.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
      })
      
      console.log('🔍 [DEBUG] 查詢結果:', {
        count: stores.length,
        stores: stores.map(s => ({ id: s.id, shoplineId: s.shoplineId, handle: s.handle, userId: s.userId }))
      })
      
      await prisma.$disconnect()
      
      return reply.send({
        success: true,
        data: stores
      })
    } catch (error) {
      console.error('❌ [DEBUG] Get stores error:', error)
      fastify.log.error({ msg: 'Get stores error:', error })
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })

  // 取得特定商店資訊（需要登入）
  fastify.get('/api/stores/:shopId', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { shopId } = request.params as { shopId: string }
      const userId = request.user.id
      
      // 驗證商店所有權
      const hasAccess = await verifyStoreOwnership(shopId, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const store = await prisma.store.findUnique({
        where: { id: shopId },
      })
      
      await prisma.$disconnect()
      
      if (!store) {
        return reply.status(404).send({
          success: false,
          error: 'Store not found'
        })
      }

      return reply.send({
        success: true,
        data: {
          id: store.id,
          shoplineId: store.shoplineId,
          name: store.name,
          domain: store.domain,
          isActive: store.isActive,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt
        }
      })
    } catch (error) {
      fastify.log.error('Get store error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })

  // Store Info API（需要登入）
  fastify.get('/api/stores/:handle/info', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      
      const storeInfo = await shoplineService.getStoreInfoFromAPI(handle)
      
      return reply.send({
        success: true,
        data: storeInfo
      })
    } catch (error: any) {
      fastify.log.error('Get store info error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // Products API（需要登入）
  fastify.get('/api/stores/:handle/products', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const { page, limit, ids } = request.query as { page?: string; limit?: string; ids?: string }
      
      const params: any = {}
      if (page) params.page = parseInt(page)
      if (limit) params.limit = parseInt(limit)
      if (ids) params.ids = ids
      
      const products = await shoplineService.getProducts(handle, params)
      
      return reply.send({
        success: true,
        data: products
      })
    } catch (error: any) {
      fastify.log.error('Get products error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  fastify.get('/api/stores/:handle/products/:productId', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle, productId } = request.params as { handle: string; productId: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const product = await shoplineService.getProduct(handle, productId)
      
      return reply.send({
        success: true,
        data: product
      })
    } catch (error: any) {
      fastify.log.error('Get product error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      if (error.message?.includes('not found')) {
        return reply.status(404).send({
          success: false,
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  fastify.post('/api/stores/:handle/products', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const productData = request.body as any
      
      const product = await shoplineService.createProduct(handle, productData)
      
      return reply.status(201).send({
        success: true,
        data: product
      })
    } catch (error: any) {
      fastify.log.error('Create product error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // Locations API（需要登入）
  fastify.get('/api/stores/:handle/locations', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const locations = await shoplineService.getLocations(handle)
      
      return reply.send({
        success: true,
        data: locations
      })
    } catch (error: any) {
      fastify.log.error('Get locations error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // Orders API（需要登入）
  fastify.get('/api/stores/:handle/orders', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const { page, limit, status } = request.query as { page?: string; limit?: string; status?: string }
      
      const params: any = {}
      if (page) params.page = parseInt(page)
      if (limit) params.limit = parseInt(limit)
      if (status) params.status = status
      
      const orders = await shoplineService.getOrders(handle, params)
      
      return reply.send({
        success: true,
        data: orders
      })
    } catch (error: any) {
      fastify.log.error('Get orders error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  fastify.post('/api/stores/:handle/orders', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.params as { handle: string }
      const userId = request.user.id
      
      // 驗證 handle 是否屬於當前使用者
      const hasAccess = await verifyStoreHandleOwnership(handle, userId)
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden: Store does not belong to current user'
        })
      }
      const orderData = request.body as any
      
      const order = await shoplineService.createOrder(handle, orderData)
      
      return reply.status(201).send({
        success: true,
        data: order
      })
    } catch (error: any) {
      fastify.log.error('Create order error:', error)
      
      if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_EXPIRED',
          error: error.message
        })
      }
      
      return reply.status(500).send({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  })

  // Next Engine OAuth 完成 Connection 建立
  // POST /api/auth/next-engine/complete
  // 前端在授權完成後，使用 uid 從 Redis 取得 token，然後建立 Connection
  fastify.post('/api/auth/next-engine/complete', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }

      const userId = request.user.id
      const { uid, state } = request.body as { uid: string; state: string }

      if (!uid || !state) {
        return reply.status(400).send({
          success: false,
          error: 'Missing uid or state'
        })
      }

      // 從 Redis 取得 token 資訊
      const { getRedisClient } = await import('../utils/redis')
      const redis = getRedisClient()
      
      if (!redis) {
        return reply.status(500).send({
          success: false,
          error: 'Redis not available'
        })
      }

      const redisKey = `oauth:next-engine:token:${uid}`
      const tokenDataStr = await redis.get(redisKey)
      
      if (!tokenDataStr) {
        return reply.status(400).send({
          success: false,
          error: 'Token data not found or expired',
          details: '授權 token 已過期或不存在。請重新授權。'
        })
      }

      const tokenData = JSON.parse(tokenDataStr)
      
      // 驗證 state 是否匹配
      if (tokenData.state !== state) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid state',
          details: 'State 參數不匹配。請重新授權。'
        })
      }

      // 刪除 Redis key（一次性使用）
      await redis.del(redisKey)

      // 取得 Next Engine Adapter
      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine')

      // 取得公司資訊（用於 displayName）
      const identityResult = await adapter.getIdentity(tokenData.accessToken)

      if (!identityResult.success) {
        fastify.log.warn('Get identity failed:', identityResult.error)
        // 繼續處理，使用 uid 作為 displayName
      }

      // 建立或更新 Connection
      const companyId = identityResult.success ? identityResult.data.id : uid
      const displayName = identityResult.success ? identityResult.data.name : `Next Engine (${uid.substring(0, 8)}...)`

      // 準備 authPayload（儲存為 JSON 字串）
      // 注意：如果 Next Engine 回傳的 expiresAt 不完整，我們需要根據首次授權時間（現在）計算
      // access_token 有效期限：1 天（從首次授權時間開始計算）
      // refresh_token 有效期限：3 天（從首次授權時間開始計算）
      const now = new Date()
      const accessTokenExpiresAt = tokenData.expiresAt || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // +1 天
      const refreshTokenExpiresAt = tokenData.refreshExpiresAt || new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() // +3 天
      
      const authPayload = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: accessTokenExpiresAt,
        refreshExpiresAt: refreshTokenExpiresAt,
        uid: uid,
        state: state,
        // 保留原始 response 以便追查（開發階段）
        rawResponse: tokenData.rawResponse || null,
        // 記錄首次授權時間（用於計算到期時間）
        firstAuthorizedAt: now.toISOString(),
      }
      
      // 完整記錄 token 資訊（開發階段，方便追查）
      fastify.log.info('Next Engine token data:', {
        expiresAt: accessTokenExpiresAt,
        refreshExpiresAt: refreshTokenExpiresAt,
        rawResponse: tokenData.rawResponse,
        firstAuthorizedAt: now.toISOString(),
      })

      const connection = await connectionRepository.upsertConnection({
        userId,
        platform: 'next-engine',
        externalAccountId: companyId,
        displayName,
        authPayload,
        status: 'active'
      })

      // 同步店舖資料（Story 5.2）
      try {
        const shopsResult = await adapter.getShops(tokenData.accessToken)
        if (shopsResult.success && shopsResult.data.length > 0) {
          // 取得現有的 Connection Items（避免重複建立）
          const existingItems = await connectionRepository.findConnectionItems(connection.id)
          const existingShopIds = new Set(existingItems.map(item => item.externalResourceId))

          let createdCount = 0
          for (const shop of shopsResult.data) {
            const shopId = shop.shop_id || shop.shopId || String(shop.id || '')
            
            // 如果已存在，跳過
            if (existingShopIds.has(shopId)) {
              continue
            }

            // 建立新的 Connection Item
            await connectionRepository.createConnectionItem({
              integrationAccountId: connection.id,
              platform: 'next-engine',
              externalResourceId: shopId,
              displayName: shop.shop_name || shop.shopName || shop.name || `Shop ${shopId}`,
              metadata: {
                shopId: shopId,
                shopName: shop.shop_name || shop.shopName,
                shopAbbreviatedName: shop.shop_abbreviated_name || shop.shopAbbreviatedName,
                shopNote: shop.shop_note || shop.shopNote,
              },
              status: 'active'
            })
            createdCount++
          }
          
          if (createdCount > 0) {
            fastify.log.info(`✅ 已同步 ${createdCount} 個新店舖到 Connection ${connection.id}`)
          }
        }
      } catch (error: any) {
        fastify.log.warn('同步店舖資料失敗（不影響授權流程）:', error.message)
      }

      // 記錄審計
      await auditLogRepository.createAuditLog({
        userId,
        connectionId: connection.id,
        operation: 'connection.create',
        result: 'success',
        metadata: { platform: 'next-engine', companyId, displayName }
      })

      fastify.log.info('✅ Next Engine Connection 建立成功:', connection.id)

      return reply.send({
        success: true,
        data: {
          connectionId: connection.id,
          displayName,
          platform: 'next-engine'
        }
      })
    } catch (error: any) {
      fastify.log.error('Next Engine complete error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // 健康檢查
  fastify.get('/api/health', async (request, reply) => {
    const startTime = Date.now()
    
    try {
      // 檢查資料庫連線
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // 簡單的資料庫查詢測試
      await prisma.$queryRaw`SELECT 1`
      await prisma.$disconnect()
      
      const responseTime = Date.now() - startTime
      
    return reply.send({
      success: true,
      message: 'Service is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        database: 'connected',
        environment: process.env.NODE_ENV || 'development'
      })
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      fastify.log.error('Health check error:', error)
      
      return reply.status(503).send({
        success: false,
        message: 'Service health check failed',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        error: error.message || 'Unknown error',
        database: 'disconnected',
        environment: process.env.NODE_ENV || 'development'
      })
    }
  })
}
