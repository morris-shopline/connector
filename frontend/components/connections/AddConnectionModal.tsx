import { useState } from 'react'
import { getAuthorizeUrl, getNextEngineAuthorizeUrl } from '../../lib/api'
import { toast } from '../../hooks/useToast'
import { nextEnginePlatform } from '../../content/platforms/next-engine'

interface AddConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

type Platform = 'shopline' | 'next-engine'

export function AddConnectionModal({ isOpen, onClose }: AddConnectionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('shopline')
  const [handle, setHandle] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Next Engine 不需要 handle
    if (selectedPlatform === 'shopline' && !handle.trim()) {
      toast.error('請輸入商店 Handle')
      return
    }

    setIsLoading(true)
    
    try {
      let response: any
      
      if (selectedPlatform === 'next-engine') {
        // Next Engine 授權流程
        response = await getNextEngineAuthorizeUrl()
      } else {
        // Shopline 授權流程
        response = await getAuthorizeUrl(handle.trim())
        if (response.success) {
          sessionStorage.setItem('oauth_handle', handle.trim())
        }
      }
      
      if (response.success && response.authUrl) {
        // 儲存 return path 以便 OAuth 回調後返回
        sessionStorage.setItem('oauth_return_path', '/connections')
        sessionStorage.setItem('oauth_platform', selectedPlatform)
        
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
          <h2 className="text-xl font-semibold text-gray-900">新增 Connection</h2>
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

        <form onSubmit={handleSubmit}>
          {/* 平台選擇 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇平台
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="platform"
                  value="shopline"
                  checked={selectedPlatform === 'shopline'}
                  onChange={() => setSelectedPlatform('shopline')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Shopline</div>
                  <div className="text-xs text-gray-500">電商平台整合</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="platform"
                  value="next-engine"
                  checked={selectedPlatform === 'next-engine'}
                  onChange={() => setSelectedPlatform('next-engine')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Next Engine</div>
                  <div className="text-xs text-gray-500">電商平台整合</div>
                </div>
              </label>
            </div>
          </div>

          {/* Handle 輸入（僅 Shopline 需要） */}
          {selectedPlatform === 'shopline' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商店 Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="例如: paykepoc"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                這是您的 Shopline 商店識別碼
              </p>
            </div>
          )}

          {/* 流程說明 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">授權流程：</div>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                {selectedPlatform === 'next-engine' ? (
                  <>
                    {nextEnginePlatform.messages.authorize.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </>
                ) : (
                  <>
                    <li>點擊「前往授權」後將跳轉至 Shopline 授權頁面</li>
                    <li>在 Shopline 頁面確認授權</li>
                    <li>授權完成後將自動返回並建立 Connection</li>
                  </>
                )}
              </ol>
            </div>
          </div>

          {/* 按鈕 */}
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
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading}
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
                selectedPlatform === 'next-engine' ? nextEnginePlatform.messages.authorize.button : '前往授權'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

