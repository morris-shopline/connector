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
  console.log('🔍 [DEBUG] createSession() 開始')
  const redis = getRedisClient()
  if (!redis) {
    console.error('❌ [DEBUG] Redis 不可用，無法建立 Session')
    // 如果 Redis 不可用，可以降級到資料庫儲存（未來擴展）
    // 目前先拋出錯誤，確保 Session 管理的一致性
    throw new Error('Redis not available')
  }

  console.log('✅ [DEBUG] Redis 可用，開始建立 Session')
  const sessionId = crypto.randomBytes(32).toString('hex')
  const now = Date.now()
  const expiresAt = now + SESSION_TTL * 1000

  const session: Session = {
    userId,
    email,
    loginTime: now,
    expiresAt,
  }

  const redisKey = `session:${sessionId}`
  console.log('🔍 [DEBUG] Session 資訊:', {
    sessionId: sessionId.substring(0, 10) + '...',
    userId,
    email,
    expiresAt: new Date(expiresAt).toISOString(),
    redisKey
  })

  await redis.setex(
    redisKey,
    SESSION_TTL,
    JSON.stringify(session)
  )

  console.log('✅ [DEBUG] Session 已儲存到 Redis:', redisKey)
  
  // 驗證儲存結果
  const verify = await redis.get(redisKey)
  if (verify) {
    console.log('✅ [DEBUG] Session 驗證成功，Redis 中確實存在')
  } else {
    console.error('❌ [DEBUG] Session 驗證失敗，Redis 中不存在')
  }

  return sessionId
}

/**
 * 取得 Session
 * @param sessionId Session ID
 * @returns Session 或 null（如果不存在）
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  console.log('🔍 [DEBUG] getSession() 開始，sessionId:', sessionId ? sessionId.substring(0, 10) + '...' : 'null')
  const redis = getRedisClient()
  if (!redis) {
    console.error('❌ [DEBUG] Redis 不可用，無法取得 Session')
    // 如果 Redis 不可用，返回 null（降級處理）
    return null
  }

  const redisKey = `session:${sessionId}`
  console.log('🔍 [DEBUG] 從 Redis 讀取 Session，key:', redisKey)
  
  const data = await redis.get(redisKey)
  if (!data) {
    console.warn('⚠️  [DEBUG] Session 不存在或已過期，key:', redisKey)
    return null
  }

  const session = JSON.parse(data) as Session
  console.log('✅ [DEBUG] Session 讀取成功:', {
    sessionId: sessionId.substring(0, 10) + '...',
    userId: session.userId,
    email: session.email,
    expiresAt: new Date(session.expiresAt).toISOString(),
    isExpired: session.expiresAt < Date.now()
  })

  return session
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

