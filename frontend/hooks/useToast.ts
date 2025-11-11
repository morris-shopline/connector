import { useState, useCallback, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

let toastIdCounter = 0
const toastListeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export const toast = {
  success: (message: string, duration = 3000) => {
    const id = `toast-${toastIdCounter++}`
    toasts = [...toasts, { id, type: 'success', message, duration }]
    notifyListeners()
    
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    }, duration)
  },
  
  error: (message: string, duration = 5000) => {
    const id = `toast-${toastIdCounter++}`
    toasts = [...toasts, { id, type: 'error', message, duration }]
    notifyListeners()
    
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    }, duration)
  },
  
  info: (message: string, duration = 3000) => {
    const id = `toast-${toastIdCounter++}`
    toasts = [...toasts, { id, type: 'info', message, duration }]
    notifyListeners()
    
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    }, duration)
  },
  
  warning: (message: string, duration = 4000) => {
    const id = `toast-${toastIdCounter++}`
    toasts = [...toasts, { id, type: 'warning', message, duration }]
    notifyListeners()
    
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
      notifyListeners()
    }, duration)
  },
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts)
    }
    toastListeners.add(listener)
    setCurrentToasts([...toasts])
    
    return () => {
      toastListeners.delete(listener)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }, [])

  return {
    toasts: currentToasts,
    removeToast,
  }
}

