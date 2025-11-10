import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { useInitConnectionFromURL } from '../hooks/useInitConnectionFromURL'
import { TokenExpiredModal } from '../components/TokenExpiredModal'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useConnections } from '../hooks/useConnections'
import { useTokenErrorStore } from '../stores/useTokenErrorStore'

/**
 * ✅ 正確：URL 初始化放在 Layout 層級（只跑一次）
 * 
 * 這樣頁面切換時不會重新執行初始化，避免 initializedRef 重置造成的循環問題。
 */
function AppContent({ Component, pageProps }: AppProps) {
  // ✅ 只在 app 首次載入時執行一次 URL → Zustand 初始化
  // 頁面切換時不會重新執行，因為這個 hook 在 _app.tsx 層級
  useInitConnectionFromURL()
  const router = useRouter()
  const { mutate: refetchConnections } = useConnections()
  const { clearTokenError } = useTokenErrorStore()

  // 處理 OAuth 回調後的狀態刷新
  useEffect(() => {
    if (router.isReady) {
      const urlParams = new URLSearchParams(window.location.search)
      const authSuccess = urlParams.get('auth_success')
      const returnPath = sessionStorage.getItem('reauthorize_return_path')
      const reauthorizeHandle = sessionStorage.getItem('reauthorize_handle')

      if (authSuccess === 'true' && returnPath) {
        // 清除 sessionStorage
        sessionStorage.removeItem('reauthorize_return_path')
        sessionStorage.removeItem('reauthorize_handle')

        // 清除 Token 錯誤狀態
        clearTokenError()

        // 刷新 Connection 列表
        refetchConnections()

        // 返回原頁面（如果路徑不同）
        if (router.asPath !== returnPath) {
          router.push(returnPath)
        }
      }
    }
  }, [router.isReady, router.asPath, refetchConnections, clearTokenError, router])

  return (
    <>
      <Component {...pageProps} />
      <TokenExpiredModal />
    </>
  )
}

export default function App(props: AppProps) {
  return <AppContent {...props} />
}
