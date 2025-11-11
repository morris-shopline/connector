/**
 * Require Connection Owner Middleware
 * 
 * Story 4.3: 驗證使用者是否擁有指定的 Connection
 * 
 * 功能：
 * - 驗證 request.user 是否存在
 * - 查詢 integration_accounts 比對 userId + connectionId
 * - 驗證 platform scope（比對 URL :platform 與資料庫）
 * - 若驗證失敗 → 回傳 403 + 錯誤碼 CONNECTION_FORBIDDEN
 */

import { FastifyRequest, FastifyReply } from 'fastify'
import { connectionRepository } from '../repositories/connectionRepository'

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string
    email: string
    name?: string | null
  }
}

export async function requireConnectionOwner(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  // 1. 驗證 request.user 是否存在
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      error: 'Authentication required',
    })
  }

  const userId = request.user.id

  // 2. 從 URL 參數取得 connectionId
  const connectionId = (request.params as any).connectionId || (request.params as any).id

  if (!connectionId) {
    // 如果沒有 connectionId，可能是列表查詢，只需要驗證登入即可
    return
  }

  // 3. 查詢 Connection 並驗證擁有權
  const connection = await connectionRepository.findConnectionById(connectionId)

  if (!connection) {
    return reply.status(404).send({
      success: false,
      code: 'CONNECTION_NOT_FOUND',
      error: 'Connection not found',
    })
  }

  // 4. 驗證 userId 是否匹配
  if (connection.userId !== userId) {
    return reply.status(403).send({
      success: false,
      code: 'CONNECTION_FORBIDDEN',
      error: 'You do not have permission to access this connection',
      connectionId,
    })
  }

  // 5. 驗證 platform scope（如果 URL 中有 :platform 參數）
  const platformParam = (request.params as any).platform
  if (platformParam && connection.platform !== platformParam) {
    return reply.status(403).send({
      success: false,
      code: 'PLATFORM_MISMATCH',
      error: `Platform mismatch: expected ${platformParam}, but connection is ${connection.platform}`,
      connectionId,
    })
  }

  // 驗證通過，繼續處理請求
}

