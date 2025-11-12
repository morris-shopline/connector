import { useState } from 'react'
import { useConnectionStore } from '../../stores/useConnectionStore'
import { ConnectionStatusPill } from './ConnectionStatusPill'
import { ReauthorizeConnectionModal } from './ReauthorizeConnectionModal'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'
import { nextEnginePlatform } from '../../content/platforms/next-engine'

export function ConnectionSummaryCard() {
  const { connections, selectedConnectionId } = useConnectionStore()
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)
  const [isReauthorizeModalOpen, setIsReauthorizeModalOpen] = useState(false)

  if (!selectedConnection) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">請選擇一個 Connection</div>
      </div>
    )
  }

  const platformDisplayName = selectedConnection.platform === 'shopline' 
    ? 'Shopline' 
    : selectedConnection.platform === 'next-engine'
    ? nextEnginePlatform.displayName
    : selectedConnection.platform
  const displayName = selectedConnection.displayName || selectedConnection.externalAccountId || '未命名 Connection'
  const handle = selectedConnection.externalAccountId
  // Next Engine 使用 expiresAt，Shopline 使用 expires_at
  const expiresAt = selectedConnection.authPayload?.expiresAt
    ? new Date(selectedConnection.authPayload.expiresAt)
    : selectedConnection.authPayload?.expires_at
    ? new Date(selectedConnection.authPayload.expires_at)
    : null
  const createdAt = selectedConnection.createdAt instanceof Date 
    ? selectedConnection.createdAt 
    : new Date(selectedConnection.createdAt)
  const updatedAt = selectedConnection.updatedAt instanceof Date
    ? selectedConnection.updatedAt
    : new Date(selectedConnection.updatedAt)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connection 摘要</h3>
        <ConnectionStatusPill status={selectedConnection.status} />
      </div>

      <div className="space-y-4">
        {/* 平台資訊 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">平台</div>
          <div className="text-sm text-gray-900">{platformDisplayName}</div>
        </div>

        {/* 平台帳戶識別 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">平台帳戶</div>
          <div className="text-sm text-gray-900">{displayName}</div>
          {handle && (
            <div className="text-xs text-gray-500 mt-1">Handle: {handle}</div>
          )}
        </div>

        {/* Token 資訊 */}
        {expiresAt && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Token 到期時間</div>
            <div className="text-sm text-gray-900">
              {format(expiresAt, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
            </div>
          </div>
        )}

        {/* 建立時間 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">建立時間</div>
          <div className="text-sm text-gray-900">
            {format(createdAt, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
          </div>
        </div>

        {/* 最後更新時間 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">最後更新</div>
          <div className="text-sm text-gray-900">
            {format(updatedAt, 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
          </div>
        </div>

        {/* Connection Items 數量 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Connection Items</div>
          <div className="text-sm text-gray-900">{selectedConnection.connectionItems.length} 個項目</div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => setIsReauthorizeModalOpen(true)}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          重新授權
        </button>
      </div>

      <ReauthorizeConnectionModal
        isOpen={isReauthorizeModalOpen}
        onClose={() => setIsReauthorizeModalOpen(false)}
        connectionId={selectedConnection.id}
        connectionName={displayName}
      />
    </div>
  )
}

