import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { authMiddleware } from '../middleware/auth'
import { filterStoresByUser, verifyStoreOwnership, verifyStoreHandleOwnership } from '../utils/query-filter'

const shoplineService = new ShoplineService()

export async function apiRoutes(fastify: FastifyInstance, options: any) {
  // 取得所有已授權的商店（需要登入）
  fastify.get('/api/stores', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const userId = request.user.id
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const stores = await prisma.store.findMany({
        where: filterStoresByUser(userId),
        orderBy: { createdAt: 'desc' },
      })
      
      await prisma.$disconnect()
      
      return reply.send({
        success: true,
        data: stores
      })
    } catch (error) {
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
