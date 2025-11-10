import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getAuthorizeUrl } from '../lib/api'
import { useConnections } from './useConnections'

export function useReauthorizeConnection() {
  const [isReauthorizing, setIsReauthorizing] = useState(false)
  const router = useRouter()
  const { mutate: refetchConnections } = useConnections()

  const reauthorize = useCallback(
    async (handle: string) => {
      if (isReauthorizing) {
        return
      }

      setIsReauthorizing(true)

      try {
        // 取得授權 URL
        const response = await getAuthorizeUrl(handle)

        if (response.success && response.authUrl) {
          // 儲存當前頁面路徑，以便授權完成後返回
          const currentPath = router.asPath
          sessionStorage.setItem('reauthorize_return_path', currentPath)
          sessionStorage.setItem('reauthorize_handle', handle)

          // 跳轉到授權 URL
          window.location.href = response.authUrl
        } else {
          throw new Error(response.error || '取得授權 URL 失敗')
        }
      } catch (error) {
        console.error('重新授權失敗:', error)
        setIsReauthorizing(false)
        throw error
      }
    },
    [isReauthorizing, router]
  )

  return {
    reauthorize,
    isReauthorizing,
  }
}

