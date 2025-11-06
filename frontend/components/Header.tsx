import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/useAuthStore'

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

  // 監聽 hash 變化
  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash)
    }
    updateHash()
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  // 定義導航項目
  const navItems: NavItem[] = [
    { label: '商店列表', href: '/' },
    { label: 'Webhook 事件', href: '/#events' },
    { label: 'Webhook 管理', href: '/webhook-test' },
    { label: 'Admin API 測試', href: '/admin-api-test' }
  ]

  // 判斷是否為當前頁面
  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/' && (!currentHash || currentHash === '')
    }
    if (href === '/#events') {
      return currentPath === '/' && currentHash === '#events'
    }
    return currentPath === href
  }

  // 取得頁面標題
  const getPageTitle = () => {
    switch (currentPath) {
      case '/':
        return 'Shopline API 整合儀表板'
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
                    await logout()
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
            {navItems.map((item) => {
              const active = isActive(item.href)
              // 處理 hash 路由的特殊情況
              if (item.href === '/#events') {
                return (
                  <a
                    key={item.href}
                    href="/#events"
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
                  </a>
                )
              }
              // 處理「商店列表」連結，當有 hash 時需要清除
              if (item.href === '/' && currentPath === '/' && currentHash) {
                return (
                  <a
                    key={item.href}
                    href="/"
                    onClick={(e) => {
                      e.preventDefault()
                      // 清除 hash，這會自動觸發 hashchange 事件
                      if (window.history.replaceState) {
                        window.history.replaceState(null, '', '/')
                      } else {
                        window.location.hash = ''
                      }
                      // 手動觸發 hashchange 以確保狀態同步
                      setCurrentHash('')
                      window.dispatchEvent(new Event('hashchange'))
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </a>
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

