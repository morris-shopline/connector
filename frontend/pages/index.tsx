import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useStores } from '../hooks/useStores'
import { useWebhookEvents } from '../hooks/useWebhookEvents'
import { useHealthCheck } from '../hooks/useHealthCheck'
import { useStoreStore } from '../stores/useStoreStore'
import { useAuthStore } from '../stores/useAuthStore'
import { StoreCard } from '../components/StoreCard'
import { WebhookEventCard } from '../components/WebhookEventCard'
import { Header } from '../components/Header'
import { ProtectedRoute } from '../components/ProtectedRoute'

function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stores' | 'events'>('stores')
  const { selectedHandle, setSelectedHandle } = useStoreStore()
  const { isAuthenticated } = useAuthStore()
  const [storeHandle, setStoreHandle] = useState<string>(selectedHandle || 'paykepoc') // 預設測試用的 handle
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false)
  const { stores, isLoading: storesLoading, isError: storesError, mutate: refetchStores } = useStores()
  const { events, isLoading: eventsLoading, isError: eventsError } = useWebhookEvents()
  const { checkHealth, isChecking, status, message, lastChecked } = useHealthCheck()

  // 監聽 URL hash 變化來同步 activeTab
  useEffect(() => {
    const updateTabFromHash = () => {
      if (window.location.hash === '#events') {
        setActiveTab('events')
      } else {
        setActiveTab('stores')
      }
    }
    updateTabFromHash()
    window.addEventListener('hashchange', updateTabFromHash)
    return () => window.removeEventListener('hashchange', updateTabFromHash)
  }, [])
  
  // 處理 OAuth 回調（檢查 URL 參數）
  useEffect(() => {
    if (router.isReady) {
      const urlParams = new URLSearchParams(window.location.search)
      const authSuccess = urlParams.get('auth_success')
      const sessionIdFromUrl = urlParams.get('session_id')
      
      if (authSuccess === 'true') {
        // OAuth 回調成功，恢復使用者認證狀態
        // 如果有 session_id，儲存到 localStorage
        if (sessionIdFromUrl) {
          localStorage.setItem('auth_session_id', sessionIdFromUrl)
          const { setSessionId } = useAuthStore.getState()
          setSessionId(sessionIdFromUrl)
        }
        
        // 檢查認證狀態
        const { checkAuth } = useAuthStore.getState()
        checkAuth()
        
        // 重新載入商店列表
        refetchStores()
        
        // 清除 URL 參數
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [router.isReady, refetchStores])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stores' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">已授權商店</h2>
              <div className="flex items-center gap-3">
                {/* 健康檢查狀態顯示 */}
                {status !== 'idle' && message && (
                  <div className={`text-sm px-3 py-1 rounded-md ${
                    status === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}
                {/* 健康檢查按鈕 */}
                <button
                  onClick={checkHealth}
                  disabled={isChecking}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isChecking
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : status === 'success'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : status === 'error'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={lastChecked ? `最後檢查: ${lastChecked.toLocaleTimeString()}` : '檢查後端連線狀態'}
                >
                  {isChecking ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      檢查中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      檢查後端狀態
                    </span>
                  )}
                </button>
              </div>
            </div>
            
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
                      onChange={(e) => {
                        const newHandle = e.target.value
                        setStoreHandle(newHandle)
                        setSelectedHandle(newHandle)
                      }}
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
                      onClick={async () => {
                        // 確保使用者已登入
                        if (!isAuthenticated) {
                          alert('請先登入後再進行商店授權')
                          router.push('/login')
                          return
                        }
                        
                        const handle = storeHandle || 'paykepoc'
                        
                        try {
                          // 使用 API 調用取得授權 URL（包含 state 參數）
                          const { getAuthorizeUrl } = await import('../lib/api')
                          const response = await getAuthorizeUrl(handle)
                          
                          if (response.success && response.authUrl) {
                            // 跳轉到授權 URL
                            window.location.href = response.authUrl
                          } else {
                            alert('取得授權 URL 失敗：' + (response.error || '未知錯誤'))
                          }
                        } catch (error: any) {
                          console.error('取得授權 URL 錯誤:', error)
                          alert('取得授權 URL 失敗：' + (error.message || '未知錯誤'))
                        }
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

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  )
}
