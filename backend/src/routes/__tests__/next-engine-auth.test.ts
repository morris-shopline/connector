/**
 * Next Engine OAuth API 路由自動化測試
 * 
 * Story 5.1: 測試 OAuth API 端點
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import Fastify from 'fastify'
import { authRoutes } from '../auth'

// Mock dependencies
vi.mock('../../services/platformServiceFactory', () => ({
  PlatformServiceFactory: {
    initialize: vi.fn(),
    getAdapter: vi.fn(() => ({
      getAuthorizeUrl: vi.fn((state: string) => `https://base.next-engine.org/users/sign_in/?state=${state}`),
      exchangeToken: vi.fn(),
      refreshToken: vi.fn(),
      getIdentity: vi.fn(),
    })),
  },
}))

vi.mock('../../repositories/connectionRepository', () => ({
  connectionRepository: {
    upsertConnection: vi.fn(),
    findConnectionById: vi.fn(),
  },
}))

vi.mock('../../repositories/auditLogRepository', () => ({
  auditLogRepository: {
    createAuditLog: vi.fn(),
  },
}))

vi.mock('../../utils/redis', () => ({
  getRedisClient: vi.fn(() => ({
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  })),
}))

vi.mock('../../utils/state', () => ({
  encryptState: vi.fn((input: string) => `encrypted:${input}`),
  decryptState: vi.fn((input: string) => input.replace('encrypted:', '')),
}))

vi.mock('../../middleware/auth', () => ({
  authMiddleware: async (request: any, reply: any) => {
    request.user = { id: 'test-user-id' }
  },
}))

describe('Next Engine OAuth API Routes', () => {
  let app: any

  beforeEach(async () => {
    app = Fastify()
    await app.register(authRoutes)
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /api/auth/next-engine/install', () => {
    it('應該回傳授權 URL 和 state', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/next-engine/install',
        headers: {
          authorization: 'Bearer test-token',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.authUrl).toBeDefined()
      expect(body.state).toBeDefined()
    })

    it.skip('未登入時應該回傳 401', async () => {
      // 這個測試需要實際的 authMiddleware 實作才能正確測試
      // 由於我們 mock 了 middleware，無法測試真實的認證流程
      // 實際的認證測試應該在 middleware 的單元測試中進行
    })
  })

  describe('GET /api/auth/next-engine/callback', () => {
    it('缺少必要參數時應該回傳 400', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/next-engine/callback',
        query: {},
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe('Missing required parameters')
    })

    it('有 uid 和 state 時應該處理 callback', async () => {
      const { PlatformServiceFactory } = await import('../../services/platformServiceFactory')
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      const { auditLogRepository } = await import('../../repositories/auditLogRepository')

      // Mock adapter methods
      const mockAdapter = {
        exchangeToken: vi.fn().mockResolvedValue({
          success: true,
          data: {
            accessToken: 'test-token',
            refreshToken: 'test-refresh',
            expiresAt: '2025-12-31T23:59:59.000Z',
            refreshExpiresAt: '2026-01-31T23:59:59.000Z',
          },
        }),
        getIdentity: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: 'test-company-id',
            name: 'Test Company',
          },
        }),
      }

      vi.mocked(PlatformServiceFactory.getAdapter).mockReturnValue(mockAdapter as any)
      vi.mocked(connectionRepository.upsertConnection).mockResolvedValue({
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

      const { getRedisClient } = await import('../../utils/redis')
      const mockRedis = {
        get: vi.fn().mockResolvedValue('test-user-id'),
        setex: vi.fn(),
        del: vi.fn(),
      }
      vi.mocked(getRedisClient).mockReturnValue(mockRedis as any)

      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/next-engine/callback',
        query: {
          uid: 'test-uid',
          state: 'encrypted:test-session-id',
        },
      })

      // 應該重導向到前端
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toContain('/connections')
      expect(response.headers.location).toContain('platform=next-engine')
    })
  })

  describe('POST /api/auth/next-engine/refresh', () => {
    it('缺少 connectionId 時應該回傳 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/next-engine/refresh',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toBe('Connection ID is required')
    })

    it('Connection 不存在時應該回傳 404', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/next-engine/refresh',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          connectionId: 'non-existent-id',
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('成功刷新 Token 時應該回傳新的 Token', async () => {
      const { connectionRepository } = await import('../../repositories/connectionRepository')
      const { PlatformServiceFactory } = await import('../../services/platformServiceFactory')

      vi.mocked(connectionRepository.findConnectionById).mockResolvedValue({
        id: 'test-connection-id',
        userId: 'test-user-id',
        platform: 'next-engine',
        externalAccountId: 'test-company-id',
        authPayload: {
          refreshToken: 'old-refresh-token',
          uid: 'test-uid',
          state: 'test-state',
        },
      } as any)

      const mockAdapter = {
        refreshToken: vi.fn().mockResolvedValue({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: '2025-12-31T23:59:59.000Z',
            refreshExpiresAt: '2026-01-31T23:59:59.000Z',
          },
        }),
      }

      vi.mocked(PlatformServiceFactory.getAdapter).mockReturnValue(mockAdapter as any)
      vi.mocked(connectionRepository.upsertConnection).mockResolvedValue({} as any)

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/next-engine/refresh',
        headers: {
          authorization: 'Bearer test-token',
        },
        payload: {
          connectionId: 'test-connection-id',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.accessToken).toBe('new-access-token')
    })
  })
})

