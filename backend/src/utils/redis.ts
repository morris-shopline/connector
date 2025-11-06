import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis | null {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      try {
        // ioredis 自動支援 TLS（當 URL 是 rediss:// 時）
        // 支援格式：
        // - redis://host:port (無 TLS)
        // - rediss://host:port (TLS)
        // - rediss://user:password@host:port (TLS + 認證)
        redis = new Redis(redisUrl, {
          // 如果 URL 是 rediss://，ioredis 會自動啟用 TLS
          // 不需要額外設定 tls 選項
          retryStrategy: (times) => {
            // 最多重試 3 次
            if (times > 3) {
              console.error('Redis connection failed after 3 retries')
              return null // 停止重試
            }
            return Math.min(times * 50, 2000) // 重試間隔：50ms, 100ms, 150ms, 最多 2s
          }
        })
        
        redis.on('error', (err) => {
          console.error('Redis Client Error:', err)
          // 連線錯誤時不拋出異常，允許降級到資料庫查詢
        })
        
        redis.on('connect', () => {
          const isTLS = redisUrl.startsWith('rediss://')
          console.log(`✅ [DEBUG] Redis Client Connected${isTLS ? ' (TLS)' : ''}`)
        })
        
        redis.on('ready', () => {
          console.log('✅ [DEBUG] Redis Client Ready')
        })
        
        redis.on('close', () => {
          console.log('⚠️  [DEBUG] Redis Client Closed')
        })
        
        redis.on('reconnecting', (delay) => {
          console.log(`🔄 [DEBUG] Redis Client Reconnecting (delay: ${delay}ms)`)
        })
      } catch (error) {
        console.error('Failed to initialize Redis:', error)
        // 連線失敗時返回 null，允許降級到資料庫查詢
        redis = null
      }
    } else {
      // 如果沒有設定 REDIS_URL，嘗試使用分離的環境變數
      const redisHost = process.env.REDIS_HOST || 'localhost'
      const redisPort = parseInt(process.env.REDIS_PORT || '6379')
      const redisPassword = process.env.REDIS_PASSWORD
      
      if (redisHost !== 'localhost' || redisPassword) {
        try {
          redis = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            retryStrategy: (times) => {
              // 最多重試 3 次
              if (times > 3) {
                console.error('Redis connection failed after 3 retries')
                return null // 停止重試
              }
              return Math.min(times * 50, 2000) // 重試間隔：50ms, 100ms, 150ms, 最多 2s
            }
          })
          
          redis.on('error', (err) => {
            console.error('Redis Client Error:', err)
          })
          
          redis.on('connect', () => {
            console.log('Redis Client Connected')
          })
          
          redis.on('ready', () => {
            console.log('Redis Client Ready')
          })
        } catch (error) {
          console.error('Failed to initialize Redis:', error)
          redis = null
        }
      } else {
        // 如果使用 localhost 且沒有密碼，可能是開發環境，不建立連線
        console.warn('Redis not configured. Using database fallback.')
        redis = null
      }
    }
  }
  return redis
}

/**
 * 關閉 Redis 連線（通常在應用程式關閉時調用）
 */
export function closeRedisClient(): void {
  if (redis) {
    redis.quit()
    redis = null
  }
}

