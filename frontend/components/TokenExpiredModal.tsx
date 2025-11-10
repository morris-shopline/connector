import { useEffect } from 'react'
import { useTokenErrorStore } from '../stores/useTokenErrorStore'
import { useReauthorizeConnection } from '../hooks/useReauthorizeConnection'

export function TokenExpiredModal() {
  const { errorCode, handle, message, showModal, setShowModal, clearTokenError } = useTokenErrorStore()
  const { reauthorize, isReauthorizing } = useReauthorizeConnection()

  // 如果沒有錯誤或不需要顯示，不渲染
  if (!showModal || !errorCode) {
    return null
  }

  const handleReauthorize = async () => {
    if (!handle) {
      console.error('無法重新授權：缺少 handle')
      return
    }

    try {
      await reauthorize(handle)
      // 重新授權成功後，關閉 modal
      clearTokenError()
    } catch (error) {
      console.error('重新授權失敗:', error)
      // 錯誤處理：可以顯示錯誤訊息或保持 modal 開啟
    }
  }

  const handleClose = () => {
    setShowModal(false)
    // 不清除錯誤狀態，讓用戶可以稍後再處理
  }

  const getErrorTitle = () => {
    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        return 'Token 已過期'
      case 'TOKEN_REVOKED':
        return 'Token 已撤銷'
      case 'TOKEN_SCOPE_MISMATCH':
        return 'Token 權限不符'
      default:
        return 'Token 錯誤'
    }
  }

  const getErrorDescription = () => {
    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        return '商店的授權 Token 已過期，請重新授權以繼續使用。'
      case 'TOKEN_REVOKED':
        return '商店的授權已被撤銷，請重新授權以繼續使用。'
      case 'TOKEN_SCOPE_MISMATCH':
        return '商店的授權權限不符，請重新授權以取得正確權限。'
      default:
        return message || '發生 Token 錯誤，請重新授權。'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {getErrorTitle()}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isReauthorizing}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">{getErrorDescription()}</p>
            {handle && (
              <p className="text-sm text-gray-500">
                商店：<span className="font-mono">{handle}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isReauthorizing}
            >
              稍後處理
            </button>
            <button
              onClick={handleReauthorize}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isReauthorizing || !handle}
            >
              {isReauthorizing ? '重新授權中...' : '重新授權'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

