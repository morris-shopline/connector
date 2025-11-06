import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

/**
 * 生成 JWT Token
 * @param userId 使用者 ID
 * @param email 使用者 Email
 * @returns JWT Token
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * 驗證 JWT Token
 * @param token JWT Token
 * @returns Token payload 或 null（如果無效）
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * 解析 JWT Token（不驗證）
 * @param token JWT Token
 * @returns Token payload 或 null（如果解析失敗）
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}

