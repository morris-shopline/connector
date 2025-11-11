import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuthStore } from '../stores/useAuthStore'

function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/connections')
      } else {
        router.replace('/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  // 顯示 loading 狀態，避免閃爍
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default Home
