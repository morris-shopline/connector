import { format } from 'date-fns'

interface Subscription {
  id: string
  topic: string
  address: string
  created_at?: string
}

interface SubscriptionItemProps {
  subscription: Subscription
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SubscriptionItem({ subscription, isSelected, onSelect, onDelete }: SubscriptionItemProps) {
  // 格式化時間：yyyy-mm-dd hh:mm:ss
  const formatCreatedAt = (createdAt?: string) => {
    if (!createdAt) return ''
    try {
      const date = new Date(createdAt)
      return format(date, 'yyyy-MM-dd HH:mm:ss')
    } catch (e) {
      return ''
    }
  }

  return (
    <div
      className={`group relative p-3 rounded-lg border transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      } cursor-pointer`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <span className={`text-lg ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
          {isSelected ? '●' : '○'}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'} truncate`}>
            {subscription.topic}
          </p>
          <p className="text-xs text-gray-500 truncate mt-1">
            {subscription.address}
          </p>
          {subscription.created_at && (
            <p className="text-xs text-gray-400 mt-1">
              {formatCreatedAt(subscription.created_at)}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`確定要刪除訂閱「${subscription.topic}」嗎？`)) {
              onDelete()
            }
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
          title="刪除訂閱"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1">
          <span className="text-xs text-blue-600 font-medium">已選中</span>
        </div>
      )}
    </div>
  )
}

