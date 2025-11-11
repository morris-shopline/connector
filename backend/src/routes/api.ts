import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { authMiddleware } from '../middleware/auth'
import { requireConnectionOwner } from '../middleware/requireConnectionOwner'
import { filterStoresByUser, verifyStoreOwnership, verifyStoreHandleOwnership } from '../utils/query-filter'
import { connectionRepository } from '../repositories/connectionRepository'
import { auditLogRepository } from '../repositories/auditLogRepository'

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
