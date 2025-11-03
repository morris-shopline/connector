import { useState, useEffect } from 'react'

interface SubscriptionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    handle: string
    topic: string
    webhookUrl: string
    apiVersion: string
  }) => void
  defaultHandle?: string
}

export function SubscriptionForm({ isOpen, onClose, onSubmit, defaultHandle }: SubscriptionFormProps) {
  const [handle, setHandle] = useState(defaultHandle || 'paykepoc')
  const [topic, setTopic] = useState('products/update')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookUrlMode, setWebhookUrlMode] = useState<'test' | 'production'>('test')
  const [apiVersion, setApiVersion] = useState('v20250601')

  // 確保 URL 正確拼接，移除尾部斜線避免雙斜線
  const normalizeUrl = (baseUrl: string, path: string): string => {
    const cleanBase = baseUrl.replace(/\/+$/, '') // 移除尾部斜線
    const cleanPath = path.replace(/^\/+/, '') // 移除開頭斜線
    return `${cleanBase}/${cleanPath}`
  }

  useEffect(() => {
    if (webhookUrlMode === 'test') {
      // 測試站：使用 ngrok URL（僅本地開發）
      const testUrl = process.env.NEXT_PUBLIC_NGROK_URL
      if (testUrl) {
        setWebhookUrl(normalizeUrl(testUrl, 'webhook/shopline'))
      } else {
        // 沒有 ngrok URL，使用正式站 URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL
        if (backendUrl) {
          setWebhookUrl(normalizeUrl(backendUrl, 'webhook/shopline'))
        } else {
          alert('⚠️ 請設定 NEXT_PUBLIC_BACKEND_URL 或 NEXT_PUBLIC_NGROK_URL 環境變數')
          setWebhookUrl('')
        }
      }
    } else {
      // 正式站：使用後端 URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL
      if (backendUrl) {
        setWebhookUrl(normalizeUrl(backendUrl, 'webhook/shopline'))
      } else {
        alert('⚠️ 請設定 NEXT_PUBLIC_BACKEND_URL 環境變數')
        setWebhookUrl('')
      }
    }
  }, [webhookUrlMode])

  const COMMON_TOPICS = [
    'orders/create',
    'orders/updated',      // ⚠️ 注意：是 updated 不是 update（根據官方文件 Event Identification）
    'orders/paid',
    'orders/cancelled',
    'products/create',
    'products/update',     // ⚠️ 需確認：可能是 products/updated？
    'products/delete',
    'customers/create',
    'customers/update',    // ⚠️ 需確認：可能是 customers/updated？
    'customers/redact',
    'merchants/redact'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!handle || !topic || !webhookUrl) {
      alert('請填寫所有必填欄位')
      return
    }

    // 驗證 URL 不是測試用的假 URL
    if (webhookUrl.includes('test.example.com') || 
        webhookUrl.includes('example.com') || 
        webhookUrl.includes('test.com')) {
      alert('❌ 錯誤：不能使用測試用的假 URL（test.example.com、example.com 等）\n\n請使用正確的 ngrok URL 或正式站 URL')
      return
    }

    // 驗證 URL 格式
    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      alert('❌ 錯誤：Webhook URL 必須以 http:// 或 https:// 開頭')
      return
    }

    onSubmit({ handle, topic, webhookUrl, apiVersion })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">新增訂閱</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商店 Handle *
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="例如: paykepoc"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              事件主題 (Topic) *
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {COMMON_TOPICS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL 模式 *
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setWebhookUrlMode('test')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  webhookUrlMode === 'test'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                測試站
              </button>
              <button
                type="button"
                onClick={() => setWebhookUrlMode('production')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  webhookUrlMode === 'production'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                正式站
              </button>
            </div>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-webhook-url.com/webhook"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 版本
            </label>
            <input
              type="text"
              value={apiVersion}
              onChange={(e) => setApiVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              確認訂閱
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

