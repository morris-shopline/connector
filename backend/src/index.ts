import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// 載入環境變數
dotenv.config()

// 檢查必要的環境變數
const requiredEnvVars = ['DATABASE_URL']
if (!process.env.DATABASE_URL) {
  console.error('❌ 缺少必要的環境變數: DATABASE_URL')
  process.exit(1)
}

// 導入路由
import { authRoutes } from './routes/auth'
import { webhookRoutes } from './routes/webhook'
import { apiRoutes } from './routes/api'

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  },
  // 忽略尾部的斜線，避免 404
  ignoreTrailingSlash: true
})

// 初始化 Prisma
const prisma = new PrismaClient()

// 註冊插件
async function registerPlugins() {
  // CORS 設定
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? [
          'https://connector-theta.vercel.app',
          'https://connector.vercel.app',
          /https:\/\/connector.*\.vercel\.app/, // 允許所有 Vercel 子域名
          process.env.FRONTEND_URL || 'https://connector-theta.vercel.app'
        ]
      : process.env.FRONTEND_URL 
          ? [process.env.FRONTEND_URL]
          : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })

  // 安全標頭
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    // 允許被 Shopline 嵌入
    frameguard: false
  })

  // 速率限制
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // Session 支援 (簡化版)
  fastify.addHook('preHandler', async (request: any, reply) => {
    if (!request.session) {
      request.session = new Map()
    }
  })
}

// 註冊路由
async function registerRoutes() {
  // 註冊授權路由
  await fastify.register(authRoutes)
  await fastify.register(webhookRoutes)
  await fastify.register(apiRoutes)
}

// 啟動伺服器
async function start() {
  // 檢查 Redis 連線狀態
  console.log('🔍 [DEBUG] 檢查 Redis 連線狀態...')
  const { getRedisClient } = await import('./utils/redis')
  const redis = getRedisClient()
  if (redis) {
    console.log('✅ [DEBUG] Redis 客戶端已初始化')
    try {
      // 測試 Redis 連線
      await redis.ping()
      console.log('✅ [DEBUG] Redis PING 成功，連線正常')
    } catch (error) {
      console.error('❌ [DEBUG] Redis PING 失敗:', error)
    }
  } else {
    console.error('❌ [DEBUG] Redis 客戶端未初始化，請檢查 REDIS_URL 環境變數')
  }
  try {
    await registerPlugins()
    await registerRoutes()

    const port = parseInt(process.env.PORT || '3001', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    
    console.log(`🚀 伺服器啟動成功！`)
    console.log(`📍 本地地址: http://localhost:${port}`)
    console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`)
    
    // 優雅關閉
    process.on('SIGINT', async () => {
      console.log('\n🛑 正在關閉伺服器...')
      await fastify.close()
      await prisma.$disconnect()
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error)
    process.exit(1)
  }
}

// 啟動應用程式
start()
