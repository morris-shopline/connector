/**
 * Next Engine Adapter 自動化測試
 * 
 * Story 5.1: 測試 Next Engine OAuth 流程的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextEngineAdapter } from '../nextEngine'
import { PlatformServiceFactory } from '../platformServiceFactory'

// Mock fetch
global.fetch = vi.fn()

describe('NextEngineAdapter', () => {
  let adapter: NextEngineAdapter

  beforeEach(() => {
    // 設定環境變數
    process.env.NEXTENGINE_CLIENT_ID = 'test-client-id'
    process.env.NEXTENGINE_CLIENT_SECRET = 'test-client-secret'
    process.env.NEXTENGINE_REDIRECT_URI = 'https://example.com/callback'

    adapter = new NextEngineAdapter()
    vi.clearAllMocks()
  })

  describe('getAuthorizeUrl', () => {
    it('應該回傳正確的授權 URL，包含 client_id、redirect_uri 和 state', () => {
      const state = 'test-state-12345'
      const authUrl = adapter.getAuthorizeUrl(state)

      expect(authUrl).toContain('base.next-engine.org/users/sign_in/')
      expect(authUrl).toContain('client_id=test-client-id')
      expect(authUrl).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback')
      expect(authUrl).toContain('state=test-state-12345')
    })
  })

  describe('exchangeToken', () => {
    it('成功時應該回傳 Token payload', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        access_token_end_date: '2025-12-31 23:59:59',
        refresh_token_end_date: '2026-01-31 23:59:59',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.exchangeToken('test-uid', 'test-state')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.accessToken).toBe('test-access-token')
        expect(result.data.refreshToken).toBe('test-refresh-token')
        expect(result.data.expiresAt).toBeDefined()
        expect(result.data.refreshExpiresAt).toBeDefined()
      }
    })

    it('錯誤碼 002002 應該映射為 TOKEN_EXPIRED', async () => {
      const mockResponse = {
        code: '002002',
        error_description: 'Token expired',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.exchangeToken('test-uid', 'test-state')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('TOKEN_EXPIRED')
        expect(result.error.message).toBe('Token expired')
      }
    })

    it('錯誤碼 002003 應該映射為 TOKEN_REFRESH_FAILED', async () => {
      const mockResponse = {
        code: '002003',
        error_description: 'Refresh failed',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.exchangeToken('test-uid', 'test-state')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('TOKEN_REFRESH_FAILED')
      }
    })

    it('未知錯誤碼應該映射為 PLATFORM_UNKNOWN', async () => {
      const mockResponse = {
        code: '999999',
        error_description: 'Unknown error',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.exchangeToken('test-uid', 'test-state')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('PLATFORM_UNKNOWN')
        expect(result.error.raw).toBeDefined()
      }
    })

    it('網路錯誤應該回傳 PLATFORM_ERROR', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await adapter.exchangeToken('test-uid', 'test-state')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('PLATFORM_ERROR')
      }
    })
  })

  describe('refreshToken', () => {
    it('成功時應該回傳新的 Token payload', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        access_token_end_date: '2025-12-31 23:59:59',
        refresh_token_end_date: '2026-01-31 23:59:59',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.refreshToken('old-refresh-token', {
        uid: 'test-uid',
        state: 'test-state',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.accessToken).toBe('new-access-token')
        expect(result.data.refreshToken).toBe('new-refresh-token')
      }
    })

    it('缺少 uid 或 state 應該回傳錯誤', async () => {
      const result = await adapter.refreshToken('refresh-token', {})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('PLATFORM_ERROR')
        expect(result.error.message).toContain('Missing uid or state')
      }
    })

    it('錯誤碼 002003 應該映射為 TOKEN_REFRESH_FAILED', async () => {
      const mockResponse = {
        code: '002003',
        error_description: 'Refresh failed',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.refreshToken('refresh-token', {
        uid: 'test-uid',
        state: 'test-state',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('TOKEN_REFRESH_FAILED')
      }
    })
  })

  describe('getIdentity', () => {
    it('成功時應該回傳公司資訊', async () => {
      const mockResponse = {
        result: 'success',
        data: {
          company_id: 'test-company-id',
          company_name: 'Test Company',
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.getIdentity('test-access-token')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('test-company-id')
        expect(result.data.name).toBe('Test Company')
      }
    })

    it('API 錯誤應該回傳錯誤', async () => {
      const mockResponse = {
        result: 'error',
        code: '002002',
        error_description: 'Token expired',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        json: async () => mockResponse,
      })

      const result = await adapter.getIdentity('expired-token')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('TOKEN_EXPIRED')
      }
    })
  })
})

describe('PlatformServiceFactory', () => {
  beforeEach(() => {
    process.env.NEXTENGINE_CLIENT_ID = 'test-client-id'
    process.env.NEXTENGINE_CLIENT_SECRET = 'test-client-secret'
    process.env.NEXTENGINE_REDIRECT_URI = 'https://example.com/callback'
  })

  it('應該可以註冊並取得 Next Engine Adapter', () => {
    PlatformServiceFactory.initialize()

    expect(PlatformServiceFactory.hasAdapter('next-engine')).toBe(true)

    const adapter = PlatformServiceFactory.getAdapter('next-engine')
    expect(adapter).toBeInstanceOf(NextEngineAdapter)
  })

  it('未註冊的平台應該拋出錯誤', () => {
    PlatformServiceFactory.initialize()

    expect(() => {
      PlatformServiceFactory.getAdapter('unknown-platform' as any)
    }).toThrow('Platform adapter not found: unknown-platform')
  })
})

