interface SubscriptionStatsProps {
  subscriptions: any[]
}

export function SubscriptionStats({ subscriptions }: SubscriptionStatsProps) {
  const total = subscriptions.length
  
  const stats = subscriptions.reduce((acc, sub) => {
    const topic = sub.topic || ''
    if (topic.startsWith('orders/')) {
      acc.orders++
    } else if (topic.startsWith('products/')) {
      acc.products++
    } else if (topic.startsWith('customers/')) {
      acc.customers++
    } else {
      acc.others++
    }
    return acc
  }, { orders: 0, products: 0, customers: 0, others: 0 })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 訂閱統計</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">總數:</span>
          <span className="text-sm font-medium text-gray-900">{total}</span>
        </div>
        {stats.orders > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">orders:</span>
            <span className="text-sm font-medium text-gray-900">{stats.orders}</span>
          </div>
        )}
        {stats.products > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">products:</span>
            <span className="text-sm font-medium text-gray-900">{stats.products}</span>
          </div>
        )}
        {stats.customers > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">customers:</span>
            <span className="text-sm font-medium text-gray-900">{stats.customers}</span>
          </div>
        )}
        {stats.others > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">others:</span>
            <span className="text-sm font-medium text-gray-900">{stats.others}</span>
          </div>
        )}
      </div>
    </div>
  )
}

