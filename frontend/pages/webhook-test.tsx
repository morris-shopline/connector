import { useState } from 'react'
import Link from 'next/link'
import { useStores } from '../hooks/useStores'
import { useWebhookSubscriptions } from '../hooks/useWebhookSubscriptions'
import { useWebhookEvents } from '../hooks/useWebhookEvents'
import { useSubscribeWebhook } from '../hooks/useSubscribeWebhook'
import { useUnsubscribeWebhook } from '../hooks/useUnsubscribeWebhook'
import { SubscriptionItem } from '../components/SubscriptionItem'
import { SubscriptionStats } from '../components/SubscriptionStats'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { WebhookEventCard } from '../components/WebhookEventCard'

export default function WebhookTest() {
  const [selectedHandle, setSelectedHandle] = useState<string>('paykepoc')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [eventFilter, setEventFilter] = useState<'all' | 'processed' | 'pending'>('all')

  const { stores } = useStores()
  const { subscriptions, isLoading: subsLoading, mutate: mutateSubs } = useWebhookSubscriptions(selectedHandle)
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
      alert(`訂閱失敗: ${result.error}`)
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
      alert(`取消訂閱失敗: ${result.error}`)
    }
  }

  const handleQuickTest = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_NGROK_URL
    if (!backendUrl) {
      console.error('❌ 錯誤：請設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Webhook 管理
            </h1>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                商店列表
              </Link>
              <Link
                href="/"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                Webhook 事件
              </Link>
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
              value={selectedHandle}
              onChange={(e) => {
                setSelectedHandle(e.target.value)
                setSelectedTopic(null) // 切換商店時清空選中訂閱
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stores.map(store => (
                <option key={store.id} value={store.handle || store.shoplineId}>
                  {store.handle || store.shoplineId}
                </option>
              ))}
            </select>
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
        defaultHandle={selectedHandle}
      />
    </div>
  )
}

