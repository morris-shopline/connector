import { useConnectionStore } from '../../stores/useConnectionStore'
import { ConnectionStatusPill } from './ConnectionStatusPill'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'

export function ConnectionItemsPreview() {
  const { connections, selectedConnectionId } = useConnectionStore()
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)

  if (!selectedConnection) {
    return null
  }

  const items = selectedConnection.connectionItems

  // 如果只有 0~1 筆 Item，顯示簡短摘要
  if (items.length <= 1) {
    if (items.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500">沒有 Connection Items</div>
        </div>
      )
    }

    const item = items[0]
    const displayName = item.displayName || item.externalResourceId || '未命名'
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-sm text-gray-700">
          <span className="font-medium">主要商店：</span>
          {displayName}
        </div>
      </div>
    )
  }

  // 有多筆 Item，顯示前 3 筆
  const previewItems = items.slice(0, 3)
  const hasMore = items.length > 3

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connection Items</h3>
        {hasMore && (
          <button
            onClick={() => {
              // TODO: 導向 Connection Items Tab
              console.log('View all items')
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        )}
      </div>

      <div className="space-y-3">
        {previewItems.map((item) => {
          const displayName = item.displayName || item.externalResourceId || '未命名'
          const updatedAt = item.updatedAt instanceof Date 
            ? item.updatedAt 
            : new Date(item.updatedAt)

          return (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {item.externalResourceId}
                </div>
                <div className="text-xs text-gray-500">
                  最近同步: {format(updatedAt, 'MM/dd HH:mm', { locale: zhTW })}
                </div>
              </div>
              <ConnectionStatusPill status={item.status} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

