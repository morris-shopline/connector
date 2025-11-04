import { useState } from 'react'
import { apiClient } from '../lib/api'

export function useHealthCheck() {
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [healthData, setHealthData] = useState<any>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsChecking(true)
    setStatus('idle')
    setMessage('')
    setHealthData(null)

    const startTime = Date.now()

    try {
      const result = await apiClient.healthCheck()
      
      const responseTime = Date.now() - startTime
      
      if (result.success) {
        setStatus('success')
        setHealthData(result.data)
        
        // 構建詳細訊息
        const dbStatus = result.data?.database === 'connected' ? '✓' : '✗'
        const uptime = result.data?.uptime ? `已運行 ${Math.floor(result.data.uptime)} 秒` : ''
        const details = [dbStatus + ' 資料庫', uptime].filter(Boolean).join(' | ')
        
        setMessage(`後端正常 (${result.data?.responseTime || responseTime}ms)${details ? ` | ${details}` : ''}`)
        setLastChecked(new Date())
      } else {
        setStatus('error')
        setHealthData(result.data)
        setMessage(`後端異常: ${result.data?.error || '未知錯誤'}`)
        setLastChecked(new Date())
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      
      setStatus('error')
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        setMessage(`無法連接後端 (${responseTime}ms) - Render 可能正在冷啟動中，請稍候再試`)
      } else if (error.response?.status === 504 || error.response?.status === 503) {
        setMessage(`後端無回應 (${responseTime}ms) - Render 可能正在冷啟動中，請稍候再試`)
      } else if (error.response?.status === 500) {
        setMessage(`後端錯誤 (${responseTime}ms) - 請檢查後端日誌`)
      } else if (error.response?.status) {
        setMessage(`HTTP ${error.response.status} (${responseTime}ms)`)
      } else {
        setMessage(`連線失敗: ${error.message || '未知錯誤'} (${responseTime}ms)`)
      }
      
      setLastChecked(new Date())
    } finally {
      setIsChecking(false)
    }
  }

  return {
    checkHealth,
    isChecking,
    status,
    message,
    healthData,
    lastChecked
  }
}

