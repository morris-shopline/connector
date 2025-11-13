import { PrismaClient } from '@prisma/client'
import { ShoplineService } from '../services/shopline'

/**
 * 為 Store 查詢加入 userId 過濾
 * @param userId 使用者 ID
 * @returns Prisma where 條件
 */
export function filterStoresByUser(userId: string) {
  return { userId }
}

/**
 * 為 WebhookEvent 查詢加入 userId 過濾
 * @param userId 使用者 ID
 * @returns Prisma where 條件
 */
export function filterWebhookEventsByUser(userId: string) {
  return { userId }
}

/**
 * 驗證 Store 是否屬於使用者
 * @param storeId 商店 ID
 * @param userId 使用者 ID
 * @returns 是否屬於該使用者
 */
export async function verifyStoreOwnership(storeId: string, userId: string): Promise<boolean> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    })
    return !!store
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 驗證 Store Handle 是否屬於使用者
 * @param handle 商店 handle
 * @param userId 使用者 ID
 * @returns 是否屬於該使用者
 */
export async function verifyStoreHandleOwnership(handle: string, userId: string): Promise<boolean> {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    const store = await prisma.store.findFirst({
      where: {
        handle,
        userId,
      },
    })
    return !!store
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * 建立帶有狀態碼和錯誤碼的錯誤物件
 * 符合專案架構的錯誤處理模式
 */
export class RouteError extends Error {
  statusCode: number
  code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'RouteError'
  }
}

/**
 * 取得 Shopline Store 並驗證 AccessToken
 * Story 5.4: 統一處理 store 和 accessToken 驗證邏輯，避免重複代碼
 * 
 * @param handle 商店 handle
 * @param shoplineService ShoplineService 實例
 * @returns Store 物件（包含 accessToken）
 * @throws RouteError 如果 store 不存在或 accessToken 不存在
 */
export async function getShoplineStoreWithToken(
  handle: string,
  shoplineService: ShoplineService
): Promise<{ accessToken: string; handle: string; [key: string]: any }> {
  const store = await shoplineService.getStoreByHandle(handle)
  
  if (!store) {
    throw new RouteError('Store not found', 404, 'STORE_NOT_FOUND')
  }
  
  if (!store.accessToken) {
    throw new RouteError('Access token not found for this store', 401, 'TOKEN_NOT_FOUND')
  }
  
  return {
    ...store,
    accessToken: store.accessToken,
    handle: store.handle || handle,
  }
}

/**
 * 統一處理 Route 錯誤回應
 * Story 5.4: 符合專案架構的錯誤處理模式
 * 
 * @param error 錯誤物件
 * @param reply Fastify reply 物件
 * @param defaultMessage 預設錯誤訊息
 */
export function handleRouteError(error: any, reply: any, defaultMessage: string = 'Internal server error') {
  // 處理 RouteError（符合專案架構）
  if (error instanceof RouteError || (error.statusCode && error.code)) {
    return reply.status(error.statusCode).send({
      success: false,
      code: error.code,
      error: error.message
    })
  }
  
  // 處理 Token 過期錯誤
  if (error.message?.includes('ACCESS_TOKEN_EXPIRED') || error.message?.includes('TOKEN_EXPIRED')) {
    return reply.status(401).send({
      success: false,
      code: 'TOKEN_EXPIRED',
      error: error.message
    })
  }
  
  // 預設錯誤處理
  return reply.status(500).send({
    success: false,
    code: 'INTERNAL_ERROR',
    error: error.message || defaultMessage
  })
}

