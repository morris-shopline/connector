import crypto from 'crypto'

const STATE_SECRET = process.env.STATE_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production'
const ALGORITHM = 'aes-256-cbc'

/**
 * 加密 state 參數（包含 Session ID）
 * @param sessionId Session ID
 * @returns 加密後的 state 字串
 */
export function encryptState(sessionId: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(STATE_SECRET.substring(0, 32), 'utf8'), iv)
  
  let encrypted = cipher.update(sessionId, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // 將 IV 和加密內容組合：IV:encrypted
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * 解密 state 參數（取得 Session ID）
 * @param encryptedState 加密後的 state 字串
 * @returns Session ID 或 null（如果解密失敗）
 */
export function decryptState(encryptedState: string): string | null {
  try {
    const parts = encryptedState.split(':')
    if (parts.length !== 2) {
      return null
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(STATE_SECRET.substring(0, 32), 'utf8'), iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    return null
  }
}

