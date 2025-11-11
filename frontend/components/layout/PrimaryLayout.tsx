import { ReactNode } from 'react'
import { Header } from '../Header'
import { PrimaryNav } from './PrimaryNav'
import { ContextBar } from '../context/ContextBar'
import { ActivityDock } from '../activity/ActivityDock'

interface PrimaryLayoutProps {
  children: ReactNode
}

/**
 * PrimaryLayout - 統一的頁面布局
 * 
 * 包含：
 * - Global Header（頂部）
 * - Primary Nav（左側圖標導覽）
 * - Context Bar（頂部上下文資訊）
 * - Workspace Canvas（主要內容區域）
 * - Activity Dock（底部活動記錄）
 */
export function PrimaryLayout({ children }: PrimaryLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      {/* Content with Header offset */}
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Primary Nav */}
        <PrimaryNav />

        {/* Workspace Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Context Bar - positioned after Primary Nav (64px) */}
          <div className="fixed top-16 left-16 right-0 z-40">
            <ContextBar />
          </div>

          {/* Main Content with Context Bar offset (48px for Context Bar height) */}
          <div className="flex-1 overflow-y-auto pt-12">
            {children}
          </div>

          {/* Activity Dock */}
          <ActivityDock />
        </div>
      </div>
    </div>
  )
}

