/**
 * Next Engine 資料 API 自動化測試
 * 
 * Story 5.2: 測試 Connection Items 與訂單摘要 API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Fastify from 'fastify'
import { apiRoutes } from '../api'

// Mock dependencies
vi.mock('../../services/platformServiceFactory', () => ({
  PlatformServiceFactory: {
    initialize: vi.fn(),
    getAdapter: vi.fn(() => ({
      getShops: vi.fn(),
      getOrderSummary: vi.fn(),
    })),
  },
}))

vi.mock('../../repositories/connectionRepository', () => ({
  connectionRepository: {
    findConnectionById: vi.fn(),
    findConnectionItems: vi.fn(),
  },
}))

vi.mock('../../repositories/auditLogRepository', () => ({
  auditLogRepository: {
    createAuditLog: vi.fn(),
  },
}))

vi.mock('../../middleware/auth', () => ({
  authMiddleware: async (request: any, reply: any) => {
    request.user = { id: 'test-user-id' }
  },
}))

vi.mock('../../middleware/requireConnectionOwner', () => ({
  requireConnectionOwner: async (request: any, reply: any) => {
    // 驗證通過
  },
}))

describe('Next Engine Data API Routes', () => {
  let app: any

  beforeEach(async () => {
    app = Fastify()
    await app.register(apiRoutes)
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /api/connections/:connectionId/items', () => {
    it('應該回傳 Connection Items', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')

      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue({
        id: 'test-connection-id',
        userId: 'test-user-id',
        platform: 'next-engine',
        externalAccountId: 'test-company-id',
        displayName: 'Test Company',
        authPayload: {},
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      vi.mocked(connectionRepository.findConnectionItems).mockResolvedValue([
        {
          id: 'item-1',
          integrationAccountId: 'test-connection-id',
          platform: 'next-engine',
          externalResourceId: 'shop-1',
          displayName: 'Shop 1',
          metadata: { shopId: 'shop-1', shopName: 'Shop 1' },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/connections/test-connection-id/items',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toBeDefined()
      expect(Array.isArray(body.data)).toBe(true)
    })

    it('Connection 不存在時應該回傳 404', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/connections/non-existent-id/items',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/connections/:connectionId/orders/summary', () => {
    it('應該回傳訂單摘要', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      const { PlatformServiceFactory } = await import('../../services/platformServiceFactory')

      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue({
        id: 'test-connection-id',
        userId: 'test-user-id',
        platform: 'next-engine',
        externalAccountId: 'test-company-id',
        displayName: 'Test Company',
        authPayload: {
          accessToken: 'test-access-token',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const mockAdapter = {
        getOrderSummary: vi.fn().mockResolvedValue({
          success: true,
          data: {
            total: 100,
            lastUpdated: '2025-01-01 12:00:00',
          },
        }),
      }

      vi.mocked(PlatformServiceFactory.getAdapter).mockReturnValue(mockAdapter as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/connections/test-connection-id/orders/summary',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.total).toBe(100)
    })

    it('API 錯誤時應該回傳錯誤碼', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      const { PlatformServiceFactory } = await import('../../services/platformServiceFactory')

      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue({
        id: 'test-connection-id',
        userId: 'test-user-id',
        platform: 'next-engine',
        externalAccountId: 'test-company-id',
        displayName: 'Test Company',
        authPayload: {
          accessToken: 'test-access-token',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const mockAdapter = {
        getOrderSummary: vi.fn().mockResolvedValue({
          success: false,
          error: {
            type: 'TOKEN_EXPIRED',
            message: 'Token expired',
          },
        }),
      }

      vi.mocked(PlatformServiceFactory.getAdapter).mockReturnValue(mockAdapter as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/connections/test-connection-id/orders/summary',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.code).toBe('TOKEN_EXPIRED')
    })
  })
})

