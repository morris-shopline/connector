import { useState, useMemo } from 'react'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { PrimaryLayout } from '../components/layout/PrimaryLayout'
import { useWebhookEvents } from '../hooks/useWebhookEvents'
import { WebhookEventCard } from '../components/WebhookEventCard'

function WebhookEventsPage() {
  const { events, isLoading } = useWebhookEvents()
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [eventFilter, setEventFilter] = useState<'all' | 'processed' | 'pending'>('all')

  // 過濾事件
  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        // 狀態篩選
        if (eventFilter === 'processed') return event.processed
        if (eventFilter === 'pending') return !event.processed
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [events, eventFilter])

  return (
    <PrimaryLayout>
      <div className="p-6">
        {/* 頁面標題 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Webhook 事件</h1>
              <p className="text-sm text-gray-600 mt-1">查看所有 Webhook 事件記錄</p>
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
        {isLoading ? (
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
              尚未收到任何 Webhook 事件，請等待商店觸發事件
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
    </PrimaryLayout>
  )
}

export default function WebhookEventsPageWrapper() {
  return (
    <ProtectedRoute>
      <WebhookEventsPage />
    </ProtectedRoute>
  )
}

