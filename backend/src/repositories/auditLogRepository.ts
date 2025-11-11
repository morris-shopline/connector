/**
 * Audit Log Repository
 * 
 * Story 4.3: 提供審計記錄的資料存取方法
 * 
 * 提供方法：
 * - createAuditLog: 建立審計記錄
 * - findAuditLogsByConnection: 取得 Connection 的審計記錄
 * - findAuditLogsByUser: 取得使用者的審計記錄
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateAuditLogParams {
  userId: string
  connectionId?: string
  connectionItemId?: string
  operation: string
  result?: 'success' | 'error'
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

export class AuditLogRepository {
  /**
   * 建立審計記錄
   */
  async createAuditLog(params: CreateAuditLogParams) {
    return prisma.integrationAuditLog.create({
      data: {
        userId: params.userId,
        connectionId: params.connectionId || null,
        connectionItemId: params.connectionItemId || null,
        operation: params.operation,
        result: params.result || 'success',
        errorCode: params.errorCode || null,
        errorMessage: params.errorMessage || null,
        metadata: params.metadata || null,
      },
    })
  }

  /**
   * 取得 Connection 的審計記錄（最近 N 筆）
   */
  async findAuditLogsByConnection(connectionId: string, limit: number = 50) {
    return prisma.integrationAuditLog.findMany({
      where: {
        connectionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        connection: {
          select: {
            id: true,
            displayName: true,
            externalAccountId: true,
          },
        },
        connectionItem: {
          select: {
            id: true,
            displayName: true,
            externalResourceId: true,
          },
        },
      },
    })
  }

  /**
   * 取得使用者的審計記錄（最近 N 筆）
   */
  async findAuditLogsByUser(userId: string, limit: number = 50) {
    return prisma.integrationAuditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        connection: {
          select: {
            id: true,
            displayName: true,
            externalAccountId: true,
          },
        },
        connectionItem: {
          select: {
            id: true,
            displayName: true,
            externalResourceId: true,
          },
        },
      },
    })
  }

  /**
   * 取得所有審計記錄（用於 Activity Dock，最近 N 筆）
   */
  async findRecentAuditLogs(limit: number = 50) {
    return prisma.integrationAuditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        connection: {
          select: {
            id: true,
            displayName: true,
            externalAccountId: true,
          },
        },
        connectionItem: {
          select: {
            id: true,
            displayName: true,
            externalResourceId: true,
          },
        },
      },
    })
  }
}

// 匯出單例
export const auditLogRepository = new AuditLogRepository()

