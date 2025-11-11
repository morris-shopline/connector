import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { useConnection } from '../hooks/useConnection'
import { useSWRConfig } from 'swr'

type NavItem = {
  label: string
  href: string
  active?: boolean
}

export function Header() {
  const router = useRouter()
  const currentPath = router.pathname
  const [currentHash, setCurrentHash] = useState('')
  const { user, isAuthenticated, logout } = useAuthStore()
  const { resetConnection } = useConnection()
  const { mutate } = useSWRConfig()

  // 監聽 hash 變化
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash)
    }
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  // 簡化 Header：移除重複的導覽項目（已在 Primary Nav）
  // 只保留必要的導覽項目（如果需要）
  const navItems: NavItem[] = []

  // 判斷是否為當前頁面
  const isActive = (href: string) => {
    if (href === '/connections') {
      return currentPath === '/connections'
    }
    if (href === '/#events') {
      return currentPath === '/' && currentHash === '#events'
    }
    return currentPath === href
  }

  // 取得頁面標題
  const getPageTitle = () => {
    switch (currentPath) {
      case '/connections':
        return 'Connection 管理'
      case '/webhook-test':
        return 'Webhook 管理'
      case '/admin-api-test':
        return 'Admin API 測試'
      default:
        return 'Shopline API 整合儀表板'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
          <nav className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user.name || user.email}
                </span>
                <button
                  onClick={async () => {
                    // 1. 清除所有 SWR 快取（避免顯示舊帳號的資料）
                    mutate(() => true, undefined, { revalidate: false })
                    
                    // 2. 清除 Connection 狀態（R1.1）
                    resetConnection()
                    
                    // 3. 清除 URL query 參數
                    if (router.query.platform || router.query.connectionId || router.query.connectionItemId) {
                      router.replace('/', undefined, { shallow: true })
                    }
                    
                    // 4. 執行登出
                    await logout()
                    
                    // 5. 導向登入頁
                    router.push('/login')
                  }}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  登出
                </button>
              </div>
            )}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                登入
              </Link>
            )}
            {/* 移除重複的導覽項目，已在 Primary Nav 顯示 */}
            {false && navItems.map((item) => {
              const active = isActive(item.href)
              // 處理 hash 路由的特殊情況
              if (item.href === '/#events') {
                return (
                  <Link
                    key={item.href}
                    href={{ pathname: '/', hash: 'events' }}
                    scroll={false}
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPath === '/') {
                        window.location.hash = '#events'
                      } else {
                        router.push('/#events')
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

