import { useConnectionStore } from '../../stores/useConnectionStore'
import { ConnectionStatusPill } from '../connections/ConnectionStatusPill'

export function ContextBar() {
  const { connections, selectedConnectionId } = useConnectionStore()
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)

  if (!selectedConnection) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="text-sm text-gray-500">請選擇一個 Connection</div>
      </div>
    )
  }

  const platformDisplayName = selectedConnection.platform === 'shopline' ? 'Shopline' : selectedConnection.platform
  const displayName = selectedConnection.displayName || selectedConnection.externalAccountId || '未命名 Connection'

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{platformDisplayName}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-700">{displayName}</span>
          </div>
          <ConnectionStatusPill status={selectedConnection.status} />
        </div>
        <div className="text-xs text-gray-500">
          {selectedConnection.connectionItems.length} 個項目
        </div>
      </div>
    </div>
  )
}

