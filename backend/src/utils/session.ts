import { getRedisClient } from './redis'
import crypto from 'crypto'

interface Session {
  userId: string
  email: string
  loginTime: number
  expiresAt: number
}

const SESSION_TTL = 7 * 24 * 60 * 60 // 7 天（秒）

/**
 * 建立 Session
 * @param userId 使用者 ID
 * @param email 使用者 Email
 * @returns Session ID
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，可以降級到資料庫儲存（未來擴展）
    // 目前先拋出錯誤，確保 Session 管理的一致性
    throw new Error('Redis not available')
  }

  const sessionId = crypto.randomBytes(32).toString('hex')
  const now = Date.now()
  const expiresAt = now + SESSION_TTL * 1000

  const session: Session = {
    userId,
    email,
    loginTime: now,
    expiresAt,
  }

  await redis.setex(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(session)
  )

  return sessionId
}

/**
 * 取得 Session
 * @param sessionId Session ID
 * @returns Session 或 null（如果不存在）
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，返回 null（降級處理）
    return null
  }

  const data = await redis.get(`session:${sessionId}`)
  if (!data) {
    return null
  }

  return JSON.parse(data) as Session
}

/**
 * 刪除 Session
 * @param sessionId Session ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient()
  if (!redis) {
    // 如果 Redis 不可用，靜默失敗（降級處理）
    return
  }

  await redis.del(`session:${sessionId}`)
}

/**
 * 驗證 Session（檢查是否存在且未過期）
 * @param sessionId Session ID
 * @returns Session 或 null（如果無效或過期）
 */
export async function verifySession(sessionId: string): Promise<Session | null> {
  const session = await getSession(sessionId)
  if (!session) {
    return null
  }
  
  // 檢查是否過期
  if (session.expiresAt < Date.now()) {
    await deleteSession(sessionId)
    return null
  }
  
  return session
}

