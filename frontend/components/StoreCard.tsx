import { StoreInfo } from '@/types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'
import Link from 'next/link'

interface StoreCardProps {
  store: StoreInfo
}

export function StoreCard({ store }: StoreCardProps) {
  const handle = store.handle || store.shoplineId
  
  return (
    <Link 
      href={`/admin-api-test?handle=${encodeURIComponent(handle)}`}
      className="block"
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
    </Link>
  )
}
