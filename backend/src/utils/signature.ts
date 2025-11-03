import crypto from 'crypto'

/**
 * 生成 HMAC-SHA256 簽名
 */
export function generateHmacSha256(source: string, secret: string): string {
  if (!source || !secret) {
    throw new Error('Source and secret must not be empty')
  }
  
  try {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(source, 'utf8')
      .digest('hex')
    return signature
  } catch (error) {
    console.error('Error generating HMAC-SHA256 signature:', error)
    throw error
  }
}

/**
 * 生成 HMAC-SHA256 簽名 (舊版相容)
 */
export function generateSignature(
  params: Record<string, string>,
  secret: string
): string {
  // 將參數按鍵名排序並拼接
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return generateHmacSha256(sortedParams, secret)
}

/**
 * 驗證 GET 請求的簽名
 */
export function verifyGetSignature(
  params: Record<string, string>,
  receivedSign: string,
  appSecret: string
): boolean {
  try {
    // 移除 sign 參數
    const filteredParams = Object.keys(params)
      .filter(key => key !== 'sign')
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {})

    // 按字母順序排序
    const sortedKeys = Object.keys(filteredParams).sort()
    
    // 建立查詢字串
    const queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&')

    // 計算預期簽名
    const expectedSign = generateHmacSha256(queryString, appSecret)
    
    // 使用 crypto.timingSafeEqual 進行安全比較
    return crypto.timingSafeEqual(
      Buffer.from(expectedSign, 'hex'),
      Buffer.from(receivedSign, 'hex')
    )
  } catch (error) {
    console.error('Error verifying GET signature:', error)
    return false
  }
}

/**
 * 驗證 POST 請求的簽名
 */
export function verifyPostSignature(
  body: string,
  timestamp: string,
  receivedSign: string,
  appSecret: string
): boolean {
  try {
    // 建立要簽名的字串：body + timestamp
    const source = body + timestamp
    
    // 計算預期簽名
    const expectedSign = generateHmacSha256(source, appSecret)
    
    // 使用 crypto.timingSafeEqual 進行安全比較
    return crypto.timingSafeEqual(
      Buffer.from(expectedSign, 'hex'),
      Buffer.from(receivedSign, 'hex')
    )
  } catch (error) {
    console.error('Error verifying POST signature:', error)
    return false
  }
}

/**
 * 驗證時間戳是否在允許範圍內
 */
export function verifyTimestamp(
  requestTimestamp: string,
  toleranceMinutes: number = 10
): boolean {
  try {
    const currentTime = Date.now()
    const requestTime = parseInt(requestTimestamp)
    const timeDiff = Math.abs(currentTime - requestTime)
    const toleranceMs = toleranceMinutes * 60 * 1000
    
    return timeDiff <= toleranceMs
  } catch (error) {
    console.error('Error verifying timestamp:', error)
    return false
  }
}

/**
 * 為 GET 請求生成簽名
 */
export function signGetRequest(
  params: Record<string, string>,
  appSecret: string
): string {
  // 按字母順序排序參數
  const sortedKeys = Object.keys(params).sort()
  
  // 建立查詢字串
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')

  return generateHmacSha256(queryString, appSecret)
}

/**
 * 為 POST 請求生成簽名
 */
export function signPostRequest(
  body: string,
  timestamp: string,
  appSecret: string
): string {
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}

/**
 * 驗證 HMAC-SHA256 簽名 (舊版相容)
 */
export function verifySignature(
  params: Record<string, string>,
  secret: string,
  receivedSignature: string
): boolean {
  try {
    const expectedSignature = generateSignature(params, secret)
    
    // 確保兩個簽名長度相同
    if (expectedSignature.length !== receivedSignature.length) {
      return false
    }
    
    // 檢查是否為有效的 hex 字串
    if (!/^[0-9a-fA-F]+$/.test(receivedSignature)) {
      return false
    }
    
    // 將兩個簽名轉換為 buffer
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const receivedBuffer = Buffer.from(receivedSignature, 'hex')
    
    // 確保 buffer 長度相同（防止 timingSafeEqual 錯誤）
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }
    
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch (error) {
    // 如果出現任何錯誤（如無效的 hex 字串），返回 false
    return false
  }
}

/**
 * 生成隨機字串 (用於 state 參數)
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * 驗證 Webhook 簽名
 * Webhook 簽名規則：對整個 Request Body（未解析的 JSON 字串）進行 HMAC-SHA256
 * 
 * @param body - Request Body 的原始字串（未解析的 JSON）
 * @param receivedSignature - Header 中的 X-Shopline-Hmac-Sha256
 * @param appSecret - 應用程式密鑰
 * @returns 簽名是否有效
 */
export function verifyWebhookSignature(
  body: string,
  receivedSignature: string,
  appSecret: string
): boolean {
  try {
    if (!body || !receivedSignature || !appSecret) {
      return false
    }

    // 計算預期簽名：對整個 Body 進行 HMAC-SHA256
    const expectedSignature = generateHmacSha256(body, appSecret)

    // 檢查是否為有效的 hex 字串
    if (!/^[0-9a-fA-F]+$/.test(receivedSignature)) {
      return false
    }

    // 將兩個簽名轉換為 buffer
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const receivedBuffer = Buffer.from(receivedSignature, 'hex')

    // 確保 buffer 長度相同（防止 timingSafeEqual 錯誤）
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }

    // 使用 crypto.timingSafeEqual 進行安全比較，防止時序攻擊
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}
