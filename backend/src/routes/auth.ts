import { FastifyInstance } from 'fastify'
import { ShoplineService } from '../services/shopline'
import { generateRandomString } from '../utils/signature'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { createSession, deleteSession } from '../utils/session'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

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
  lang: z.string().optional(),
  customField: z.string().optional()
})

export async function authRoutes(fastify: FastifyInstance, options: any) {
  // 處理應用安裝請求
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
      
      const isValid = await shoplineService.verifyInstallRequest(params)
      if (!isValid) {
        fastify.log.error('❌ 簽名驗證失敗')
        return reply.status(401).send({
          success: false,
          error: 'Invalid install request signature',
          receivedParams: params
        })
      }

      fastify.log.info('✅ 簽名驗證成功')
      
      // 生成 state 參數
      fastify.log.info('步驟 3: 生成 state 參數...')
      const state = generateRandomString()
      fastify.log.info('生成的 state:', state)
      
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
      fastify.log.info('收到授權回調:', request.query)
      
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
      
      // 驗證簽名
      const isValidSignature = await shoplineService.verifyInstallRequest(params)
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
        
        // 取得當前使用者（如果有 Session）
        // 使用 optionalAuthMiddleware 的邏輯來取得使用者
        let userId: string | undefined = undefined
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
          }
        } else {
          const sessionId = request.headers['x-session-id'] as string
          if (sessionId) {
            const { getSession } = await import('../utils/session')
            const session = await getSession(sessionId)
            if (session) {
              userId = session.userId
            }
          }
        }
        
        // 儲存商店資訊（如果有 userId 則使用，否則使用系統使用者）
        await shoplineService.saveStoreInfo(tokenData, params.handle, userId)
        
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
              </div>
              <script>
                // 嘗試關閉視窗 (如果是彈窗)
                try {
                  if (window.opener) {
                    window.close();
                  }
                } catch (e) {
                  console.log('Could not close window:', e);
                }
                
                // 3秒後重導向到前端
                setTimeout(() => {
                  window.location.href = '${frontendUrl}';
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

      // 生成 JWT Token
      const token = generateToken(user.id, user.email)

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
