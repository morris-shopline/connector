import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { ShoplineAdapter } from '../services/shoplineAdapter'
import { NextEngineAdapter } from '../services/nextEngine'
import { authMiddleware } from '../middleware/auth'
import { requireConnectionOwner } from '../middleware/requireConnectionOwner'
import { filterStoresByUser, verifyStoreOwnership, verifyStoreHandleOwnership, getShoplineStoreWithToken, handleRouteError } from '../utils/query-filter'
import { connectionRepository } from '../repositories/connectionRepository'
import { auditLogRepository } from '../repositories/auditLogRepository'
import { PlatformServiceFactory } from '../services/platformServiceFactory'

const shoplineService = new ShoplineService() // 保留用於資料庫操作（getStoreByHandle）

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
        const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter
        const orderSummary = await adapter.getOrderSummary(accessToken)

        if (!orderSummary.success) {
          const errorResult = orderSummary as { success: false; error: any }
          // 記錄錯誤
          await auditLogRepository.createAuditLog({
            userId: request.user.id,
            connectionId: connection.id,
            operation: 'connection.orders.summary',
            result: 'error',
            errorCode: errorResult.error.type,
            errorMessage: errorResult.error.message,
            metadata: { platform: 'next-engine', raw: errorResult.error.raw }
          })

          return reply.status(400).send({
            success: false,
            code: errorResult.error.type,
            error: errorResult.error.message
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
      try {
        // 跳過 OPTIONS 請求（CORS preflight）
        if (request.method === 'OPTIONS') {
          return
        }

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

        // 驗證 integrationAccountId 是否存在
        if (!item.integrationAccountId) {
          fastify.log.error('ConnectionItem missing integrationAccountId:', { itemId, item })
          return reply.status(500).send({
            success: false,
            code: 'INVALID_CONNECTION_ITEM',
            error: 'Connection Item is missing integration account reference'
          })
        }

        // 將 connectionId 放入 params，讓 requireConnectionOwner 可以驗證
        ;(request.params as any).connectionId = item.integrationAccountId
        
        // ⚠️ 關鍵修復：加上 await，確保 Promise 被正確處理
        await requireConnectionOwner(request as any, reply)
      } catch (error: any) {
        fastify.log.error('Connection item middleware error:', {
          error: error.message,
          stack: error.stack,
          itemId: (request.params as any).id,
          url: request.url,
          method: request.method,
        })

        // 如果已經有回應，跳過
        if (reply.sent) {
          return
        }

        return reply.status(500).send({
          success: false,
          code: 'INTERNAL_ERROR',
          error: 'Internal server error'
        })
      }
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const storeInfo = await adapter.getStoreInfoFromAPI(store.accessToken, handle)
      
      return reply.send({
        success: true,
        data: storeInfo
      })
    } catch (error: any) {
      fastify.log.error('Get store info error:', error)
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      const { page, limit, ids } = request.query as { page?: string; limit?: string; ids?: string }
      
      const params: any = {}
      if (page) params.page = parseInt(page)
      if (limit) params.limit = parseInt(limit)
      if (ids) params.ids = ids
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const products = await adapter.getProducts(store.accessToken, handle, params)
      
      return reply.send({
        success: true,
        data: products
      })
    } catch (error: any) {
      fastify.log.error('Get products error:', error)
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const product = await adapter.getProduct(store.accessToken, handle, productId)
      
      return reply.send({
        success: true,
        data: product
      })
    } catch (error: any) {
      fastify.log.error('Get product error:', error)
      
      // 處理 404 錯誤（產品不存在）
      if (error.message?.includes('not found')) {
        return reply.status(404).send({
          success: false,
          code: 'PRODUCT_NOT_FOUND',
          error: error.message
        })
      }
      
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      const productData = request.body as any
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const product = await adapter.createProduct(store.accessToken, handle, productData)
      
      return reply.status(201).send({
        success: true,
        data: product
      })
    } catch (error: any) {
      fastify.log.error('Create product error:', error)
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const locations = await adapter.getLocations(store.accessToken, handle)
      
      return reply.send({
        success: true,
        data: locations
      })
    } catch (error: any) {
      fastify.log.error('Get locations error:', error)
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      const { page, limit, status } = request.query as { page?: string; limit?: string; status?: string }
      
      const params: any = {}
      if (page) params.page = parseInt(page)
      if (limit) params.limit = parseInt(limit)
      if (status) params.status = status
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const orders = await adapter.getOrders(store.accessToken, handle, params)
      
      return reply.send({
        success: true,
        data: orders
      })
    } catch (error: any) {
      fastify.log.error('Get orders error:', error)
      return handleRouteError(error, reply)
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
      
      // 取得 store 和 accessToken（統一驗證邏輯）
      const store = await getShoplineStoreWithToken(handle, shoplineService)
      
      const orderData = request.body as any
      
      // 透過 PlatformServiceFactory 取得 ShoplineAdapter
      const adapter = PlatformServiceFactory.getAdapter('shopline') as ShoplineAdapter
      const order = await adapter.createOrder(store.accessToken, handle, orderData)
      
      return reply.status(201).send({
        success: true,
        data: order
      })
    } catch (error: any) {
      fastify.log.error('Create order error:', error)
      return handleRouteError(error, reply)
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
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      // 取得公司資訊（用於 displayName）
      const identityResult = await adapter.getIdentity(tokenData.accessToken)

      if (!identityResult.success) {
        fastify.log.warn('Get identity failed:', (identityResult as { success: false; error: any }).error)
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
        const neAdapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter
        const shopsResult = await neAdapter.getShops(tokenData.accessToken)
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

  // === Story 5.3.1: Next Engine API 代理端點（用於 API 測試） ===

  // 取得店舖列表
  fastify.post('/api/connections/:connectionId/shops/search', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      const body = request.body as any
      const fields = body.fields || 'shop_id,shop_name,shop_abbreviated_name,shop_note'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
      })

      const response = await fetch('https://api.next-engine.org/api_v1_master_shop/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      const data: any = await response.json()

      // Next Engine API 錯誤檢查：檢查 code 或 result
      if (data.code && data.code !== '000000') {
        const errorMessage = data.error_description || data.error || data.message || `Next Engine API error (code: ${data.code})`
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.shops.search',
          result: 'error',
          metadata: { connectionId, error: errorMessage, code: data.code }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      if (data.result !== 'success') {
        const errorMessage = data.error_description || data.error || data.message || 'Next Engine API error'
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.shops.search',
          result: 'error',
          metadata: { connectionId, error: errorMessage, raw: data }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.shops.search',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: data })
    } catch (error: any) {
      fastify.log.error('Next Engine shops/search error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to search shops'
      })
    }
  })

  // 建立店舖
  fastify.post('/api/connections/:connectionId/shops/create', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      const body = request.body as any
      const xmlData = body.data

      if (!xmlData) {
        return reply.status(400).send({
          success: false,
          code: 'MISSING_DATA',
          error: 'XML data is required'
        })
      }

      const params = new URLSearchParams({
        access_token: accessToken,
        data: xmlData,
        wait_flag: '1',
      })

      const response = await fetch('https://api.next-engine.org/api_v1_master_shop/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      const data: any = await response.json()

      // Next Engine API 錯誤檢查：檢查 code 或 result
      if (data.code && data.code !== '000000') {
        const errorMessage = data.error_description || data.error || data.message || `Next Engine API error (code: ${data.code})`
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.shops.create',
          result: 'error',
          metadata: { connectionId, error: errorMessage, code: data.code }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      if (data.result !== 'success') {
        const errorMessage = data.error_description || data.error || data.message || 'Next Engine API error'
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.shops.create',
          result: 'error',
          metadata: { connectionId, error: errorMessage, raw: data }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.shops.create',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: data })
    } catch (error: any) {
      fastify.log.error('Next Engine shops/create error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to create shop'
      })
    }
  })

  // 查詢商品
  fastify.post('/api/connections/:connectionId/goods/search', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      const body = request.body as any
      const fields = body.fields || 'goods_id,goods_name,stock_quantity,supplier_name'
      const offset = body.offset || '0'
      const limit = body.limit || '100'

      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        offset: offset,
        limit: limit,
      })

      if (body.goods_id_eq) {
        params.append('goods_id-eq', body.goods_id_eq)
      }

      const response = await fetch('https://api.next-engine.org/api_v1_master_goods/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      const data: any = await response.json()

      // Next Engine API 錯誤檢查：檢查 code 或 result
      if (data.code && data.code !== '000000') {
        const errorMessage = data.error_description || data.error || data.message || `Next Engine API error (code: ${data.code})`
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.goods.search',
          result: 'error',
          metadata: { connectionId, error: errorMessage, code: data.code }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      if (data.result !== 'success') {
        const errorMessage = data.error_description || data.error || data.message || 'Next Engine API error'
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.goods.search',
          result: 'error',
          metadata: { connectionId, error: errorMessage, raw: data }
        })
        return reply.status(response.ok ? 200 : response.status).send({
          success: false,
          code: 'NEXT_ENGINE_API_ERROR',
          error: errorMessage
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.goods.search',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: data })
    } catch (error: any) {
      fastify.log.error('Next Engine goods/search error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to search goods'
      })
    }
  })

  // Story 5.5: 建立商品（支援動態產生測試資料）
  fastify.post('/api/connections/:connectionId/goods/upload', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const body = request.body as any

      // 支援動態參數或 CSV 資料
      const result = await adapter.createProduct(accessToken, {
        productCode: body.productCode,
        productName: body.productName,
        price: body.price ? parseInt(body.price) : undefined,
        cost: body.cost ? parseInt(body.cost) : undefined,
        csvData: body.csvData || body.data, // 保留向後相容
      })

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.goods.upload',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.goods.upload',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine goods/upload error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to upload goods'
      })
    }
  })

  // Story 5.5: 查詢主倉庫存
  fastify.post('/api/connections/:connectionId/inventory', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const body = request.body as any
      const result = await adapter.getMasterStock(accessToken, body.productCode)

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.inventory.master',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.inventory.master',
        result: 'success',
        metadata: { connectionId, productCode: body.productCode }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine inventory/master error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get master stock'
      })
    }
  })

  // Story 5.5: 查詢分倉庫存
  fastify.post('/api/connections/:connectionId/inventory/warehouse/:warehouseId', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId, warehouseId } = request.params as { connectionId: string; warehouseId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const body = (request.body || {}) as { productCode?: string }
      const safeWarehouseId = (warehouseId || '').trim() || 'default'
      const result = await adapter.getWarehouseStock(accessToken, body.productCode, safeWarehouseId)

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.inventory.warehouse.search',
          result: 'error',
          metadata: { connectionId, warehouseId: safeWarehouseId, productCode: body.productCode, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.inventory.warehouse.search',
        result: 'success',
        metadata: { connectionId, warehouseId: safeWarehouseId, productCode: body.productCode }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine inventory/warehouse search error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get warehouse stock'
      })
    }
  })

  // Story 5.5: 查詢倉庫列表
  fastify.post('/api/connections/:connectionId/warehouses', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const result = await adapter.getWarehouses(accessToken)

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.warehouses',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.warehouses',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine warehouses error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get warehouses'
      })
    }
  })

  // Story 5.5: 更新分倉庫存
  fastify.post('/api/connections/:connectionId/inventory/warehouse', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      const body = request.body as any

      if (!body.productCode || body.newStock === undefined) {
        return reply.status(400).send({
          success: false,
          code: 'MISSING_PARAMETERS',
          error: 'productCode and newStock are required'
        })
      }

      const rawWarehouseId = (body.warehouseId || body.warehouse_id || '').toString().trim()
      const warehouseId = rawWarehouseId || 'default'

      const newStockValue =
        typeof body.newStock === 'string'
          ? parseInt(body.newStock, 10)
          : Number(body.newStock)

      if (Number.isNaN(newStockValue)) {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PARAMETERS',
          error: 'newStock must be a valid number'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const result = await adapter.updateWarehouseStock(accessToken, {
        productCode: body.productCode,
        newStock: newStockValue,
        warehouseId,
        warehouseName: body.warehouseName,
      })

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.inventory.update',
          result: 'error',
          metadata: { connectionId, warehouseId, productCode: body.productCode, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      const responseData = result.data

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.inventory.update',
        result: 'success',
        metadata: {
          connectionId,
          productCode: body.productCode,
          newStock: newStockValue,
          warehouseId: responseData.warehouseId,
          warehouseName: responseData.warehouseName,
          diff: responseData.diff
        }
      })

      return reply.send({ success: true, data: responseData })
    } catch (error: any) {
      fastify.log.error('Next Engine inventory/update error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to update warehouse stock'
      })
    }
  })

  // Story 5.5: 查詢庫存更新佇列狀態
  fastify.get('/api/connections/:connectionId/inventory/queue/:queueId', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId, queueId } = request.params as { connectionId: string; queueId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const result = await adapter.getQueueStatus(accessToken, queueId)

      if (!result.success) {
        // 這是真正的 API 呼叫失敗（例如：連線錯誤、認證失敗等）
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.inventory.queue-status',
          result: 'error',
          metadata: { 
            connectionId, 
            queueId, 
            error: error.message, 
            errorType: error.type, 
            raw: error.raw
          }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      // API 呼叫成功，記錄結果（無論佇列處理成功或失敗）
      const queueData = result.data
      const queStatusId = queueData.que_status_id
      const isQueueFailed = queStatusId === -1 || queStatusId === '-1'
      
      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.inventory.queue-status',
        result: isQueueFailed ? 'queue_failed' : 'success', // 區分 API 成功但佇列失敗的情況
        metadata: { 
          connectionId, 
          queueId,
          queStatusId,
          queMessage: queueData.que_message,
          queMethodName: queueData.que_method_name,
          queUploadName: queueData.que_upload_name,
          queFileName: queueData.que_file_name,
        }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine inventory queue status error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get queue status'
      })
    }
  })

  // Story 5.6: 查詢訂單 Base
  fastify.post('/api/connections/:connectionId/orders/base', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const body = request.body as any
      const result = await adapter.getOrderBase(accessToken, {
        shopId: body.shopId,
        orderId: body.orderId,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        offset: body.offset ? parseInt(body.offset, 10) : undefined,
        limit: body.limit ? parseInt(body.limit, 10) : undefined,
      })

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.orders.base',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.orders.base',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine orders/base error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get order base'
      })
    }
  })

  // Story 5.6: 查詢訂單 Rows（明細）
  fastify.post('/api/connections/:connectionId/orders/rows', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const body = request.body as any
      const result = await adapter.getOrderRows(accessToken, {
        orderId: body.orderId,
        productCode: body.productCode,
        shopId: body.shopId,
        offset: body.offset ? parseInt(body.offset, 10) : undefined,
        limit: body.limit ? parseInt(body.limit, 10) : undefined,
      })

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.orders.rows',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.orders.rows',
        result: 'success',
        metadata: { connectionId }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine orders/rows error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to get order rows'
      })
    }
  })

  // Story 5.6: 扣庫分析
  fastify.post('/api/connections/:connectionId/orders/analyze-allocation', {
    preHandler: [authMiddleware, requireConnectionOwner]
  }, async (request, reply) => {
    try {
      const { connectionId } = request.params as { connectionId: string }
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          code: 'CONNECTION_NOT_FOUND',
          error: 'Connection not found'
        })
      }

      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          code: 'INVALID_PLATFORM',
          error: 'This endpoint is only for Next Engine connections'
        })
      }

      const authPayload = connection.authPayload as any
      const accessToken = authPayload.accessToken

      if (!accessToken) {
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_NOT_FOUND',
          error: 'Access token not found in connection'
        })
      }

      const body = request.body as any

      if (!body.productCode) {
        return reply.status(400).send({
          success: false,
          code: 'MISSING_PARAMETERS',
          error: 'productCode is required'
        })
      }

      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine') as NextEngineAdapter

      const result = await adapter.analyzeStockAllocation(accessToken, body.productCode)

      if (!result.success) {
        const error = result.error
        await auditLogRepository.createAuditLog({
          userId: request.user!.id,
          operation: 'next-engine.orders.analyze-allocation',
          result: 'error',
          metadata: { connectionId, error: error.message, errorType: error.type, raw: error.raw }
        })
        return reply.status(400).send({
          success: false,
          code: error.type || 'NEXT_ENGINE_API_ERROR',
          error: error.message
        })
      }

      await auditLogRepository.createAuditLog({
        userId: request.user!.id,
        operation: 'next-engine.orders.analyze-allocation',
        result: 'success',
        metadata: { connectionId, productCode: body.productCode }
      })

      return reply.send({ success: true, data: result.data })
    } catch (error: any) {
      fastify.log.error('Next Engine orders/analyze-allocation error:', error)
      return reply.status(500).send({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Failed to analyze stock allocation'
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
