import { useState } from 'react'
import { useConnectionStore } from '../../stores/useConnectionStore'
import { apiClient } from '../../lib/api'
import { toast } from '../../hooks/useToast'
import { ConnectionStatusPill } from './ConnectionStatusPill'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'
import { useConnections } from '../../hooks/useConnections'

export function ConnectionItemsTable() {
  const { connections, selectedConnectionId } = useConnectionStore()
  const { mutate: refetchConnections } = useConnections()
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)

  if (!selectedConnection) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">請選擇一個 Connection</div>
      </div>
    )
  }

  const items = selectedConnection.connectionItems

  const handleToggleStatus = async (itemId: string, currentStatus: string) => {
    if (updatingItemId) return

    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    const action = newStatus === 'disabled' ? '停用' : '啟用'
    const item = items.find((i) => i.id === itemId)
    const itemName = item?.displayName || item?.externalResourceId || '未命名'

    if (newStatus === 'disabled') {
      const confirmed = window.confirm(
        `確定要停用 "${itemName}" 嗎？\n\n停用後：\n- Webhook 將停止接收事件\n- API 操作可能需要重新授權`
      )
      if (!confirmed) return
    }

    setUpdatingItemId(itemId)

    try {
      const response = await apiClient.updateConnectionItemStatus(itemId, newStatus)

      if (response.success) {
        toast.success(`已成功${action} "${itemName}"`)
        
        // 審計記錄已由後端寫入，Activity Dock 會自動從後端讀取

        // 刷新 Connection 列表
        await refetchConnections()
      } else {
        toast.error(response.error || `${action}失敗`)
      }
    } catch (error: any) {
      console.error(`${action} Connection Item 錯誤:`, error)
      toast.error(error.message || `${action}失敗`)
    } finally {
      setUpdatingItemId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">沒有 Connection Items</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Connection Items</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                名稱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                資源 ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最近同步
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const displayName = item.displayName || item.externalResourceId || '未命名'
              const updatedAt = item.updatedAt instanceof Date 
                ? item.updatedAt 
                : new Date(item.updatedAt)
              const isUpdating = updatingItemId === item.id

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{displayName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{item.externalResourceId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ConnectionStatusPill status={item.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(updatedAt, 'MM/dd HH:mm', { locale: zhTW })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      disabled={isUpdating}
                      className={`${
                        item.status === 'active'
                          ? 'text-yellow-600 hover:text-yellow-900'
                          : 'text-green-600 hover:text-green-900'
                      } disabled:text-gray-400 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          處理中...
                        </span>
                      ) : item.status === 'active' ? (
                        '停用'
                      ) : (
                        '啟用'
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

