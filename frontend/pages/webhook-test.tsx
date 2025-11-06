import { useState, useEffect } from 'react'
import { useStores } from '../hooks/useStores'
import { useWebhookSubscriptions } from '../hooks/useWebhookSubscriptions'
import { useWebhookEvents } from '../hooks/useWebhookEvents'
import { useSubscribeWebhook } from '../hooks/useSubscribeWebhook'
import { useUnsubscribeWebhook } from '../hooks/useUnsubscribeWebhook'
import { useStoreStore } from '../stores/useStoreStore'
import { Header } from '../components/Header'
import { SubscriptionItem } from '../components/SubscriptionItem'
import { SubscriptionStats } from '../components/SubscriptionStats'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { WebhookEventCard } from '../components/WebhookEventCard'

export default function WebhookTest() {
  const { selectedHandle, setSelectedHandle, lockedHandle } = useStoreStore()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [eventFilter, setEventFilter] = useState<'all' | 'processed' | 'pending'>('all')

  const { stores } = useStores()
  
  // 初始化時如果沒有選中商店，使用第一個商店作為預設值
  useEffect(() => {
    if (!selectedHandle && stores.length > 0) {
      setSelectedHandle(stores[0].handle || stores[0].shoplineId || null)
    }
  }, [stores.length]) // 只在 stores 載入時執行一次
  
  // 只使用 selectedHandle，避免狀態不一致導致多次請求
  const { subscriptions, isLoading: subsLoading, isTokenExpired, tokenExpiredMessage, mutate: mutateSubs } = useWebhookSubscriptions(selectedHandle)
  const { events, isLoading: eventsLoading } = useWebhookEvents()
  const { subscribe, isLoading: isSubscribing } = useSubscribeWebhook()
  const { unsubscribe, isLoading: isUnsubscribing } = useUnsubscribeWebhook()

  // 過濾事件：只顯示選中訂閱的事件
  const filteredEvents = events
    .filter(event => {
      // 如果選中了訂閱，只顯示該訂閱的事件
      if (selectedTopic) {
        return event.topic === selectedTopic
      }
      return true
    })
    .filter(event => {
      // 狀態篩選
      if (eventFilter === 'processed') return event.processed
      if (eventFilter === 'pending') return !event.processed
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleSubscribe = async (data: {
    handle: string
    topic: string
    webhookUrl: string
    apiVersion: string
  }) => {
    const result = await subscribe(data)
    if (result.success) {
      setShowSubscriptionForm(false)
      mutateSubs()
      // 如果是快速測試（products/update），自動選中
      if (data.topic === 'products/update') {
        setSelectedTopic('products/update')
      }
    } else {
      // 檢查是否為 Token 過期錯誤
      if (result.code === 'TOKEN_EXPIRED') {
        const confirmMessage = `${result.error}\n\n是否要重新授權商店？`
        if (confirm(confirmMessage)) {
          // 導向到商店列表頁面進行重新授權
          window.location.href = '/'
      }
    } else {
      alert(`訂閱失敗: ${result.error}`)
      }
    }
  }

  const handleUnsubscribe = async (webhookId: string) => {
    const result = await unsubscribe(webhookId, selectedHandle)
    if (result.success) {
      mutateSubs()
      // 如果刪除的是當前選中的訂閱，清空選中狀態
      const deletedSub = subscriptions.find((s: any) => s.id === webhookId)
      if (deletedSub && deletedSub.topic === selectedTopic) {
        setSelectedTopic(null)
      }
    } else {
      // 檢查是否為 Token 過期錯誤
      if (result.code === 'TOKEN_EXPIRED') {
        const confirmMessage = `${result.error}\n\n是否要重新授權商店？`
        if (confirm(confirmMessage)) {
          // 導向到商店列表頁面進行重新授權
          window.location.href = '/'
      }
    } else {
      alert(`取消訂閱失敗: ${result.error}`)
      }
    }
  }

  const handleQuickTest = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_NGROK_URL
    if (!backendUrl) {
      console.error('❌ 錯誤：請設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
      return
    }
    if (!selectedHandle) {
      alert('請先選擇商店')
      return
    }
    await handleSubscribe({
      handle: selectedHandle,
      topic: 'products/update',
      webhookUrl: `${backendUrl.replace(/\/+$/, '')}/webhook/shopline`,
      apiVersion: 'v20250601'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Layout - 雙欄式 */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* 左側欄 */}
        <aside className="w-80 border-r bg-gray-50 flex flex-col">
          {/* 商店選擇 */}
          <div className="p-4 border-b bg-white">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商店選擇
            </label>
            <select
              value={selectedHandle || ''}
              onChange={(e) => {
                const newHandle = e.target.value
                // 檢查是否有鎖定的 handle
                if (lockedHandle && newHandle !== lockedHandle) {
                  alert(`無法切換商店：${lockedHandle} 正在操作中，請等待操作完成`)
                  return
                }
                // 直接更新 Zustand Store
                setSelectedHandle(newHandle || null)
                setSelectedTopic(null) // 切換商店時清空選中訂閱
              }}
              disabled={!!lockedHandle}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stores.map(store => (
                <option key={store.id} value={store.handle || store.shoplineId}>
                  {store.handle || store.shoplineId}
                </option>
              ))}
            </select>
            {lockedHandle && (
              <p className="mt-2 text-xs text-yellow-600">
                ⚠️ {lockedHandle} 正在操作中，無法切換商店
              </p>
            )}
          </div>

          {/* 新增訂閱按鈕 */}
          <div className="p-4 border-b bg-white">
            <button
              onClick={() => setShowSubscriptionForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + 新增訂閱
            </button>
            <button
              onClick={handleQuickTest}
              disabled={isSubscribing}
              className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? '訂閱中...' : '快速測試 (products/update)'}
            </button>
          </div>

          {/* 訂閱統計 */}
          {!subsLoading && subscriptions.length > 0 && (
            <div className="p-4 border-b">
              <SubscriptionStats subscriptions={subscriptions} />
            </div>
          )}

          {/* 訂閱列表（可滾動） */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 訂閱列表</h3>
            
            {/* Token 過期提示 */}
            {isTokenExpired && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 mb-2">{tokenExpiredMessage}</p>
                <button
                  onClick={() => {
                    if (confirm('是否要重新授權商店？')) {
                      window.location.href = '/'
                    }
                  }}
                  className="text-xs text-yellow-900 underline hover:text-yellow-700"
                >
                  前往重新授權
                </button>
              </div>
            )}
            
            {subsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">載入中...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">尚未訂閱任何 Webhook</p>
                <p className="text-xs text-gray-400 mt-1">點擊上方按鈕新增訂閱</p>
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptions.map((subscription: any) => (
                  <div key={subscription.id} className="group">
                    <SubscriptionItem
                      subscription={subscription}
                      isSelected={selectedTopic === subscription.topic}
                      onSelect={() => {
                        // 如果已經選中，再次點擊則取消選中（顯示全部）
                        if (selectedTopic === subscription.topic) {
                          setSelectedTopic(null)
                        } else {
                          setSelectedTopic(subscription.topic)
                        }
                      }}
                      onDelete={() => handleUnsubscribe(subscription.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 右側主要內容區 */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-6">
            {/* 事件列表標題 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">📨 事件列表</h2>
                  {selectedTopic && (
                    <p className="text-sm text-gray-600 mt-1">
                      當前選中: <span className="font-medium text-blue-600">{selectedTopic}</span>
                    </p>
                  )}
                </div>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部狀態</option>
                  <option value="processed">已處理</option>
                  <option value="pending">待處理</option>
                </select>
              </div>
            </div>

            {/* 事件列表 */}
            {eventsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">載入中...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">尚未收到事件</h3>
                <p className="text-gray-600">
                  {selectedTopic 
                    ? `尚未收到「${selectedTopic}」事件，請等待商店觸發事件`
                    : '尚未收到任何事件，請等待商店觸發事件'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <WebhookEventCard
                    key={event.id}
                    event={event}
                    isExpanded={expandedEventId === event.id}
                    onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 訂閱表單 Modal */}
      <SubscriptionForm
        isOpen={showSubscriptionForm}
        onClose={() => setShowSubscriptionForm(false)}
        onSubmit={handleSubscribe}
        defaultHandle={selectedHandle || ''}
      />
    </div>
  )
}

