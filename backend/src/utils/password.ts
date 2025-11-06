import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * 加密密碼
 * @param password 明文密碼
 * @returns 加密後的密碼 hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 驗證密碼
 * @param password 明文密碼
 * @param hash 加密後的密碼 hash
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

