import { PrismaClient } from '@prisma/client'

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

