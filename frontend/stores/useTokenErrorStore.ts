import { create } from 'zustand'

export type TokenErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_REVOKED' | 'TOKEN_SCOPE_MISMATCH'

interface TokenErrorState {
  errorCode: TokenErrorCode | null
  connectionId: string | null
  handle: string | null
  message: string | null
  showModal: boolean
  
  setTokenError: (params: {
    code: TokenErrorCode
    connectionId?: string | null
    handle?: string | null
    message?: string | null
  }) => void
  clearTokenError: () => void
  setShowModal: (show: boolean) => void
}

export const useTokenErrorStore = create<TokenErrorState>((set) => ({
  errorCode: null,
  connectionId: null,
  handle: null,
  message: null,
  showModal: false,
  
  setTokenError: (params) => {
    set({
      errorCode: params.code,
      connectionId: params.connectionId ?? null,
      handle: params.handle ?? null,
      message: params.message ?? null,
      showModal: true,
    })
  },
  
  clearTokenError: () => {
    set({
      errorCode: null,
      connectionId: null,
      handle: null,
      message: null,
      showModal: false,
    })
  },
  
  setShowModal: (show) => {
    set({ showModal: show })
  },
}))

