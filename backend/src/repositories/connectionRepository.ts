/**
 * Connection Repository
 * 
 * R3.0: 提供 Connection 資料存取方法
 * 
 * 提供方法：
 * - findConnectionsByUser(userId): 取得使用者的所有 Connection 及底下項目
 * - findConnectionItems(connectionId): 取得 Connection 的所有 ConnectionItem
 * - findConnectionById(connectionId): 取得單一 Connection
 * - findConnectionItemById(connectionItemId): 取得單一 ConnectionItem
 * - upsertConnection(data): 建立或更新 Connection
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ConnectionWithItems {
  id: string
  userId: string
  platform: string
  externalAccountId: string
  displayName: string | null
  authPayload: Record<string, any>
  status: string
  createdAt: Date
  updatedAt: Date
  connectionItems: Array<{
    id: string
    platform: string
    externalResourceId: string
    displayName: string | null
    metadata: Record<string, any> | null
    status: string
    createdAt: Date
    updatedAt: Date
  }>
}

export class ConnectionRepository {
  /**
   * 取得使用者的所有 Connection 及底下項目
   */
  async findConnectionsByUser(userId: string): Promise<ConnectionWithItems[]> {
    const connections = await prisma.integrationAccount.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        connectionItems: {
          where: {
            status: 'active',
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return connections.map((conn) => ({
      id: conn.id,
      userId: conn.userId,
      platform: conn.platform,
      externalAccountId: conn.externalAccountId,
      displayName: conn.displayName,
      authPayload: conn.authPayload as Record<string, any>,
      status: conn.status,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      connectionItems: conn.connectionItems.map((item) => ({
        id: item.id,
        platform: item.platform,
        externalResourceId: item.externalResourceId,
        displayName: item.displayName,
        metadata: item.metadata as Record<string, any> | null,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    }))
  }

  /**
   * 取得 Connection 的所有 ConnectionItem
   */
  async findConnectionItems(connectionId: string) {
    return prisma.connectionItem.findMany({
      where: {
        integrationAccountId: connectionId,
        status: 'active',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * 取得單一 Connection
   */
  async findConnectionById(connectionId: string) {
    return prisma.integrationAccount.findUnique({
      where: {
        id: connectionId,
      },
      include: {
        connectionItems: {
          where: {
            status: 'active',
          },
        },
      },
    })
  }

  /**
   * 取得單一 ConnectionItem
   */
  async findConnectionItemById(connectionItemId: string) {
    return prisma.connectionItem.findUnique({
      where: {
        id: connectionItemId,
      },
      include: {
        integrationAccount: true,
      },
    })
  }

  /**
   * 根據 platform 和 externalAccountId 尋找 Connection
   */
  async findConnectionByPlatformAndAccount(
    userId: string,
    platform: string,
    externalAccountId: string
  ) {
    return prisma.integrationAccount.findFirst({
      where: {
        userId,
        platform,
        externalAccountId,
      },
      include: {
        connectionItems: {
          where: {
            status: 'active',
          },
        },
      },
    })
  }

  /**
   * 建立或更新 Connection
   */
  async upsertConnection(data: {
    userId: string
    platform: string
    externalAccountId: string
    displayName?: string | null
    authPayload: Record<string, any>
    status?: string
  }) {
    return prisma.integrationAccount.upsert({
      where: {
        userId_platform_externalAccountId: {
          userId: data.userId,
          platform: data.platform,
          externalAccountId: data.externalAccountId,
        },
      },
      update: {
        displayName: data.displayName,
        authPayload: data.authPayload,
        status: data.status || 'active',
        updatedAt: new Date(),
      },
      create: {
        userId: data.userId,
        platform: data.platform,
        externalAccountId: data.externalAccountId,
        displayName: data.displayName,
        authPayload: data.authPayload,
        status: data.status || 'active',
      },
    })
  }

  /**
   * 建立 ConnectionItem
   */
  async createConnectionItem(data: {
    integrationAccountId: string
    platform: string
    externalResourceId: string
    displayName?: string | null
    metadata?: Record<string, any> | null
    status?: string
  }) {
    return prisma.connectionItem.create({
      data: {
        integrationAccountId: data.integrationAccountId,
        platform: data.platform,
        externalResourceId: data.externalResourceId,
        displayName: data.displayName,
        metadata: data.metadata,
        status: data.status || 'active',
      },
    })
  }

  /**
   * 更新 ConnectionItem 狀態
   */
  async updateConnectionItemStatus(itemId: string, status: 'active' | 'disabled') {
    return prisma.connectionItem.update({
      where: {
        id: itemId,
      },
      data: {
        status,
      },
    })
  }
}

// 匯出單例
export const connectionRepository = new ConnectionRepository()

