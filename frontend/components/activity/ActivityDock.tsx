import { useAuditLogs, type AuditLog } from '../../hooks/useAuditLogs'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'

/**
 * 將審計記錄轉換為顯示訊息
 */
function getAuditLogMessage(log: AuditLog): string {
  const connectionName = log.connection?.displayName || log.connection?.externalAccountId || '未命名'
  const itemName = log.connectionItem?.displayName || log.connectionItem?.externalResourceId || ''

  switch (log.operation) {
    case 'connection.create':
      return `Connection "${connectionName}" 已成功建立`
    case 'connection.reauthorize':
      return `Connection "${connectionName}" 已成功重新授權`
    case 'connection.orders.summary':
      return log.result === 'error'
        ? `取得訂單摘要失敗: ${log.errorMessage || '未知錯誤'}`
        : `已成功取得訂單摘要`
    case 'connection_item.enable':
      return itemName 
        ? `Connection Item "${itemName}" 已啟用`
        : `Connection Item 已啟用`
    case 'connection_item.disable':
      return itemName
        ? `Connection Item "${itemName}" 已停用`
        : `Connection Item 已停用`
    default:
      return `${log.operation} - ${log.result === 'error' ? '失敗' : '成功'}`
  }
}

/**
 * 取得事件圖標
 */
function getEventIcon(operation: string, result: 'success' | 'error') {
  if (result === 'error') {
    return (
      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  }

  switch (operation) {
    case 'connection.create':
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
      )
    case 'connection.reauthorize':
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      )
    case 'connection_item.disable':
      return (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      )
    case 'connection_item.enable':
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    default:
      return null
  }
}

export function ActivityDock() {
  const { logs, isLoading } = useAuditLogs(50)

  if (isLoading) {
    return (
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="text-center text-sm text-gray-500">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2">載入中...</span>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="text-center text-sm text-gray-500">
          目前沒有通知
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4 max-h-48 overflow-y-auto">
      <div className="space-y-2">
        {logs.slice(0, 10).map((log) => {
          const message = getAuditLogMessage(log)
          const timestamp = new Date(log.createdAt)

          return (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">{getEventIcon(log.operation, log.result)}</div>
              <div className="flex-1">
                <div className={`${log.result === 'error' ? 'text-red-900' : 'text-gray-900'}`}>
                  {message}
                  {log.errorMessage && (
                    <span className="text-xs text-red-600 ml-2">({log.errorMessage})</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {format(timestamp, 'MM/dd HH:mm', { locale: zhTW })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

