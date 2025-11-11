import { useState, useMemo, useEffect } from 'react'
import { useConnectionStore } from '../../stores/useConnectionStore'
import { useConnections, type Connection } from '../../hooks/useConnections'
import { ConnectionStatusPill } from './ConnectionStatusPill'
import { AddConnectionModal } from './AddConnectionModal'
import { ReauthorizeConnectionModal } from './ReauthorizeConnectionModal'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'

function AddConnectionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors mb-3"
      >
        + 新增 Connection
      </button>
      <AddConnectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

type PlatformFilter = 'all' | 'shopline' | 'next-engine'

export function ConnectionRail() {
  const { connections: storeConnections, selectedConnectionId, setSelectedConnection, setConnections } = useConnectionStore()
  const { connections: apiConnections, isLoading, isError } = useConnections()
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 同步 API 資料到 Store
  useEffect(() => {
    if (apiConnections.length > 0) {
      setConnections(apiConnections)
    }
  }, [apiConnections, setConnections])

  // 過濾 Connections
  const filteredConnections = useMemo(() => {
    let filtered = storeConnections.length > 0 ? storeConnections : apiConnections

    // 平台過濾
    if (platformFilter !== 'all') {
      filtered = filtered.filter((c) => c.platform === platformFilter)
    }

    // 搜尋過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.displayName?.toLowerCase().includes(query) ||
          c.externalAccountId.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [storeConnections, apiConnections, platformFilter, searchQuery])

  // 自動選取第一個 Connection（如果沒有選取的話）
  useEffect(() => {
    if (!selectedConnectionId && filteredConnections.length > 0) {
      setSelectedConnection(filteredConnections[0].id)
    }
  }, [selectedConnectionId, filteredConnections, setSelectedConnection])

  const [reauthorizeConnectionId, setReauthorizeConnectionId] = useState<string | null>(null)

  const handleConnectionClick = (connection: Connection) => {
    setSelectedConnection(connection.id)
  }

  const handleReauthorize = (e: React.MouseEvent, connection: Connection) => {
    e.stopPropagation()
    setReauthorizeConnectionId(connection.id)
  }

  if (isLoading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connections</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-gray-500">載入中...</div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connections</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-red-500">載入錯誤</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Connections</h2>

        {/* 平台過濾器 */}
        <div className="mb-3">
          <div className="flex gap-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                platformFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setPlatformFilter('shopline')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                platformFilter === 'shopline'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Shopline
            </button>
            <button
              onClick={() => setPlatformFilter('next-engine')}
              disabled
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                platformFilter === 'next-engine'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Next Engine
            </button>
          </div>
        </div>

        {/* 搜尋欄位 */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="搜尋 Connection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 新增 Connection 按鈕 */}
        <AddConnectionButton />
      </div>

      {/* Connection 列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredConnections.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-2">沒有 Connection</div>
            <button
              onClick={() => {
                // TODO: Story 4.2 實作新增流程
                console.log('Add new connection')
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              立即新增
            </button>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {filteredConnections.map((connection) => {
              const isSelected = connection.id === selectedConnectionId
              const displayName = connection.displayName || connection.externalAccountId || '未命名'

              return (
                <li key={connection.id}>
                  <div
                    className={`group relative w-full text-left px-3 py-2 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleConnectionClick(connection)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {displayName}
                        </div>
                        <ConnectionStatusPill status={connection.status} />
                      </div>
                    </button>
                    {/* Hover 快速操作 */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleReauthorize(e, connection)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="重新授權"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Reauthorize Modal */}
      {reauthorizeConnectionId && (() => {
        const connection = (storeConnections.length > 0 ? storeConnections : apiConnections).find((c) => c.id === reauthorizeConnectionId)
        const connectionName = connection?.displayName || connection?.externalAccountId || '未命名'
        return (
          <ReauthorizeConnectionModal
            isOpen={!!reauthorizeConnectionId}
            onClose={() => setReauthorizeConnectionId(null)}
            connectionId={reauthorizeConnectionId}
            connectionName={connectionName}
          />
        )
      })()}
    </div>
  )
}

