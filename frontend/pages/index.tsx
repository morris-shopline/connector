import { useState } from 'react'
import Link from 'next/link'
import { useStores } from '../hooks/useStores'
import { useWebhookEvents } from '../hooks/useWebhookEvents'
import { StoreCard } from '../components/StoreCard'
import { WebhookEventCard } from '../components/WebhookEventCard'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'stores' | 'events'>('stores')
  const [storeHandle, setStoreHandle] = useState<string>('paykepoc') // 預設測試用的 handle
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false)
  const { stores, isLoading: storesLoading, isError: storesError } = useStores()
  const { events, isLoading: eventsLoading, isError: eventsError } = useWebhookEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Shopline API 整合儀表板
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('stores')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'stores'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                商店列表
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'events'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Webhook 事件
              </button>
              <Link
                href="/webhook-test"
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
              >
                Webhook 管理
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stores' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">已授權商店</h2>
            
            {/* 授權對話框 */}
            {showAuthDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAuthDialog(false)}>
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-semibold mb-4">新增商店授權</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商店 Handle
                    </label>
                    <input
                      type="text"
                      value={storeHandle}
                      onChange={(e) => setStoreHandle(e.target.value)}
                      placeholder="例如: paykepoc"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAuthDialog(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        // 根據環境變數選擇使用的 App 配置
                        const appType = process.env.NEXT_PUBLIC_APP_TYPE || 'custom'
                        const appKey = appType === 'public' 
                          ? (process.env.NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_KEY || 'c6e5110e6e06b928920af61b322e1db0ca446c16')
                          : (process.env.NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b')
                        const appSecret = appType === 'public'
                          ? (process.env.NEXT_PUBLIC_SHOPLINE_PUBLIC_APP_SECRET || '62589f36ba6e496ae37b00fc75c434a5fece4fb9')
                          : (process.env.NEXT_PUBLIC_SHOPLINE_CUSTOM_APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858')
                        const handle = storeHandle || 'paykepoc'
                        const timestamp = Math.floor(Date.now() / 1000).toString()
                        
                        // 生成簽名
                        const params = { appkey: appKey, handle, timestamp }
                        const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&')
                        
                        // 使用 Web Crypto API 生成 HMAC-SHA256
                        const encoder = new TextEncoder()
                        const keyData = encoder.encode(appSecret)
                        const messageData = encoder.encode(sortedParams)
                        
                        crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
                          .then(key => crypto.subtle.sign('HMAC', key, messageData))
                          .then(signature => {
                            const hashArray = Array.from(new Uint8Array(signature))
                            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_NGROK_URL
                            if (!backendUrl) {
                              alert('❌ 錯誤：請設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
                              return
                            }
                            const cleanUrl = backendUrl.replace(/\/+$/, '') // 移除尾部斜線
                            const url = `${cleanUrl}/api/auth/shopline/install?appkey=${appKey}&handle=${handle}&timestamp=${timestamp}&sign=${hashHex}`
                            window.location.href = url
                          })
                          .catch(() => {
                            // 如果 Web Crypto API 失敗，使用簡單的測試簽名
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_NGROK_URL
                            if (!backendUrl) {
                              alert('❌ 錯誤：請設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
                              return
                            }
                            const cleanUrl = backendUrl.replace(/\/+$/, '') // 移除尾部斜線
                            window.location.href = `${cleanUrl}/api/auth/shopline/install?appkey=${appKey}&handle=${handle}&timestamp=${timestamp}&sign=test`
                          })
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      確認授權
                    </button>
                  </div>
                </div>
              </div>
            )}

            {storesLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            )}

            {storesError && (
              <div className="text-center py-8">
                <p className="text-red-600">載入商店資料時發生錯誤</p>
              </div>
            )}

            {!storesLoading && !storesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
                {/* 新增商店卡片 */}
                <div
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
                >
                  <div className="text-gray-400 mb-3">
                    <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">新增商店授權</h3>
                  <p className="text-sm text-gray-500 text-center">點擊此處開始授權新的商店</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Webhook 事件</h2>
              <div className="text-sm text-gray-600">
                共 {events.length} 個事件
              </div>
            </div>

            {eventsLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            )}

            {eventsError && (
              <div className="text-center py-8">
                <p className="text-red-600">載入事件資料時發生錯誤</p>
              </div>
            )}

            {!eventsLoading && !eventsError && events.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">尚未收到 Webhook 事件</h3>
                <p className="text-gray-600">當商店發生事件時，相關資料會顯示在這裡</p>
              </div>
            )}

            {!eventsLoading && !eventsError && events.length > 0 && (
              <div className="space-y-4">
                {events.map((event) => (
                  <WebhookEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
