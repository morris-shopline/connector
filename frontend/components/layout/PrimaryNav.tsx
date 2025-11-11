import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  color: string
}

const navItems: NavItem[] = [
  {
    label: 'Connections',
    href: '/connections',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: 'blue',
  },
  {
    label: 'Webhook 事件',
    href: '/events',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    color: 'purple',
  },
  {
    label: 'Webhook 管理',
    href: '/webhook-test',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'green',
  },
  {
    label: 'Admin API 測試',
    href: '/admin-api-test',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    color: 'orange',
  },
]

export function PrimaryNav() {
  const router = useRouter()
  const [currentHash, setCurrentHash] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHash(window.location.hash)
      const handleHashChange = () => {
        setCurrentHash(window.location.hash)
      }
      window.addEventListener('hashchange', handleHashChange)
      return () => window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const isActive = (href: string) => {
    return router.pathname === href
  }

  const getColorClasses = (color: string, active: boolean) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      blue: {
        bg: active ? 'bg-blue-50' : 'hover:bg-blue-50',
        text: active ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600',
        border: active ? 'border-blue-600' : 'border-transparent',
      },
      purple: {
        bg: active ? 'bg-purple-50' : 'hover:bg-purple-50',
        text: active ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600',
        border: active ? 'border-purple-600' : 'border-transparent',
      },
      green: {
        bg: active ? 'bg-green-50' : 'hover:bg-green-50',
        text: active ? 'text-green-600' : 'text-gray-600 hover:text-green-600',
        border: active ? 'border-green-600' : 'border-transparent',
      },
      orange: {
        bg: active ? 'bg-orange-50' : 'hover:bg-orange-50',
        text: active ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600',
        border: active ? 'border-orange-600' : 'border-transparent',
      },
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <nav className="w-16 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const colors = getColorClasses(item.color, active)
            const isHovered = hoveredItem === item.href

            return (
              <li key={item.href} className="relative">
                <Link
                  href={item.href}
                  className={`flex items-center justify-center px-3 py-3 rounded-md transition-colors border-l-2 ${colors.bg} ${colors.text} ${colors.border}`}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={item.label}
                >
                  {item.icon}
                </Link>
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      {item.label}
                    </div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
                      <div className="border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

