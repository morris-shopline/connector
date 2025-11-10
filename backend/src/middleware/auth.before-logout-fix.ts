import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '../utils/jwt'
import { getSession } from '../utils/session'

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
  
  // 2. 如果沒有 Token，從 Cookie 或 header 取得 Session ID
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
    // 將使用者資訊附加到 request（TypeScript 類型已擴展）
    request.user = {
      id: payload.userId,
      email: payload.email
    }
    // 如果 JWT Token 包含 Session ID，也設定到 request.sessionId
    if (payload.sessionId) {
      request.sessionId = payload.sessionId
    }
    return
  }
  
  if (sessionId) {
    const session = await getSession(sessionId)
    if (!session) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired session'
      })
    }
    // 將使用者資訊附加到 request（TypeScript 類型已擴展）
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
  
  // 2. 如果沒有 Token，從 Cookie 或 header 取得 Session ID
  let sessionId: string | null = null
  if (!token) {
    sessionId = request.headers['x-session-id'] as string || null
  }
  
  // 3. 驗證 Token 或 Session（不強制要求）
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      request.user = {
        id: payload.userId,
        email: payload.email
      }
    }
    return
  }
  
  if (sessionId) {
    const session = await getSession(sessionId)
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


