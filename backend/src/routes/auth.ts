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
      const verifyCallbackParams: ShoplineAuthParams = {
        appkey: params.appkey,
        handle: params.handle,
        timestamp: params.timestamp,
        sign: params.sign
      }
      
      // 驗證簽名
      const isValidSignature = await shoplineService.verifyInstallRequest(verifyCallbackParams)
      if (!isValidSignature) {
        fastify.log.error('回調簽名驗證失敗')
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
        console.log('🔍 [DEBUG] 驗證儲存結果...')
        
        // 驗證儲存結果
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()
        const savedStore = await prisma.store.findFirst({
          where: { handle: params.handle },
          include: { user: { select: { id: true, email: true } } }
        })
        console.log('🔍 [DEBUG] 儲存後的商店:', {
          id: savedStore?.id,
          shoplineId: savedStore?.shoplineId,
          handle: savedStore?.handle,
          userId: savedStore?.userId,
          userEmail: savedStore?.user?.email
        })
        await prisma.$disconnect()
        
        fastify.log.info('✅ 商店資訊已儲存')
        
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
            
            // 在重導向 URL 中包含 Token 和 Session ID，讓前端可以直接恢復登入狀態
            const redirectUrl = `${frontendUrl}?auth_success=true&token=${encodeURIComponent(token)}&session_id=${encodeURIComponent(sessionId)}`
            console.log('✅ [DEBUG] 重導向 URL 包含新的 Token 和 Session ID')
            console.log('🔍 [DEBUG] 最終重導向 URL:', redirectUrl)
            console.log('🔍 [DEBUG] Frontend URL:', frontendUrl)
            
            // 返回成功頁面 HTML，自動重導向到前端
            return reply.type('text/html').send(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>授權成功</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                      background: rgba(255, 255, 255, 0.1);
                      border-radius: 1rem;
                      backdrop-filter: blur(10px);
                    }
                    h1 { margin: 0 0 1rem 0; }
                    p { margin: 0.5rem 0; }
                    .spinner {
                      border: 3px solid rgba(255, 255, 255, 0.3);
                      border-radius: 50%;
                      border-top: 3px solid white;
                      width: 30px;
                      height: 30px;
                      animation: spin 1s linear infinite;
                      margin: 1rem auto;
                    }
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>✅ 授權成功！</h1>
                    <p>商店授權已成功完成</p>
                    <p>已取得存取權限</p>
                    <div class="spinner"></div>
                    <p style="font-size: 0.9rem; opacity: 0.9; margin-top: 1rem;">正在返回應用程式...</p>
                    <a href="${redirectUrl}" style="display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: white; color: #667eea; text-decoration: none; border-radius: 0.5rem; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">如果沒有自動跳轉，請點擊這裡返回</a>
                  </div>
                  <script>
                    console.log('🔍 [DEBUG] OAuth 回調頁面載入');
                    console.log('🔍 [DEBUG] 準備重導向到前端:', '${redirectUrl}');
                    console.log('🔍 [DEBUG] 當前 URL:', window.location.href);
                    console.log('🔍 [DEBUG] window.top:', window.top === window ? 'same' : 'different');
                    console.log('🔍 [DEBUG] window.parent:', window.parent === window ? 'same' : 'different');
                    console.log('🔍 [DEBUG] window.opener:', window.opener ? 'exists' : 'null');
                    
                    // 嘗試關閉視窗 (如果是彈窗)
                    try {
                      if (window.opener) {
                        console.log('🔍 [DEBUG] 嘗試關閉彈窗');
                        window.close();
                      }
                    } catch (e) {
                      console.log('⚠️  [DEBUG] 無法關閉視窗:', e);
                    }
                    
                    // 嘗試多種重導向方式（Shopline embedded 環境可能需要）
                    function redirectToFrontend() {
                      try {
                        // 方法 1: 嘗試使用 window.top（如果是 iframe）
                        if (window.top !== window) {
                          console.log('🔍 [DEBUG] 使用 window.top.location.href 重導向');
                          window.top.location.href = '${redirectUrl}';
                          return;
                        }
                      } catch (e) {
                        console.warn('⚠️  [DEBUG] window.top.location.href 失敗:', e);
                      }
                      
                      try {
                        // 方法 2: 嘗試使用 window.parent（如果是 iframe）
                        if (window.parent !== window) {
                          console.log('🔍 [DEBUG] 使用 window.parent.location.href 重導向');
                          window.parent.location.href = '${redirectUrl}';
                          return;
                        }
                      } catch (e) {
                        console.warn('⚠️  [DEBUG] window.parent.location.href 失敗:', e);
                      }
                      
                      try {
                        // 方法 3: 使用 window.location.href（標準方式）
                        console.log('🔍 [DEBUG] 使用 window.location.href 重導向');
                        window.location.href = '${redirectUrl}';
                      } catch (e) {
                        console.error('❌ [DEBUG] window.location.href 失敗:', e);
                      }
                    }
                    
                    // 立即重導向
                    redirectToFrontend();
                    
                    // 備用：3秒後重導向（如果立即重導向失敗）
                    setTimeout(() => {
                      if (window.location.href.indexOf('auth_success') === -1 && 
                          window.location.href.indexOf('connector-theta.vercel.app') === -1) {
                        console.log('⚠️  [DEBUG] 立即重導向可能失敗，嘗試備用重導向');
                        redirectToFrontend();
                      }
                    }, 3000);
                  </script>
                </body>
              </html>
            `)
          }
        }
        
        // 返回成功頁面 HTML，自動重導向到前端
        // 在重導向 URL 中加入認證狀態參數（如果有 Session ID）
        let redirectUrl = frontendUrl
        if (sessionId) {
          // 在重導向 URL 中加入 Session ID，讓前端可以恢復認證狀態
          redirectUrl = `${frontendUrl}?auth_success=true&session_id=${encodeURIComponent(sessionId)}`
          console.log('✅ [DEBUG] 重導向 URL 包含 Session ID:', redirectUrl)
          fastify.log.info('✅ 重導向 URL 包含 Session ID')
        } else {
          redirectUrl = `${frontendUrl}?auth_success=true`
          console.log('⚠️  [DEBUG] 重導向 URL 不包含 Session ID（Session 無效或不存在）:', redirectUrl)
          fastify.log.info('⚠️  重導向 URL 不包含 Session ID（Session 無效或不存在）')
        }
        
        console.log('🔍 [DEBUG] 最終重導向 URL:', redirectUrl)
        console.log('🔍 [DEBUG] Frontend URL:', frontendUrl)
        
        return reply.type('text/html').send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>授權成功</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 1rem;
                  backdrop-filter: blur(10px);
                }
                h1 { margin: 0 0 1rem 0; }
                p { margin: 0.5rem 0; }
                .spinner {
                  border: 3px solid rgba(255, 255, 255, 0.3);
                  border-radius: 50%;
                  border-top: 3px solid white;
                  width: 30px;
                  height: 30px;
                  animation: spin 1s linear infinite;
                  margin: 1rem auto;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>✅ 授權成功！</h1>
                <p>商店授權已成功完成</p>
                <p>已取得存取權限</p>
                <div class="spinner"></div>
                <p style="font-size: 0.9rem; opacity: 0.9; margin-top: 1rem;">正在返回應用程式...</p>
              </div>
              <script>
                console.log('🔍 [DEBUG] OAuth 回調頁面載入');
                console.log('🔍 [DEBUG] 準備重導向到前端:', '${redirectUrl}');
                console.log('🔍 [DEBUG] 當前 URL:', window.location.href);
                console.log('🔍 [DEBUG] window.top:', window.top === window ? 'same' : 'different');
                console.log('🔍 [DEBUG] window.parent:', window.parent === window ? 'same' : 'different');
                console.log('🔍 [DEBUG] window.opener:', window.opener ? 'exists' : 'null');
                
                // 嘗試關閉視窗 (如果是彈窗)
                try {
                  if (window.opener) {
                    console.log('🔍 [DEBUG] 嘗試關閉彈窗');
                    window.close();
                  }
                } catch (e) {
                  console.log('⚠️  [DEBUG] 無法關閉視窗:', e);
                }
                
                // 嘗試多種重導向方式（Shopline embedded 環境可能需要）
                function redirectToFrontend() {
                  try {
                    // 方法 1: 嘗試使用 window.top（如果是 iframe）
                    if (window.top !== window) {
                      console.log('🔍 [DEBUG] 使用 window.top.location.href 重導向');
                      window.top.location.href = '${redirectUrl}';
                      return;
                    }
                  } catch (e) {
                    console.warn('⚠️  [DEBUG] window.top.location.href 失敗:', e);
                  }
                  
                  try {
                    // 方法 2: 嘗試使用 window.parent（如果是 iframe）
                    if (window.parent !== window) {
                      console.log('🔍 [DEBUG] 使用 window.parent.location.href 重導向');
                      window.parent.location.href = '${redirectUrl}';
                      return;
                    }
                  } catch (e) {
                    console.warn('⚠️  [DEBUG] window.parent.location.href 失敗:', e);
                  }
                  
                  try {
                    // 方法 3: 使用 window.location.href（標準方式）
                    console.log('🔍 [DEBUG] 使用 window.location.href 重導向');
                    window.location.href = '${redirectUrl}';
                  } catch (e) {
                    console.error('❌ [DEBUG] window.location.href 失敗:', e);
                  }
                }
                
                // 立即重導向
                redirectToFrontend();
                
                // 備用：3秒後重導向（如果立即重導向失敗）
                setTimeout(() => {
                  if (window.location.href.indexOf('auth_success') === -1 && 
                      window.location.href.indexOf('connector-theta.vercel.app') === -1) {
                    console.log('⚠️  [DEBUG] 立即重導向可能失敗，嘗試備用重導向');
                    redirectToFrontend();
                  }
                }, 3000);
              </script>
            </body>
          </html>
        `)
      } else {
        fastify.log.error('Access token 獲取失敗:', tokenData.error)
        return reply.status(500).send({
          success: false,
          error: tokenData.error
        })
      }
    } catch (error: any) {
      fastify.log.error('Callback error:', error)
      fastify.log.error('Error stack:', error?.stack)
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
}
