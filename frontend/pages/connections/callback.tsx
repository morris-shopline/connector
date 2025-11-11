import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { useConnections } from '../../hooks/useConnections'
import { useConnectionStore } from '../../stores/useConnectionStore'
import { toast } from '../../hooks/useToast'

function CallbackPage() {
  const router = useRouter()
  const { mutate: refetchConnections } = useConnections()
  const { setSelectedConnection } = useConnectionStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!router.isReady) return

    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      // 檢查是否是 OAuth 回調（後端會 redirect 到 frontendUrl 並帶上 auth_success）
      const authSuccess = urlParams.get('auth_success')
      const statusParam = urlParams.get('status') || (authSuccess === 'true' ? 'success' : authSuccess === 'false' ? 'error' : null)
      const errorParam = urlParams.get('error')
      const connectionId = urlParams.get('connectionId')
      const handle = sessionStorage.getItem('oauth_handle')

      // 清除 sessionStorage
      sessionStorage.removeItem('oauth_return_path')
      sessionStorage.removeItem('oauth_handle')

      if (statusParam === 'success') {
        setStatus('success')
        
        // 檢查是否是重新授權
        const reauthorizeConnectionId = sessionStorage.getItem('reauthorize_connection_id')
        sessionStorage.removeItem('reauthorize_connection_id')

        // 刷新 Connection 列表
        try {
          const connections = await refetchConnections()
          
          if (reauthorizeConnectionId) {
            // 重新授權流程
            const connection = (connections as any[]).find((c) => c.id === reauthorizeConnectionId)
            if (connection) {
              setSelectedConnection(connection.id)
              const displayName = connection.displayName || connection.externalAccountId || '未命名'
              toast.success(`已成功重新授權 Connection: ${displayName}`)
              // 審計記錄已由後端寫入，Activity Dock 會自動從後端讀取
            }
          } else if (connectionId) {
            // 新增 Connection 流程 - 優先使用 connectionId（最可靠）
            const newConnection = (connections as any[]).find((c) => c.id === connectionId)
            if (newConnection) {
              setSelectedConnection(newConnection.id)
              const displayName = newConnection.displayName || newConnection.externalAccountId || '未命名'
              toast.success(`已成功建立 Connection: ${displayName}`)
              // 審計記錄已由後端寫入，Activity Dock 會自動從後端讀取
            } else {
              // 如果找不到，可能是列表還沒刷新，等待一下再試
              console.warn(`Connection ${connectionId} 尚未出現在列表中，等待刷新...`)
              setTimeout(async () => {
                const refreshedConnections = await refetchConnections()
                const foundConnection = (refreshedConnections as any[]).find((c) => c.id === connectionId)
                if (foundConnection) {
                  setSelectedConnection(foundConnection.id)
                  const displayName = foundConnection.displayName || foundConnection.externalAccountId || '未命名'
                  toast.success(`已成功建立 Connection: ${displayName}`)
                  // 審計記錄已由後端寫入，Activity Dock 會自動從後端讀取
                } else {
                  console.error(`無法找到 Connection ${connectionId}`)
                  toast.error('Connection 建立成功，但無法在列表中顯示')
                }
              }, 1000)
            }
          } else if (handle) {
            // 新增 Connection 流程 - 備用：使用 handle 查找
            const newConnection = (connections as any[]).find(
              (c) => c.externalAccountId === handle || c.displayName === handle
            )
            if (newConnection) {
              setSelectedConnection(newConnection.id)
              const displayName = newConnection.displayName || newConnection.externalAccountId || '未命名'
              toast.success(`已成功建立 Connection: ${displayName}`)
              // 審計記錄已由後端寫入，Activity Dock 會自動從後端讀取
            } else {
              console.warn(`無法找到 handle 為 ${handle} 的 Connection`)
              toast.warning('Connection 可能已建立，但無法在列表中顯示')
            }
          } else {
            // 沒有 connectionId 也沒有 handle，顯示一般成功訊息
            toast.success('授權成功')
          }
        } catch (error: any) {
          console.error('刷新 Connection 列表錯誤:', error)
          toast.error('操作成功，但刷新列表時發生錯誤')
        }

        // 3 秒後導向到 /connections
        setTimeout(() => {
          router.push('/connections')
        }, 3000)
      } else {
        setStatus('error')
        const errorMsg = errorParam || '授權失敗'
        setErrorMessage(errorMsg)
        toast.error(`授權失敗: ${errorMsg}`)
        
        // 5 秒後導向到 /connections
        setTimeout(() => {
          router.push('/connections')
        }, 5000)
      }
    }

    handleCallback()
  }, [router.isReady, router, refetchConnections, setSelectedConnection])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">處理授權回調中...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">授權成功</h2>
            <p className="text-gray-600 mb-4">Connection 已成功建立</p>
            <p className="text-sm text-gray-500">即將導向到 Connection 管理頁面...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">授權失敗</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">即將導向到 Connection 管理頁面...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CallbackPageWrapper() {
  return (
    <ProtectedRoute>
      <CallbackPage />
    </ProtectedRoute>
  )
}

