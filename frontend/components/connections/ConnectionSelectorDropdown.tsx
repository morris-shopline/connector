import { useState } from 'react'
import { useConnectionStore } from '../../stores/useConnectionStore'
import { useConnections } from '../../hooks/useConnections'
import { ConnectionStatusPill } from './ConnectionStatusPill'

interface ConnectionSelectorDropdownProps {
  className?: string
}

function getPlatformDisplayName(platform: string): string {
  switch (platform) {
    case 'shopline':
      return 'Shopline'
    case 'next-engine':
      return 'Next Engine'
    default:
      return platform
  }
}

export function ConnectionSelectorDropdown({ className = '' }: ConnectionSelectorDropdownProps) {
  const { connections: storeConnections, selectedConnectionId, setSelectedConnection } = useConnectionStore()
  const { connections: apiConnections } = useConnections()
  const [isOpen, setIsOpen] = useState(false)

  const connections = storeConnections.length > 0 ? storeConnections : apiConnections
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId)

  const handleSelect = (connectionId: string) => {
    setSelectedConnection(connectionId)
    setIsOpen(false)
  }

  return (
    <div id="connection-selector-dropdown" className={`connection-selector-dropdown relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        連線選擇
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        >
          {selectedConnection ? (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {selectedConnection.displayName || selectedConnection.externalAccountId}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {getPlatformDisplayName(selectedConnection.platform)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">請選擇一個 Connection</div>
          )}
          <svg
            className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Overlay to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            {/* Dropdown menu */}
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
              {connections.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  沒有可用的 Connection
                </div>
              ) : (
                <ul className="py-1">
                  {connections.map((connection) => {
                    const isSelected = connection.id === selectedConnectionId
                    const displayName = connection.displayName || connection.externalAccountId || '未命名'

                    return (
                      <li key={connection.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(connection.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {displayName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{getPlatformDisplayName(connection.platform)}</span>
                              <ConnectionStatusPill status={connection.status} />
                            </div>
                          </div>
                          {isSelected && (
                            <svg className="h-5 w-5 text-blue-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

