import { useActivityLog } from '../../hooks/useActivityLog'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale/index.js'

export function ActivityDock() {
  const { events } = useActivityLog()

  if (events.length === 0) {
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
        {events.slice(0, 10).map((event) => {
          const getEventIcon = () => {
            switch (event.type) {
              case 'connection.created':
                return (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                )
              case 'connection.reauthorized':
                return (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                )
              case 'connection_item.disabled':
                return (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                )
              case 'connection_item.enabled':
                return (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )
              default:
                return null
            }
          }

          return (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">{getEventIcon()}</div>
              <div className="flex-1">
                <div className="text-gray-900">{event.message}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {format(event.timestamp, 'MM/dd HH:mm', { locale: zhTW })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

