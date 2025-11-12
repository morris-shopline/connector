import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { generateRandomString } from '../utils/signature'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { createSession, deleteSession } from '../utils/session'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { ShoplineAuthParams } from '../types'
import { PlatformServiceFactory } from '../services/platformServiceFactory'
import { connectionRepository } from '../repositories/connectionRepository'
import { auditLogRepository } from '../repositories/auditLogRepository'

const shoplineService = new ShoplineService()
const prisma = new PrismaClient()

// 驗證安裝請求的 schema
const installRequestSchema = z.object({
  appkey: z.string(),
  handle: z.string(),
  timestamp: z.string(),
  sign: z.string(),
  lang: z.string().optional()
})

// OAuth 回調的 schema
const callbackSchema = z.object({
  appkey: z.string(),
  code: z.string(),
  handle: z.string(),
  timestamp: z.string(),
  sign: z.string(),
  state: z.string().optional(), // State 參數（包含 Session ID）
  lang: z.string().optional(),
  customField: z.string().optional()
})

export async function authRoutes(fastify: FastifyInstance, options: any) {
  // 取得授權 URL（需要登入，返回包含 state 的授權 URL）
  fastify.get('/api/auth/shopline/authorize', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const { handle } = request.query as { handle: string }
      if (!handle) {
        return reply.status(400).send({
          success: false,
          error: 'Handle is required'
        })
      }
      
      // 取得 Session ID 和 userId（從 request.sessionId 或從 JWT Token 中取得）
      let sessionId: string | null = null
      const userId = request.user.id  // 從 authMiddleware 取得
      
      if (request.sessionId) {
        sessionId = request.sessionId
      } else {
        // 嘗試從 JWT Token 中取得 Session ID
        const authHeader = request.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const { decodeToken } = await import('../utils/jwt')
          const payload = decodeToken(token)
          if (payload && payload.sessionId) {
            sessionId = payload.sessionId
          }
        }
      }
      
      // 生成 state 參數（如果沒有 Session ID，使用隨機字串）
      let state: string
      if (sessionId) {
        const { encryptState } = await import('../utils/state')
        state = encryptState(sessionId)
      } else {
        state = generateRandomString()
      }
      
      // 在 Redis 中暫存 state 和 userId 的對應關係（作為備份，即使 Shopline 不保留 state 也能取得）
      const { getRedisClient } = await import('../utils/redis')
      const redis = getRedisClient()
      if (redis) {
        const redisKeyByState = `oauth:state:${state}`
        const redisKeyByHandleOnly = `oauth:handle:${handle}`  // 備用 key：使用 handle（即使沒有 state 也能取得）
        
        console.log('🔍 [DEBUG] 準備在 Redis 暫存 state 和 userId 對應關係')
        console.log('🔍 [DEBUG] Redis Key (by state):', redisKeyByState)
        console.log('🔍 [DEBUG] Redis Key (by handle only):', redisKeyByHandleOnly)
        console.log('🔍 [DEBUG] UserId:', userId)
        
        // 方法 1: 使用 state 作為 key（主要方式）
        await redis.setex(redisKeyByState, 600, userId)
        console.log('✅ [DEBUG] 已在 Redis 暫存 state 和 userId 對應關係 (by state)')
        
        // 方法 2: 使用 handle 作為 key（備用方式，即使沒有 state 也能取得）
        // 注意：同一個 handle 可能被多個使用者授權，所以使用 handle 作為 key 只能儲存最近的一個
        // 但這已經足夠了，因為 OAuth 流程通常很快，不會有並發問題
        await redis.setex(redisKeyByHandleOnly, 600, userId)
        console.log('✅ [DEBUG] 已在 Redis 暫存 state 和 userId 對應關係 (by handle only)')
        
        // 驗證儲存結果
        const verifyByState = await redis.get(redisKeyByState)
        const verifyByHandleOnly = await redis.get(redisKeyByHandleOnly)
        if (verifyByState === userId && verifyByHandleOnly === userId) {
          console.log('✅ [DEBUG] Redis 暫存驗證成功（兩種方式都成功）')
        } else {
          console.error('❌ [DEBUG] Redis 暫存驗證失敗，預期:', userId, '實際 (by state):', verifyByState, '實際 (by handle only):', verifyByHandleOnly)
        }
        
        fastify.log.info({ msg: '✅ 已在 Redis 暫存 state 和 userId 對應關係', userId })
      } else {
        console.error('❌ [DEBUG] Redis 不可用，無法暫存 state 和 userId 對應關係')
        fastify.log.warn({ msg: '⚠️  Redis 不可用，無法暫存 state 和 userId 對應關係' })
      }
      
      // 生成授權 URL
      const authUrl = shoplineService.generateAuthUrl(state, handle)
      
      return reply.send({
        success: true,
        authUrl,
        state
      })
    } catch (error: any) {
      fastify.log.error('Get authorize URL error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })
  
  // 處理應用安裝請求（保留原有功能，用於直接跳轉）
  fastify.get('/api/auth/shopline/install', async (request, reply) => {
    try {
      const startTime = Date.now()
      fastify.log.info('=== 開始處理 Shopline 安裝請求 ===')
      fastify.log.info({ msg: '請求時間:', time: new Date().toISOString() })
      fastify.log.info({ msg: '請求 IP:', ip: request.ip })
      fastify.log.info({ msg: '原始查詢參數:', query: JSON.stringify(request.query, null, 2) })
      
      // 解析參數
      fastify.log.info('步驟 1: 解析請求參數...')
      const parseResult = installRequestSchema.safeParse(request.query)
      if (!parseResult.success) {
        fastify.log.error('❌ 參數解析失敗:', parseResult.error.errors)
        return reply.status(400).send({
          success: false,
          error: 'Invalid request parameters',
          details: parseResult.error.errors
        })
      }

      const params = parseResult.data
      const verifyParams: ShoplineAuthParams = {
        appkey: params.appkey,
        handle: params.handle,
        timestamp: params.timestamp,
        sign: params.sign
      }
      fastify.log.info({ msg: '✅ 參數解析成功:', params: JSON.stringify(params, null, 2) })
      
      // 驗證安裝請求
      fastify.log.info('步驟 2: 驗證簽名...')
      fastify.log.info({ 
        msg: '驗證參數:', 
        params: {
          appkey: params.appkey,
          handle: params.handle,
          timestamp: params.timestamp,
          receivedSign: params.sign
        }
      })
      
      const isValid = await shoplineService.verifyInstallRequest(verifyParams)
      if (!isValid) {
        fastify.log.error('❌ 簽名驗證失敗')
        return reply.status(401).send({
          success: false,
          error: 'Invalid install request signature',
          receivedParams: params
        })
      }

      fastify.log.info('✅ 簽名驗證成功')
      
      // 取得當前使用者（如果有 Session）
      let sessionId: string | null = null
      const authHeader = request.headers.authorization
      let token: string | null = null
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      
      if (token) {
        const { verifyToken } = await import('../utils/jwt')
        const payload = verifyToken(token)
        if (payload) {
          // 從 JWT Token 中取得 Session ID（需要在 Token 中包含 Session ID）
          // 目前先使用 Token 的 userId 來查找 Session
          // 未來可以擴展 JWT Token 包含 Session ID
          const { getSession } = await import('../utils/session')
          // 暫時使用 userId 來查找 Session（需要擴展 Session 查詢功能）
          // 目前先使用隨機 state，在回調時再從 header 取得使用者
        }
      } else {
        sessionId = request.headers['x-session-id'] as string || null
      }
      
      // 生成 state 參數（如果沒有 Session ID，使用隨機字串）
      fastify.log.info('步驟 3: 生成 state 參數...')
      let state: string
      if (sessionId) {
        // 如果有 Session ID，加密後放入 state
        const { encryptState } = await import('../utils/state')
        state = encryptState(sessionId)
        fastify.log.info('生成的 state (包含 Session ID):', state.substring(0, 20) + '...')
      } else {
        // 如果沒有 Session ID，使用隨機字串（未登入狀態）
        state = generateRandomString()
        fastify.log.info('生成的 state (隨機字串):', state)
      }
      
      // 重定向到 Shopline 授權頁面
      fastify.log.info('步驟 4: 生成授權 URL...')
      const authUrl = shoplineService.generateAuthUrl(state, params.handle)
      fastify.log.info('生成的授權 URL:', authUrl)
      
      const processingTime = Date.now() - startTime
      fastify.log.info(`=== 安裝請求處理完成，耗時: ${processingTime}ms ===`)
      fastify.log.info('重定向到:', authUrl)
      
      return reply.redirect(302, authUrl)
    } catch (error: any) {
      fastify.log.error('Auth error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // 處理 OAuth 回調
  fastify.get('/api/auth/shopline/callback', async (request, reply) => {
    try {
      const rawQuery = request.query as Record<string, unknown>
      fastify.log.info('收到授權回調:', JSON.stringify(rawQuery, null, 2))
      const rawState = typeof rawQuery.state === 'string' ? rawQuery.state : undefined
      fastify.log.info('State 參數:', rawState)
      
      // 先檢查必要參數（參考 temp/oauth.js 的實作）
      if (!rawQuery.appkey || !rawQuery.code || !rawQuery.handle || !rawQuery.timestamp || !rawQuery.sign) {
        fastify.log.error('缺少必要參數:', {
          hasAppkey: !!rawQuery.appkey,
          hasCode: !!rawQuery.code,
          hasHandle: !!rawQuery.handle,
          hasTimestamp: !!rawQuery.timestamp,
          hasSign: !!rawQuery.sign
        })
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameters',
          details: {
            required: ['appkey', 'code', 'handle', 'timestamp', 'sign'],
            received: Object.keys(rawQuery)
          }
        })
      }
      
      const parseResult = callbackSchema.safeParse(request.query)
      if (!parseResult.success) {
        fastify.log.error('Parse error:', parseResult.error)
        return reply.status(400).send({
          success: false,
          error: 'Invalid request parameters',
          details: parseResult.error.errors
        })
      }

      const params = parseResult.data
      
      // 驗證簽名 - 直接傳遞整個 params（包含 code, lang, customField 等所有參數）
      // 這是重構前的正確做法，verifyInstallRequest 會自動遍歷所有參數進行簽名驗證
      // 重構時（Run 2025-11-10-01）被錯誤地改為只傳遞部分參數，導致缺少 code 參數而簽名驗證失敗
      // 恢復為重構前的做法：直接傳遞整個 params
      const isValidSignature = await shoplineService.verifyInstallRequest(params as any)
      if (!isValidSignature) {
        fastify.log.error('回調簽名驗證失敗')
        fastify.log.error('簽名驗證參數:', JSON.stringify(params, null, 2))
        return reply.status(401).send({
          success: false,
          error: 'Invalid signature'
        })
      }

      fastify.log.info('授權碼驗證成功:', params.code)
      
      // 交換授權碼獲取存取令牌
      const tokenData = await shoplineService.exchangeCodeForToken(params.code, params.handle)
      
      if (tokenData.success) {
        fastify.log.info('Access token 獲取成功')
        
        // 從 state 參數中取得 Session ID 或 userId
        let userId: string | undefined = undefined
        let sessionId: string | null = null  // 用於重導向時傳遞給前端
        const state = params.state
        const { getRedisClient } = await import('../utils/redis')
        const redis = getRedisClient()
        
        fastify.log.info('=== OAuth 回調處理 ===')
        fastify.log.info('State 參數:', state ? state.substring(0, 50) + '...' : '無')
        
        if (state) {
          // 方法 1: 嘗試從 Redis 取得 userId（最可靠）
          if (redis) {
            const redisKey = `oauth:state:${state}`
            console.log('🔍 [DEBUG] 嘗試從 Redis 取得 userId，key:', redisKey)
            const cachedUserId = await redis.get(redisKey)
            if (cachedUserId) {
              userId = cachedUserId
              console.log('✅ [DEBUG] 從 Redis 取得使用者 ID:', userId)
              fastify.log.info('✅ 從 Redis 取得使用者 ID:', userId)
              // 取得後刪除（一次性使用）
              await redis.del(redisKey)
              console.log('✅ [DEBUG] 已刪除 Redis key（一次性使用）:', redisKey)
            } else {
              console.warn('⚠️  [DEBUG] Redis 中沒有找到 userId，key:', redisKey)
            }
          } else {
            console.error('❌ [DEBUG] Redis 不可用，無法從 Redis 取得 userId')
          }
          
          // 方法 2: 如果 Redis 沒有，嘗試解密 state 取得 Session ID
          if (!userId) {
            fastify.log.info('從 state 參數中解析 Session ID...')
            const { decryptState } = await import('../utils/state')
            const decryptedSessionId = decryptState(state)
            
            if (decryptedSessionId) {
              sessionId = decryptedSessionId  // 保存 sessionId 用於重導向
              fastify.log.info('成功解析 Session ID:', sessionId.substring(0, 10) + '...')
              const { getSession } = await import('../utils/session')
              const session = await getSession(sessionId)
              if (session) {
                userId = session.userId
                fastify.log.info('✅ 從 Session 取得使用者 ID:', userId)
              } else {
                fastify.log.warn('❌ Session 不存在或已過期')
                sessionId = null  // Session 無效，清除 sessionId
              }
            } else {
              fastify.log.warn('❌ 無法解析 state 參數，可能未登入或 state 格式錯誤')
              fastify.log.warn('State 原始值:', state.substring(0, 100))
            }
          } else {
            // 如果從 Redis 取得了 userId，嘗試從 state 解密 sessionId 用於重導向
            const { decryptState } = await import('../utils/state')
            const decryptedSessionId = decryptState(state)
            if (decryptedSessionId) {
              const { getSession } = await import('../utils/session')
              const session = await getSession(decryptedSessionId)
              if (session && session.userId === userId) {
                // 確認 Session 有效且 userId 匹配
                sessionId = decryptedSessionId
                fastify.log.info('✅ 從 state 取得 Session ID 用於重導向:', sessionId.substring(0, 10) + '...')
              }
            }
          }
        } else {
          console.warn('⚠️  [DEBUG] 沒有 state 參數，Shopline 沒有保留 state')
          fastify.log.warn('❌ 沒有 state 參數，嘗試從其他方式取得使用者...')
          
          // 方法 1: 嘗試從 Redis 使用 handle 查找（備用方式）
          if (redis) {
            console.log('🔍 [DEBUG] 嘗試從 Redis 使用 handle 查找 userId')
            // 嘗試查找所有可能的 handle + userId 組合
            // 因為我們不知道確切的 userId，所以需要遍歷所有可能的 key
            // 但這樣效率太低，改用另一種方式：使用 handle + timestamp 範圍查找
            
            // 更簡單的方式：使用 handle 作為 key，儲存最近的 userId
            const handleKey = `oauth:handle:${params.handle}`
            const cachedUserId = await redis.get(handleKey)
            if (cachedUserId) {
              userId = cachedUserId
              console.log('✅ [DEBUG] 從 Redis (by handle) 取得使用者 ID:', userId)
              fastify.log.info('✅ 從 Redis (by handle) 取得使用者 ID:', userId)
              await redis.del(handleKey)
            } else {
              console.warn('⚠️  [DEBUG] Redis 中沒有找到 userId (by handle), key:', handleKey)
            }
          }
          
          // 方法 2: 嘗試從 header 取得使用者
          if (!userId) {
            const authHeader = request.headers.authorization
            let token: string | null = null
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7)
            }
            
            if (token) {
              const { verifyToken } = await import('../utils/jwt')
              const payload = verifyToken(token)
              if (payload) {
                userId = payload.userId
                if (payload.sessionId) {
                  sessionId = payload.sessionId
                }
                console.log('✅ [DEBUG] 從 JWT Token 取得使用者 ID:', userId)
                fastify.log.info('從 JWT Token 取得使用者 ID:', userId)
              }
            } else {
              const headerSessionId = request.headers['x-session-id'] as string
              if (headerSessionId) {
                sessionId = headerSessionId
                const { getSession } = await import('../utils/session')
                const session = await getSession(headerSessionId)
                if (session) {
                  userId = session.userId
                  console.log('✅ [DEBUG] 從 x-session-id header 取得使用者 ID:', userId)
                  fastify.log.info('從 x-session-id header 取得使用者 ID:', userId)
                }
              }
            }
          }
          
          // 如果還是沒有取得 userId，記錄警告
          if (!userId) {
            console.warn('⚠️  [DEBUG] 無法取得使用者 ID，將使用系統使用者')
            console.warn('⚠️  [DEBUG] 前端需要從 localStorage 恢復認證狀態')
            fastify.log.warn('⚠️  無法取得使用者 ID，將使用系統使用者')
          }
        }

        // 如果透過 state 仍無法取得 userId，使用 handle 作為備援
        if (!userId && redis) {
          const fallbackHandleKey = `oauth:handle:${params.handle}`
          const handleUserId = await redis.get(fallbackHandleKey)
          if (handleUserId) {
            userId = handleUserId
            await redis.del(fallbackHandleKey)
            fastify.log.info('✅ 使用 handle 備援取得使用者 ID:', userId)
            console.log('✅ [DEBUG] 使用 handle 備援取得使用者 ID:', userId)
          }
        }
        
        // 儲存商店資訊（如果有 userId 則使用，否則使用系統使用者）
        console.log('🔍 [DEBUG] 準備儲存商店資訊...')
        console.log('🔍 [DEBUG] UserId:', userId || '未提供（將使用系統使用者）')
        console.log('🔍 [DEBUG] Handle:', params.handle)
        console.log('🔍 [DEBUG] Token Data:', {
          success: tokenData.success,
          hasData: !!tokenData.data,
          shopId: tokenData.data?.accessToken ? '存在' : '不存在'
        })
        
        fastify.log.info('準備儲存商店資訊...')
        fastify.log.info('UserId:', userId || '未提供（將使用系統使用者）')
        fastify.log.info('Handle:', params.handle)
        
        await shoplineService.saveStoreInfo(tokenData, params.handle, userId)
        
        console.log('✅ [DEBUG] 商店資訊已儲存')
        
        // 建立或更新 Connection 和 ConnectionItem
        const { connectionRepository } = await import('../repositories/connectionRepository')
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        
        // 確保有 userId（如果沒有則使用系統使用者）
        let finalUserId = userId
        if (!finalUserId) {
          const systemUser = await prisma.user.findUnique({
            where: { email: 'system@admin.com' }
          })
          if (systemUser) {
            finalUserId = systemUser.id
          } else {
            fastify.log.error('❌ 系統使用者不存在')
            await prisma.$disconnect()
            return reply.status(500).send({
              success: false,
              error: 'System user not found'
            })
          }
        }
        
        // 從 JWT 中解碼資訊
        const access_token = tokenData.data.accessToken
        const jwtPayload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64').toString())
        const shop_id = jwtPayload.storeId
        const expiresAt = jwtPayload.exp ? new Date(jwtPayload.exp * 1000) : null
        
        // 建立或更新 Connection
        const connection = await connectionRepository.upsertConnection({
          userId: finalUserId,
          platform: 'shopline',
          externalAccountId: params.handle,
          displayName: params.handle,
          authPayload: {
            accessToken: access_token,
            expires_at: expiresAt?.toISOString(),
            scope: tokenData.data.scope,
          },
          status: 'active',
        })
        
        fastify.log.info(`✅ Connection 已建立/更新: ${connection.id} (${params.handle})`)
        
        // 建立或更新 ConnectionItem
        const existingItem = await prisma.connectionItem.findFirst({
          where: {
            integrationAccountId: connection.id,
            externalResourceId: shop_id,
          },
        })
        
        let connectionItem
        if (existingItem) {
          // 更新現有的 ConnectionItem
          connectionItem = await prisma.connectionItem.update({
            where: { id: existingItem.id },
            data: {
              status: 'active',
              updatedAt: new Date(),
            },
          })
        } else {
          // 建立新的 ConnectionItem
          connectionItem = await connectionRepository.createConnectionItem({
            integrationAccountId: connection.id,
            platform: 'shopline',
            externalResourceId: shop_id,
            displayName: params.handle,
            metadata: {
              domain: jwtPayload.domain || null,
              handle: params.handle,
            },
            status: 'active',
          })
        }
        
        fastify.log.info(`✅ ConnectionItem 已建立/更新: ${connectionItem.id} (${shop_id})`)
        
        // 先斷開 prisma 連接（主要操作已完成）
        await prisma.$disconnect()
        
        fastify.log.info('✅ 商店資訊、Connection 和 ConnectionItem 已儲存')
        
        // 寫入審計記錄（新增或重新授權）- 使用非阻塞方式，不影響主要流程
        // 使用 setTimeout 確保在主要流程完成後再執行，即使失敗也不影響 OAuth 流程
        setImmediate(async () => {
          try {
            const { auditLogRepository } = await import('../repositories/auditLogRepository')
            const isNewConnection = !existingItem // 如果沒有現有 item，視為新 Connection
            await auditLogRepository.createAuditLog({
              userId: finalUserId,
              connectionId: connection.id,
              operation: isNewConnection ? 'connection.create' : 'connection.reauthorize',
              result: 'success',
              metadata: {
                handle: params.handle,
                platform: 'shopline',
                shopId: shop_id,
              },
            })
            fastify.log.info(`✅ 審計記錄已寫入: ${isNewConnection ? 'connection.create' : 'connection.reauthorize'}`)
          } catch (auditError) {
            // 審計記錄失敗不影響主要操作，只記錄錯誤
            fastify.log.error('Failed to create audit log (non-blocking):', auditError)
          }
        })
        
        // 取得前端 URL (從環境變數或使用預設值)
        // 生產環境必須設定 FRONTEND_URL
        const frontendUrl = process.env.FRONTEND_URL
        if (!frontendUrl) {
          fastify.log.error({ msg: '❌ 錯誤：生產環境必須設定 FRONTEND_URL 環境變數' })
          return reply.status(500).send({
            success: false,
            error: 'Frontend URL not configured'
          })
        }
        
        // 如果沒有 sessionId 但取得了 userId，生成新的 Session 和 Token
        // 這樣前端就可以直接恢復登入狀態（因為 OAuth 回調在 Shopline embedded iframe 中，無法取得 localStorage）
        if (!sessionId && userId) {
          console.log('🔍 [DEBUG] 沒有 sessionId 但取得了 userId，生成新的 Session 和 Token')
          
          // 取得使用者資訊
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true }
          })
          await prisma.$disconnect()
          
          if (user) {
            // 建立新的 Session
            const { createSession } = await import('../utils/session')
            sessionId = await createSession(user.id, user.email)
            console.log('✅ [DEBUG] 已建立新的 Session:', sessionId.substring(0, 20) + '...')
            
            // 生成新的 JWT Token（包含 sessionId）
            const { generateToken } = await import('../utils/jwt')
            const token = generateToken(user.id, user.email, sessionId)
            console.log('✅ [DEBUG] 已生成新的 JWT Token')
            
            // 在重導向 URL 中包含 Token、Session ID 和 Connection ID
            const redirectUrl = `${frontendUrl}/connections/callback?auth_success=true&status=success&connectionId=${encodeURIComponent(connection.id)}&token=${encodeURIComponent(token)}&session_id=${encodeURIComponent(sessionId)}`
            console.log('✅ [DEBUG] 重導向 URL 包含新的 Token、Session ID 和 Connection ID')
            console.log('🔍 [DEBUG] 最終重導向 URL:', redirectUrl)
            console.log('🔍 [DEBUG] Frontend URL:', frontendUrl)
            
            // 直接 redirect，不顯示紫色頁面
            return reply.redirect(302, redirectUrl)
          }
                    }
        
        // 直接 redirect，不顯示紫色頁面
        // 在重導向 URL 中加入認證狀態參數、Connection ID（如果有 Session ID）
        let redirectUrl = `${frontendUrl}/connections/callback?auth_success=true&status=success&connectionId=${encodeURIComponent(connection.id)}`
        if (sessionId) {
          // 在重導向 URL 中加入 Session ID，讓前端可以恢復認證狀態
          redirectUrl += `&session_id=${encodeURIComponent(sessionId)}`
          console.log('✅ [DEBUG] 重導向 URL 包含 Session ID 和 Connection ID:', redirectUrl)
          fastify.log.info('✅ 重導向 URL 包含 Session ID 和 Connection ID')
        } else {
          console.log('⚠️  [DEBUG] 重導向 URL 不包含 Session ID（Session 無效或不存在），但包含 Connection ID:', redirectUrl)
          fastify.log.info('⚠️  重導向 URL 不包含 Session ID（Session 無效或不存在），但包含 Connection ID')
        }
        
        console.log('🔍 [DEBUG] 最終重導向 URL:', redirectUrl)
        console.log('🔍 [DEBUG] Frontend URL:', frontendUrl)
        
        // 直接 redirect，不顯示紫色頁面
        return reply.redirect(302, redirectUrl)
      } else {
        fastify.log.error('Access token 獲取失敗:', tokenData.error)
        
        // 錯誤時也要 redirect 到前端 callback 頁面
        const frontendUrl = process.env.FRONTEND_URL
        if (frontendUrl) {
          const errorRedirectUrl = `${frontendUrl}/connections/callback?auth_success=false&status=error&error=${encodeURIComponent(tokenData.error || '授權失敗')}`
          return reply.redirect(302, errorRedirectUrl)
        }
        
        return reply.status(500).send({
          success: false,
          error: tokenData.error
        })
      }
    } catch (error: any) {
      fastify.log.error('Callback error:', error)
      fastify.log.error('Error stack:', error?.stack)
      
      // 錯誤時也要 redirect 到前端 callback 頁面
      const frontendUrl = process.env.FRONTEND_URL
      if (frontendUrl) {
        const errorRedirectUrl = `${frontendUrl}/connections/callback?auth_success=false&status=error&error=${encodeURIComponent(error?.message || 'Internal server error')}`
        return reply.redirect(302, errorRedirectUrl)
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error?.message
      })
    }
  })

  // 成功頁面
  fastify.get('/success', async (request, reply) => {
    const { shop } = request.query as { shop?: string }
    
    return reply.send({
      success: true,
      message: '商店授權成功！',
      shopId: shop
    })
  })

  // ========== 使用者認證 API ==========

  // 註冊 API
  const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().optional()
  })

  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const parseResult = registerSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request parameters',
          details: parseResult.error.errors
        })
      }

      const { email, password, name } = parseResult.data

      // 檢查 Email 是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return reply.status(400).send({
          success: false,
          error: 'Email already exists'
        })
      }

      // 加密密碼
      const hashedPassword = await hashPassword(password)

      // 建立使用者
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null
        }
      })

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        message: 'User registered successfully'
      })
    } catch (error: any) {
      fastify.log.error('Register error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // 登入 API
  const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })

  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const parseResult = loginSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request parameters',
          details: parseResult.error.errors
        })
      }

      const { email, password } = parseResult.data

      // 查詢使用者
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password'
        })
      }

      // 驗證密碼
      const isValidPassword = await verifyPassword(password, user.password)
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password'
        })
      }

      // 檢查使用者是否啟用
      if (!user.isActive) {
        return reply.status(403).send({
          success: false,
          error: 'User account is disabled'
        })
      }

      // 建立 Session
      const sessionId = await createSession(user.id, user.email)

      // 生成 JWT Token（包含 Session ID）
      const token = generateToken(user.id, user.email, sessionId)

      return reply.send({
        success: true,
        token,
        sessionId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        message: 'Login successful'
      })
    } catch (error: any) {
      fastify.log.error('Login error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // 登出 API
  fastify.post('/api/auth/logout', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const sessionId = request.sessionId
      // 刪除 Session
      if (sessionId) {
        await deleteSession(sessionId)
      }
      
      return reply.send({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error: any) {
      fastify.log.error('Logout error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // 取得當前使用者資訊 API
  fastify.get('/api/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }
      
      const user = request.user
      
      // 從資料庫取得完整使用者資訊
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true
        }
      })

      if (!fullUser) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        })
      }

      return reply.send({
        success: true,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name
        }
      })
    } catch (error: any) {
      fastify.log.error('Get current user error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  // ========== Next Engine OAuth Routes (Story 5.1) ==========

  /**
   * 取得 Next Engine 授權 URL（需要登入）
   * GET /api/auth/next-engine/install
   */
  fastify.get('/api/auth/next-engine/install', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }

      const userId = request.user.id

      // 生成 state 參數（包含 userId 與 nonce）
      let sessionId: string | null = null
      if (request.sessionId) {
        sessionId = request.sessionId
      } else {
        const authHeader = request.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          const { decodeToken } = await import('../utils/jwt')
          const payload = decodeToken(token)
          if (payload && payload.sessionId) {
            sessionId = payload.sessionId
          }
        }
      }

      let state: string
      if (sessionId) {
        const { encryptState } = await import('../utils/state')
        state = encryptState(sessionId)
      } else {
        // 如果沒有 sessionId，使用 userId + nonce
        const nonce = generateRandomString()
        const { encryptState } = await import('../utils/state')
        state = encryptState(`${userId}:${nonce}`)
      }

      // Next Engine API 文件顯示授權 URL 只支援 client_id 和 redirect_uri，不支援 state 參數
      // 正確做法：在 redirect_uri 中加入 state 參數來識別用戶
      // Next Engine 應該會保留 redirect_uri 中的參數並在 callback 時回傳
      
      // 將 state 和 userId 的對應關係存入 Redis
      const { getRedisClient } = await import('../utils/redis')
      const redis = getRedisClient()
      if (redis) {
        const redisKey = `oauth:next-engine:state:${state}`
        await redis.setex(redisKey, 600, userId) // 10 分鐘過期
        fastify.log.info({ msg: '✅ 已在 Redis 暫存 state 和 userId 對應關係', userId, state })
      }

      // 取得 Next Engine Adapter
      PlatformServiceFactory.initialize() // 確保 adapter 已註冊
      const adapter = PlatformServiceFactory.getAdapter('next-engine')

      // 生成授權 URL（在 redirect_uri 中加入 state 參數）
      const authUrl = adapter.getAuthorizeUrl(state)

      return reply.send({
        success: true,
        authUrl,
        state
      })
    } catch (error: any) {
      fastify.log.error('Get Next Engine authorize URL error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  /**
   * Next Engine OAuth 回調
   * GET /api/auth/next-engine/callback
   * 
   * Next Engine callback 參數：
   * - uid: 授權碼（類似 Shopline 的 code）
   * - state: OAuth state 參數
   */
  fastify.get('/api/auth/next-engine/callback', async (request, reply) => {
    try {
      const rawQuery = request.query as Record<string, unknown>
      fastify.log.info('收到 Next Engine 授權回調:', JSON.stringify(rawQuery, null, 2))

      const uid = rawQuery.uid as string | undefined
      const neState = rawQuery.state as string | undefined // Next Engine 自己生成的 state
      const redirectUri = rawQuery.redirect_uri as string | undefined

      if (!uid || !neState) {
        fastify.log.error('缺少必要參數:', {
          hasUid: !!uid,
          hasNeState: !!neState
        })
        return reply.status(400).send({
          success: false,
          error: 'Missing required parameters',
          details: {
            required: ['uid', 'state'],
            received: Object.keys(rawQuery)
          }
        })
      }

      // 從 redirect_uri 參數中解析出我們加入的 state（用於識別用戶）
      let userId: string | undefined = undefined
      let ourState: string | undefined = undefined
      
      if (redirectUri) {
        try {
          const redirectUrl = new URL(decodeURIComponent(redirectUri))
          ourState = redirectUrl.searchParams.get('state') || undefined
          fastify.log.info('🔍 從 redirect_uri 解析出我們的 state:', {
            ourState: ourState ? 'found' : 'not found',
            redirectUriLength: redirectUri.length,
          })
        } catch (error: any) {
          fastify.log.warn('⚠️ 無法解析 redirect_uri:', error.message)
        }
      }

      // 使用我們的 state 來識別用戶
      if (ourState) {
        const { getRedisClient } = await import('../utils/redis')
        const redis = getRedisClient()

        if (redis) {
          try {
            const redisKey = `oauth:next-engine:state:${ourState}`
            const cachedUserId = await redis.get(redisKey)
            fastify.log.info('🔍 Redis 查詢結果:', {
              redisKey,
              cachedUserId: cachedUserId ? 'found' : 'not found',
            })
            if (cachedUserId) {
              userId = cachedUserId
              await redis.del(redisKey) // 一次性使用
              fastify.log.info('✅ 從 Redis 取得使用者 ID:', userId)
            }
          } catch (redisError: any) {
            fastify.log.error('❌ Redis 查詢錯誤:', redisError.message)
          }
        }

        // 如果 Redis 沒有，嘗試解密我們的 state
        if (!userId) {
          const { decryptState } = await import('../utils/state')
          const decrypted = decryptState(ourState)
          fastify.log.info('🔍 State 解密結果:', {
            decrypted: decrypted ? 'success' : 'failed',
            decryptedLength: decrypted?.length || 0,
          })
          if (decrypted) {
            // 格式可能是 "sessionId" 或 "userId:nonce"
            const parts = decrypted.split(':')
            if (parts.length === 2) {
              userId = parts[0]
              fastify.log.info('✅ 從解密 state 取得 userId (格式: userId:nonce):', userId)
            } else {
              // 嘗試從 session 取得 userId
              const { getSession } = await import('../utils/session')
              const session = await getSession(decrypted)
              if (session) {
                userId = session.userId
                fastify.log.info('✅ 從 session 取得 userId:', userId)
              } else {
                fastify.log.warn('⚠️ 無法從 session 取得 userId，sessionId:', decrypted)
              }
            }
          } else {
            fastify.log.warn('⚠️ State 解密失敗，state 格式不符合預期')
          }
        }
      }

      if (!userId) {
        fastify.log.error('❌ 無法取得使用者 ID', {
          state,
          redisAvailable: !!redis,
          stateDecryptable: state.includes(':'),
        })
        return reply.status(401).send({
          success: false,
          error: 'Unable to identify user',
          details: '無法從 Redis 或 state 解密取得使用者資訊。請確認 Redis 已正確設定並連線。'
        })
      }

      // 取得 Next Engine Adapter
      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine')

      // 交換 token（Next Engine 使用 uid 作為授權碼，使用 Next Engine 回傳的 state）
      const tokenResult = await adapter.exchangeToken(uid, neState)

      if (!tokenResult.success) {
        fastify.log.error('Token exchange failed:', tokenResult.error)
        
        // 記錄審計
        await auditLogRepository.createAuditLog({
          userId,
          operation: 'connection.create',
          result: 'error',
          errorCode: tokenResult.error.type,
          errorMessage: tokenResult.error.message,
          metadata: { platform: 'next-engine', raw: tokenResult.error.raw }
        })

        return reply.status(400).send({
          success: false,
          error: tokenResult.error.type,
          message: tokenResult.error.message
        })
      }

      // 取得公司資訊（用於 displayName）
      const identityResult = await adapter.getIdentity(tokenResult.data.accessToken)

      if (!identityResult.success) {
        fastify.log.warn('Get identity failed:', identityResult.error)
        // 繼續處理，使用 uid 作為 displayName
      }

      // 建立或更新 Connection
      const companyId = identityResult.success ? identityResult.data.id : uid
      const displayName = identityResult.success ? identityResult.data.name : `Next Engine (${uid.substring(0, 8)}...)`

      // 準備 authPayload（儲存為 JSON 字串）
      const authPayload = {
        accessToken: tokenResult.data.accessToken,
        refreshToken: tokenResult.data.refreshToken,
        expiresAt: tokenResult.data.expiresAt,
        refreshExpiresAt: tokenResult.data.refreshExpiresAt,
        uid: uid, // 儲存 uid 供 refresh 使用
        state: neState, // 儲存 Next Engine 回傳的 state 供 refresh 使用
      }

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
        const shopsResult = await adapter.getShops(tokenResult.data.accessToken)
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

      // 重導向回前端
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const redirectUrl = `${frontendUrl}/connections?platform=next-engine&connectionId=${connection.id}`

      return reply.redirect(302, redirectUrl)
    } catch (error: any) {
      fastify.log.error('Next Engine callback error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })

  /**
   * Next Engine Token 刷新
   * POST /api/auth/next-engine/refresh
   */
  fastify.post('/api/auth/next-engine/refresh', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        })
      }

      const userId = request.user.id
      const { connectionId } = request.body as { connectionId: string }

      if (!connectionId) {
        return reply.status(400).send({
          success: false,
          error: 'Connection ID is required'
        })
      }

      // 取得 Connection
      const connection = await connectionRepository.findConnectionById(connectionId)

      if (!connection) {
        return reply.status(404).send({
          success: false,
          error: 'Connection not found'
        })
      }

      // 驗證擁有權
      if (connection.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Forbidden'
        })
      }

      // 驗證平台
      if (connection.platform !== 'next-engine') {
        return reply.status(400).send({
          success: false,
          error: 'Invalid platform'
        })
      }

      const authPayload = connection.authPayload as any
      const refreshToken = authPayload.refreshToken

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token not found'
        })
      }

      // 取得 Next Engine Adapter
      PlatformServiceFactory.initialize()
      const adapter = PlatformServiceFactory.getAdapter('next-engine')

      // 刷新 token（需要 uid 和 state）
      const refreshResult = await adapter.refreshToken(refreshToken, {
        uid: authPayload.uid,
        state: authPayload.state
      })

      if (!refreshResult.success) {
        fastify.log.error('Token refresh failed:', refreshResult.error)

        // 記錄審計
        await auditLogRepository.createAuditLog({
          userId,
          connectionId: connection.id,
          operation: 'connection.reauthorize',
          result: 'error',
          errorCode: refreshResult.error.type,
          errorMessage: refreshResult.error.message,
          metadata: { platform: 'next-engine', raw: refreshResult.error.raw }
        })

        return reply.status(400).send({
          success: false,
          error: refreshResult.error.type,
          message: refreshResult.error.message
        })
      }

      // 更新 Connection 的 authPayload
      const updatedAuthPayload = {
        ...authPayload,
        accessToken: refreshResult.data.accessToken,
        refreshToken: refreshResult.data.refreshToken,
        expiresAt: refreshResult.data.expiresAt,
        refreshExpiresAt: refreshResult.data.refreshExpiresAt,
      }

      await connectionRepository.upsertConnection({
        userId,
        platform: 'next-engine',
        externalAccountId: connection.externalAccountId,
        displayName: connection.displayName,
        authPayload: updatedAuthPayload,
        status: 'active'
      })

      // 記錄審計
      await auditLogRepository.createAuditLog({
        userId,
        connectionId: connection.id,
        operation: 'connection.reauthorize',
        result: 'success',
        metadata: { platform: 'next-engine' }
      })

      return reply.send({
        success: true,
        data: {
          accessToken: refreshResult.data.accessToken,
          expiresAt: refreshResult.data.expiresAt
        }
      })
    } catch (error: any) {
      fastify.log.error('Next Engine refresh error:', error)
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    }
  })
}
