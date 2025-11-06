import { create } from 'zustand'

interface StoreState {
  selectedHandle: string | null
  lockedHandle: string | null
  selectedPlatform: string | null
  selectedAPI: string | null
  
  setSelectedHandle: (handle: string | null) => void
  lockHandle: (handle: string) => void
  unlockHandle: () => void
  setSelectedPlatform: (platform: string | null) => void
  setSelectedAPI: (api: string | null) => void
}

export const useStoreStore = create<StoreState>((set, get) => ({
  selectedHandle: null,
  lockedHandle: null,
  selectedPlatform: null,
  selectedAPI: null,
  
  setSelectedHandle: (handle) => {
    const { lockedHandle } = get()
    if (lockedHandle && handle !== lockedHandle) {
      console.warn(`Cannot switch store: ${lockedHandle} is locked`)
      return
    }
    set({ selectedHandle: handle })
  },
  
  lockHandle: (handle) => {
    set({ lockedHandle: handle })
  },
  
  unlockHandle: () => {
    set({ lockedHandle: null })
  },
  
  setSelectedPlatform: (platform) => {
    set({ selectedPlatform: platform })
  },
  
  setSelectedAPI: (api) => {
    set({ selectedAPI: api })
  },
}))
