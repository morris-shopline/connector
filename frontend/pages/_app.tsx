import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { useInitConnectionFromURL } from '../hooks/useInitConnectionFromURL'
import { TokenExpiredModal } from '../components/TokenExpiredModal'
import { ToastContainer } from '../components/common/ToastContainer'
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

  // 處理 OAuth 回調：統一導向到 callback 頁面處理
  useEffect(() => {
    if (router.isReady) {
      const urlParams = new URLSearchParams(window.location.search)
      const authSuccess = urlParams.get('auth_success')
      
      // 如果是 OAuth 回調，且不在 callback 頁面，導向到 callback 頁面統一處理
      if (authSuccess && router.pathname !== '/connections/callback') {
        router.replace(`/connections/callback${window.location.search}`)
        return
      }
    }
  }, [router.isReady, router.pathname, router])

  return (
    <>
      <Component {...pageProps} />
      <TokenExpiredModal />
      <ToastContainer />
    </>
  )
}

export default function App(props: AppProps) {
  return <AppContent {...props} />
}
