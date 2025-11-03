import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'

const shoplineService = new ShoplineService()

export async function apiRoutes(fastify: FastifyInstance, options: any) {
  // 取得所有已授權的商店
  fastify.get('/api/stores', async (request, reply) => {
    try {
      const stores = await shoplineService.getAllStores()
      
      return reply.send({
        success: true,
        data: stores
      })
    } catch (error) {
      fastify.log.error('Get stores error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      })
    }
  })

  // 取得特定商店資訊
  fastify.get('/api/stores/:shopId', async (request, reply) => {
    try {
      const { shopId } = request.params as { shopId: string }
      const store = await shoplineService.getStoreInfo(shopId)
      
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

  // 健康檢查
  fastify.get('/api/health', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Service is running',
      timestamp: new Date().toISOString()
    })
  })
}
