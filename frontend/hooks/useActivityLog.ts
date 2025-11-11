import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

export type ActivityEventType = 
  | 'connection.created'
  | 'connection.reauthorized'
  | 'connection_item.disabled'
  | 'connection_item.enabled'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  connectionId?: string
  connectionName?: string
  connectionItemId?: string
  connectionItemName?: string
  message: string
  timestamp: Date
  userId?: string
  userName?: string
}

let activityIdCounter = 0
const activityListeners: Set<(events: ActivityEvent[]) => void> = new Set()
let activities: ActivityEvent[] = []

const notifyListeners = () => {
  activityListeners.forEach((listener) => listener([...activities]))
}

export const activityLog = {
  add: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    // 安全地獲取用戶資訊（避免在 SSR 時出錯）
    let user: { id?: string; name?: string | null; email?: string } | null = null
    try {
      if (typeof window !== 'undefined') {
        const authStore = useAuthStore.getState()
        user = authStore.user
      }
    } catch (error) {
      console.warn('Failed to get user from auth store:', error)
    }
    
    const id = `activity-${activityIdCounter++}`
    const newEvent: ActivityEvent = {
      ...event,
      id,
      timestamp: new Date(),
      userId: user?.id,
      userName: user?.name || user?.email,
    }
    
    activities = [newEvent, ...activities].slice(0, 50) // 保留最近 50 筆
    notifyListeners()
  },
  
  clear: () => {
    activities = []
    notifyListeners()
  },
  
  getAll: (): ActivityEvent[] => {
    return [...activities]
  },
}

export function useActivityLog() {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    const listener = (newEvents: ActivityEvent[]) => {
      setEvents(newEvents)
    }
    activityListeners.add(listener)
    setEvents([...activities])
    
    return () => {
      activityListeners.delete(listener)
    }
  }, [])

  return {
    events,
    add: useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
      activityLog.add(event)
    }, []),
    clear: useCallback(() => {
      activityLog.clear()
    }, []),
  }
}

