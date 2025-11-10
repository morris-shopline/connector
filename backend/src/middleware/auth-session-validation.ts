import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../utils/jwt'
import { verifySession } from '../utils/session'

const isProduction = (process.env.NODE_ENV || 'development') === 'production'

function logFallback(message: string, detail?: Record<string, unknown>) {
  if (isProduction) {
    return
  }
  const info = detail ? JSON.stringify(detail) : ''
  console.warn(`⚠️ [AUTH_FALLBACK] ${message}${info ? ` ${info}` : ''}`)
}

/**
 * 認證中間件（強制要求登入）
 * 驗證 JWT Token 或 Session ID，將使用者資訊附加到 request.user
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // 1. 從 Authorization header 取得 JWT Token
  const authHeader = request.headers.authorization
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 2. 如果沒有 Token，從 Header 取得 Session ID
  let sessionId: string | null = null
  if (!token) {
    sessionId = request.headers['x-session-id'] as string || null
  }

  // 3. 驗證 Token 或 Session
  if (token) {
    const payload = verifyToken(token)
    if (!payload) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired token'
      })
    }

    if (!payload.sessionId) {
      if (!isProduction) {
        logFallback('JWT 缺少 sessionId，fallback 至 JWT-only 模式', { userId: payload.userId })
        request.user = {
          id: payload.userId,
          email: payload.email
        }
        request.sessionId = undefined
        return
      }

      return reply.status(401).send({
        success: false,
        error: 'Invalid session state'
      })
    }

    const session = await verifySession(payload.sessionId)
    if (!session || session.userId !== payload.userId) {
      if (!isProduction) {
        logFallback('Session 驗證失敗，使用 JWT-only fallback', {
          userId: payload.userId,
          sessionId: payload.sessionId
        })
        request.user = {
          id: payload.userId,
          email: payload.email
        }
        request.sessionId = undefined
        return
      }

      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired session'
      })
    }

    request.user = {
      id: session.userId,
      email: session.email
    }
    request.sessionId = payload.sessionId
    return
  }

  if (sessionId) {
    const session = await verifySession(sessionId)
    if (!session) {
      if (!isProduction) {
        logFallback('根據 Session ID 驗證失敗，回傳 401', { sessionId })
      }
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired session'
      })
    }

    request.user = {
      id: session.userId,
      email: session.email
    }
    request.sessionId = sessionId
    return
  }

  // 4. 如果都沒有，返回 401
  return reply.status(401).send({
    success: false,
    error: 'Authentication required'
  })
}

/**
 * 可選的認證檢查（不強制要求登入）
 * 如果有 Token 或 Session，將使用者資訊附加到 request.user
 */
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // 1. 從 Authorization header 取得 JWT Token
  const authHeader = request.headers.authorization
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 2. 如果沒有 Token，從 Header 取得 Session ID
  let sessionId: string | null = null
  if (!token) {
    sessionId = request.headers['x-session-id'] as string || null
  }

  // 3. 驗證 Token 或 Session（不強制要求）
  if (token) {
    const payload = verifyToken(token)
    if (payload && payload.sessionId) {
      const session = await verifySession(payload.sessionId)
      if (session && session.userId === payload.userId) {
        request.user = {
          id: payload.userId,
          email: payload.email
        }
        request.sessionId = payload.sessionId
        return
      }

      if (!isProduction && payload) {
        logFallback('Optional middleware：Session 驗證失敗，fallback 至 JWT-only', {
          userId: payload.userId,
          sessionId: payload.sessionId
        })
        request.user = {
          id: payload.userId,
          email: payload.email
        }
        request.sessionId = undefined
      }
      return
    }

    if (payload && !payload.sessionId && !isProduction) {
      logFallback('Optional middleware：JWT 無 sessionId，使用 fallback', {
        userId: payload.userId
      })
      request.user = {
        id: payload.userId,
        email: payload.email
      }
      request.sessionId = undefined
    }
    return
  }

  if (sessionId) {
    const session = await verifySession(sessionId)
    if (session) {
      request.user = {
        id: session.userId,
        email: session.email
      }
      request.sessionId = sessionId
    }
    return
  }

  // 如果都沒有，不附加使用者資訊，但也不返回錯誤
  return
}


