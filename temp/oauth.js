const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const path = require('path')
const { 
  verifyGetSignature, 
  verifyPostSignature, 
  verifyTimestamp,
  signPostRequest 
} = require('../utils/signature')

// 載入環境變數
dotenv.config({ path: path.join(__dirname, '../backend/.env') })

// 從環境變數讀取配置
const appType = process.env.APP_TYPE || 'custom'
const config = {
  app_key: appType === 'public' 
    ? (process.env.SHOPLINE_PUBLIC_APP_KEY || '')
    : (process.env.SHOPLINE_CUSTOM_APP_KEY || ''),
  app_secret: appType === 'public'
    ? (process.env.SHOPLINE_PUBLIC_APP_SECRET || '')
    : (process.env.SHOPLINE_CUSTOM_APP_SECRET || ''),
  shop_handle: process.env.SHOPLINE_SHOP_HANDLE || 'paykepoc',
  shop_url: process.env.SHOPLINE_SHOP_URL || `https://${process.env.SHOPLINE_SHOP_HANDLE || 'paykepoc'}.myshopline.com/`,
  redirect_uri: process.env.SHOPLINE_REDIRECT_URI || '',
  port: parseInt(process.env.PORT || '3001', 10),
  jwt_secret: process.env.JWT_SECRET || '',
  ngrok_url: process.env.NGROK_URL || ''
}

const router = express.Router()

/**
 * Step 1: 驗證應用安裝請求
 * 當商家安裝應用時，SHOPLINE 會發送 GET 請求到此端點
 */
router.get('/install', async (req, res) => {
  try {
    console.log('收到安裝請求:', req.query)
    
    const { appkey, handle, timestamp, sign, lang } = req.query
    
    // 驗證必要參數
    if (!appkey || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('簽名驗證失敗')
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('時間戳驗證失敗')
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('App key 不匹配')
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    console.log('安裝請求驗證成功')
    
    // 重導向到授權頁面
    const scope = 'read_products,read_orders' // 根據需求設定權限範圍
    const redirectUri = `${req.protocol}://${req.get('host')}/oauth/callback`
    const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
    
    console.log('重導向到授權頁面:', authUrl)
    res.redirect(authUrl)
    
  } catch (error) {
    console.error('安裝請求處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})

/**
 * Step 3: 接收授權碼
 * 商家授權後，SHOPLINE 會重導向到此端點
 */
router.get('/callback', async (req, res) => {
  try {
    console.log('收到授權回調:', req.query)
    
    const { appkey, code, handle, timestamp, sign, customField } = req.query
    
    // 驗證必要參數
    if (!appkey || !code || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('回調簽名驗證失敗')
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('回調時間戳驗證失敗')
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('回調 App key 不匹配')
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    console.log('授權碼驗證成功:', code)
    
    // 使用授權碼請求 access token
    try {
      const tokenResponse = await requestAccessToken(code, handle)
      
      if (tokenResponse.success) {
        console.log('Access token 獲取成功')
        res.json({
          success: true,
          message: 'OAuth 流程完成',
          data: tokenResponse.data
        })
      } else {
        console.error('Access token 獲取失敗:', tokenResponse.error)
        res.status(500).json({
          success: false,
          error: tokenResponse.error
        })
      }
    } catch (tokenError) {
      console.error('Token 請求錯誤:', tokenError)
      res.status(500).json({
        success: false,
        error: 'Failed to get access token'
      })
    }
    
  } catch (error) {
    console.error('授權回調處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})

/**
 * Step 4: 請求 Access Token
 * 使用授權碼向 SHOPLINE 請求 access token
 */
async function requestAccessToken(authorizationCode, handle) {
  try {
    const timestamp = Date.now().toString()
    const body = JSON.stringify({ code: authorizationCode })
    const sign = signPostRequest(body, timestamp, config.app_secret)
    
    const response = await axios.post(
      `https://${handle}.myshopline.com/admin/oauth/token/create`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'appkey': config.app_key,
          'timestamp': timestamp,
          'sign': sign
        }
      }
    )
    
    if (response.data.code === 200) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Token request failed'
      }
    }
  } catch (error) {
    console.error('Token 請求錯誤:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

/**
 * Step 6: 刷新 Access Token
 * 當 access token 即將過期時，使用此端點刷新
 */
router.post('/refresh', async (req, res) => {
  try {
    const { handle } = req.body
    
    if (!handle) {
      return res.status(400).json({ 
        error: 'Missing handle parameter' 
      })
    }
    
    const timestamp = Date.now().toString()
    const body = JSON.stringify({})
    const sign = signPostRequest(body, timestamp, config.app_secret)
    
    const response = await axios.post(
      `https://${handle}.myshopline.com/admin/oauth/token/refresh`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'appkey': config.app_key,
          'timestamp': timestamp,
          'sign': sign
        }
      }
    )
    
    if (response.data.code === 200) {
      res.json({
        success: true,
        data: response.data.data
      })
    } else {
      res.status(500).json({
        success: false,
        error: response.data.message || 'Token refresh failed'
      })
    }
    
  } catch (error) {
    console.error('Token 刷新錯誤:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    })
  }
})

/**
 * 測試端點 - 顯示應用狀態
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'running',
    app_key: config.app_key,
    shop_handle: config.shop_handle,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
