import { useState } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'

interface WebhookEvent {
  id: string
  webhookId: string // 官方 Webhook ID
  topic: string // 事件主題，例如：orders/update
  eventType: string // 與 topic 相同（兼容欄位）
  shopDomain?: string // 商店域名
  shoplineId?: string // 商店 ID
  merchantId?: string // 商家 ID
  apiVersion?: string // API 版本
  payload: any
  processed: boolean
  createdAt: string
  store: {
    shoplineId: string
    domain?: string
  }
}

interface WebhookEventCardProps {
  event: WebhookEvent
  isExpanded?: boolean
  onToggle?: () => void
}

export function WebhookEventCard({ event, isExpanded: controlledExpanded, onToggle }: WebhookEventCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded))

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={handleToggle}>
      {/* 收合狀態 - 始終顯示 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {event.topic || event.eventType}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span>
                {format(new Date(event.createdAt), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhTW })}
              </span>
              <span>•</span>
              <span className={event.processed ? 'text-green-600' : 'text-yellow-600'}>
                {event.processed ? '✅ 已處理' : '⏳ 待處理'}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.processed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {event.processed ? '已處理' : '待處理'}
            </span>
          </div>
        </div>
        {!isExpanded && (
          <p className="text-xs text-gray-400 mt-2">點擊展開詳情...</p>
        )}
      </div>

      {/* 展開狀態 - 完整詳情 */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Webhook ID:</span>
              <p className="text-gray-600 mt-1">{event.webhookId}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">商店:</span>
              <p className="text-gray-600 mt-1">
                {event.store.shoplineId}
                {event.store.domain && ` (${event.store.domain})`}
              </p>
            </div>
            {event.shopDomain && (
              <div>
                <span className="font-medium text-gray-700">商店域名:</span>
                <p className="text-gray-600 mt-1">{event.shopDomain}</p>
              </div>
            )}
            {event.merchantId && (
              <div>
                <span className="font-medium text-gray-700">商家 ID:</span>
                <p className="text-gray-600 mt-1">{event.merchantId}</p>
              </div>
            )}
            {event.apiVersion && (
              <div>
                <span className="font-medium text-gray-700">API 版本:</span>
                <p className="text-gray-600 mt-1">{event.apiVersion}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">接收時間:</span>
              <p className="text-gray-600 mt-1">
                {format(new Date(event.createdAt), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhTW })}
              </p>
            </div>
          </div>

          {/* Payload 資料 */}
          <div>
            <span className="font-medium text-gray-700 block mb-2">Payload:</span>
            <pre className="p-3 bg-white border border-gray-200 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>

          <p className="text-xs text-gray-400">點擊卡片收合</p>
        </div>
      )}
    </div>
  )
}
