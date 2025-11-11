import { useState } from 'react'
import { getAuthorizeUrl } from '../../lib/api'
import { toast } from '../../hooks/useToast'
import { useConnectionStore } from '../../stores/useConnectionStore'

interface ReauthorizeConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  connectionId: string
  connectionName: string
  errorCode?: 'TOKEN_EXPIRED' | 'TOKEN_REVOKED' | 'TOKEN_SCOPE_MISMATCH'
}

export function ReauthorizeConnectionModal({
  isOpen,
  onClose,
  connectionId,
  connectionName,
  errorCode,
}: ReauthorizeConnectionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { connections } = useConnectionStore()
  const connection = connections.find((c) => c.id === connectionId)
  const handle = connection?.externalAccountId || ''

  if (!isOpen) return null

  const getErrorDescription = () => {
    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        return 'Token 已過期，需要重新授權以繼續使用此 Connection。'
      case 'TOKEN_REVOKED':
        return 'Token 已被撤銷，需要重新授權以恢復此 Connection。'
      case 'TOKEN_SCOPE_MISMATCH':
        return 'Token 權限範圍不符，需要重新授權以取得正確權限。'
      default:
        return '需要重新授權以更新此 Connection 的授權狀態。'
    }
  }

  const handleReauthorize = async () => {
    if (!handle) {
      toast.error('無法取得 Connection Handle')
      return
    }

    setIsLoading(true)

    try {
      // 儲存重新授權的資訊
      sessionStorage.setItem('reauthorize_connection_id', connectionId)
      sessionStorage.setItem('reauthorize_return_path', '/connections')
      sessionStorage.setItem('reauthorize_handle', handle)

      const response = await getAuthorizeUrl(handle)

      if (response.success && response.authUrl) {
        // 跳轉到 OAuth 授權頁面
        window.location.href = response.authUrl
      } else {
        toast.error(response.error || '取得授權 URL 失敗')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('取得授權 URL 錯誤:', error)
      toast.error(error.message || '取得授權 URL 失敗')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">重新授權 Connection</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-700 mb-2">
            <span className="font-medium">Connection:</span> {connectionName}
          </div>
          {errorCode && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">錯誤原因:</div>
                <div>{getErrorDescription()}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">重新授權流程：</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>點擊「前往授權」後將跳轉至 Shopline 授權頁面</li>
              <li>在 Shopline 頁面確認授權</li>
              <li>授權完成後將自動返回並更新 Connection 狀態</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleReauthorize}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading || !handle}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                處理中...
              </span>
            ) : (
              '前往授權'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

