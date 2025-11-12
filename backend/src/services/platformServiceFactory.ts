/**
 * Platform Service Factory
 * 
 * Story 5.1: 提供統一的平台 Adapter 工廠，根據 platform 參數回傳對應的 Adapter。
 * 
 * 使用方式：
 * ```typescript
 * const adapter = PlatformServiceFactory.getAdapter('next-engine')
 * const authUrl = adapter.getAuthorizeUrl(state)
 * ```
 */

import { Platform, PlatformAdapter } from '../types/platform'
import { NextEngineAdapter } from './nextEngine'
// ShoplineAdapter 將在 Story 5.4 重構時加入
// import { ShoplineAdapter } from './shoplineAdapter'

export class PlatformServiceFactory {
  private static adapters: Map<Platform, PlatformAdapter> = new Map()

  /**
   * 註冊平台 Adapter
   */
  static registerAdapter(platform: Platform, adapter: PlatformAdapter) {
    this.adapters.set(platform, adapter)
  }

  /**
   * 取得平台 Adapter
   * @param platform 平台識別
   * @returns Platform Adapter 實例
   * @throws Error 如果平台未註冊
   */
  static getAdapter(platform: Platform): PlatformAdapter {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`Platform adapter not found: ${platform}`)
    }
    return adapter
  }

  /**
   * 檢查平台是否已註冊
   */
  static hasAdapter(platform: Platform): boolean {
    return this.adapters.has(platform)
  }

  /**
   * 初始化所有平台 Adapter（在應用啟動時呼叫）
   */
  static initialize() {
    // 註冊 Next Engine Adapter
    const nextEngineAdapter = new NextEngineAdapter()
    this.registerAdapter('next-engine', nextEngineAdapter)

    // Shopline Adapter 將在 Story 5.4 重構時加入
    // const shoplineAdapter = new ShoplineAdapter()
    // this.registerAdapter('shopline', shoplineAdapter)
  }
}

