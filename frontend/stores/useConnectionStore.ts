import { create } from 'zustand'
import type { Connection } from '../hooks/useConnections'

type Nullable<T> = T | null

interface ConnectionStoreState {
  // Connection 列表
  connections: Connection[]
  isLoading: boolean
  isError: Error | null

  // 選取的 Connection
  selectedConnectionId: Nullable<string>

  // Actions
  setConnections: (connections: Connection[]) => void
  setSelectedConnection: (connectionId: Nullable<string>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  refreshConnections: () => Promise<void>
  resetState: () => void
}

const initialState: Pick<
  ConnectionStoreState,
  | 'connections'
  | 'isLoading'
  | 'isError'
  | 'selectedConnectionId'
> = {
  connections: [],
  isLoading: false,
  isError: null,
  selectedConnectionId: null,
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  ...initialState,

  setConnections: (connections) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConnectionStore] setConnections', { count: connections.length })
    }
    set({ connections })
  },

  setSelectedConnection: (connectionId) => {
    if (get().selectedConnectionId === connectionId) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConnectionStore] setSelectedConnection', { connectionId })
    }
    set({ selectedConnectionId: connectionId })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ isError: error })
  },

  refreshConnections: async () => {
    // 這個方法會由 useConnections hook 調用，實際的 API 呼叫在 hook 中處理
    // 這裡只是標記需要刷新，實際刷新由 SWR 處理
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConnectionStore] refreshConnections')
    }
    // 實際刷新由 useConnections hook 的 mutate 方法處理
  },

  resetState: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ConnectionStore] resetState')
    }
    set({ ...initialState })
  },
}))

