import { StoreInfo } from '@/types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'
import { useRouter } from 'next/router'
import { type ConnectionParams } from '../hooks/useConnection'

interface StoreCardProps {
  store: StoreInfo
  onSelect?: (params: ConnectionParams) => Promise<void> | void
}

export function StoreCard({ store, onSelect }: StoreCardProps) {
  const handle = store.handle || store.shoplineId
  const router = useRouter()
  
  const handleClick = async () => {
    const platform = (store as any).platform ?? 'shopline'
    const connectionId = (store as any).connectionId ?? store.shoplineId ?? store.id ?? null
    const connectionItemId = store.id ?? store.shoplineId ?? null
    const params: ConnectionParams = {
      platform,
      connectionId,
      connectionItemId,
    }

    // 現階段簡化：只更新 Zustand，不更新 URL
    // 1. 先更新 Zustand（Source of Truth）
    if (onSelect) {
      onSelect(params)
    }

    // 2. 然後導航到新頁面（不帶 query parameters，因為現階段不會有 URL 分享上下文的情境）
    router.push('/admin-api-test')
  }
  
  return (
    <div 
      onClick={handleClick}
      className="block cursor-pointer"
    >
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:border-blue-400">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {store.handle || '未命名商店'}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          store.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {store.isActive ? '啟用中' : '已停用'}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div>
          <span className="font-medium">商店 ID:</span> {store.shoplineId}
        </div>
        {store.handle && (
          <div>
            <span className="font-medium">網域:</span> {store.handle}.myshopline.com
          </div>
        )}
        {store.expiresAt && (
          <div>
            <span className="font-medium">Token 到期時間:</span>{' '}
            {format(new Date(store.expiresAt), 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
          </div>
        )}
        <div>
          <span className="font-medium">建立時間:</span>{' '}
          {format(new Date(store.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
        </div>
        <div>
          <span className="font-medium">最後更新:</span>{' '}
          {format(new Date(store.updatedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhTW })}
        </div>
      </div>
      </div>
    </div>
  )
}
