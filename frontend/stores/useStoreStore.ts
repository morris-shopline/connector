import { create } from 'zustand'

type Nullable<T> = T | null

interface ConnectionState {
  selectedPlatform: Nullable<string>
  selectedConnectionId: Nullable<string>
  selectedConnectionItemId: Nullable<string>
  lockedConnectionItemId: Nullable<string>

  setSelectedPlatform: (platform: Nullable<string>) => void
  setSelectedConnectionId: (connectionId: Nullable<string>) => void
  setSelectedConnectionItemId: (connectionItemId: Nullable<string>) => void
  setSelectedConnection: (params: {
    platform: Nullable<string>
    connectionId: Nullable<string>
    connectionItemId: Nullable<string>
  }) => void
  lockConnectionItem: (connectionItemId: string) => void
  unlockConnectionItem: () => void
  resetState: () => void
}

const initialState: Pick<
  ConnectionState,
  | 'selectedPlatform'
  | 'selectedConnectionId'
  | 'selectedConnectionItemId'
  | 'lockedConnectionItemId'
> = {
  selectedPlatform: null,
  selectedConnectionId: null,
  selectedConnectionItemId: null,
  lockedConnectionItemId: null,
}

export const useStoreStore = create<ConnectionState>((set, get) => ({
  ...initialState,

  setSelectedPlatform: (platform) => {
    if (get().selectedPlatform === platform) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] setSelectedPlatform', { platform })
    }
    set({ selectedPlatform: platform })
  },

  setSelectedConnectionId: (connectionId) => {
    if (get().selectedConnectionId === connectionId) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] setSelectedConnectionId', { connectionId })
    }
    set({ selectedConnectionId: connectionId })
  },

  setSelectedConnectionItemId: (connectionItemId) => {
    const { lockedConnectionItemId } = get()
    if (lockedConnectionItemId && connectionItemId && lockedConnectionItemId !== connectionItemId) {
      console.warn(`Cannot switch connection item: ${lockedConnectionItemId} is locked`)
      return
    }
    if (get().selectedConnectionItemId === connectionItemId) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] setSelectedConnectionItemId', { connectionItemId })
    }
    set({ selectedConnectionItemId: connectionItemId })
  },
  
  setSelectedConnection: ({ platform, connectionId, connectionItemId }) => {
    const { lockedConnectionItemId } = get()
    if (lockedConnectionItemId && connectionItemId && lockedConnectionItemId !== connectionItemId) {
      console.warn(`Cannot switch connection: ${lockedConnectionItemId} is locked`)
      return
    }
    const state = get()
    if (
      state.selectedPlatform === (platform ?? null) &&
      state.selectedConnectionId === (connectionId ?? null) &&
      state.selectedConnectionItemId === (connectionItemId ?? null)
    ) {
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] setSelectedConnection', {
        platform,
        connectionId,
        connectionItemId,
      })
    }
    set({
      selectedPlatform: platform ?? null,
      selectedConnectionId: connectionId ?? null,
      selectedConnectionItemId: connectionItemId ?? null,
    })
  },
  
  lockConnectionItem: (connectionItemId) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] lockConnectionItem', { connectionItemId })
    }
    set({ lockedConnectionItemId: connectionItemId })
  },

  unlockConnectionItem: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] unlockConnectionItem')
    }
    set({ lockedConnectionItemId: null })
  },

  resetState: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Store] resetState')
    }
    set({ ...initialState })
  },
}))
