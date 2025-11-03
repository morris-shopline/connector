const crypto = require('crypto')

/**
 * 生成 HMAC-SHA256 簽名
 * @param {string} source - 要簽名的內容
 * @param {string} secret - APP Secret
 * @returns {string} 簽名字串
 */
function generateHmacSha256(source, secret) {
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
 * 驗證 GET 請求的簽名
 * @param {Object} params - 查詢參數物件
 * @param {string} receivedSign - 接收到的簽名
 * @param {string} appSecret - APP Secret
 * @returns {boolean} 簽名是否有效
 */
function verifyGetSignature(params, receivedSign, appSecret) {
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
 * @param {string} body - 請求主體
 * @param {string} timestamp - 時間戳
 * @param {string} receivedSign - 接收到的簽名
 * @param {string} appSecret - APP Secret
 * @returns {boolean} 簽名是否有效
 */
function verifyPostSignature(body, timestamp, receivedSign, appSecret) {
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
 * @param {string} requestTimestamp - 請求時間戳
 * @param {number} toleranceMinutes - 容忍分鐘數，預設 10 分鐘
 * @returns {boolean} 時間戳是否有效
 */
function verifyTimestamp(requestTimestamp, toleranceMinutes = 10) {
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
 * @param {Object} params - 查詢參數物件
 * @param {string} appSecret - APP Secret
 * @returns {string} 簽名字串
 */
function signGetRequest(params, appSecret) {
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
 * @param {string} body - 請求主體
 * @param {string} timestamp - 時間戳
 * @param {string} appSecret - APP Secret
 * @returns {string} 簽名字串
 */
function signPostRequest(body, timestamp, appSecret) {
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}

module.exports = {
  generateHmacSha256,
  verifyGetSignature,
  verifyPostSignature,
  verifyTimestamp,
  signGetRequest,
  signPostRequest
}
