import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
  
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }
    
    set({ isLoading: true })
    try {
      const { getCurrentUser } = await import('../lib/api')
      const response = await getCurrentUser()
      if (response.success && response.user) {
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          token,
          isLoading: false 
        })
      } else {
        localStorage.removeItem('auth_token')
        set({ user: null, isAuthenticated: false, token: null, isLoading: false })
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
      set({ user: null, isAuthenticated: false, token: null, isLoading: false })
    }
  },
  
  login: async (email: string, password: string) => {
    const { login } = await import('../lib/api')
    const response = await login(email, password)
    if (response.success && response.token && response.user) {
      localStorage.setItem('auth_token', response.token)
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        token: response.token 
      })
    } else {
      throw new Error(response.error || '登入失敗')
    }
  },
  
  register: async (email: string, password: string, name?: string) => {
    const { register } = await import('../lib/api')
    const response = await register(email, password, name)
    if (response.success && response.user) {
      // 註冊成功後自動登入
      const { login } = await import('../lib/api')
      const loginResponse = await login(email, password)
      if (loginResponse.success && loginResponse.token && loginResponse.user) {
        localStorage.setItem('auth_token', loginResponse.token)
        set({ 
          user: loginResponse.user, 
          isAuthenticated: true, 
          token: loginResponse.token 
        })
      } else {
        throw new Error('註冊成功，但自動登入失敗')
      }
    } else {
      throw new Error(response.error || '註冊失敗')
    }
  },
  
  logout: async () => {
    try {
      const { logout } = await import('../lib/api')
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      set({ user: null, isAuthenticated: false, token: null })
    }
  },
}))

// 初始化時檢查認證狀態
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth()
}

