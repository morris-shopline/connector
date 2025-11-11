import { useState, useEffect } from 'react'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { Header } from '../../components/Header'
import { PrimaryNav } from '../../components/layout/PrimaryNav'
import { ContextBar } from '../../components/context/ContextBar'
import { ActivityDock } from '../../components/activity/ActivityDock'
import { ConnectionRail } from '../../components/connections/ConnectionRail'
import { ConnectionSummaryCard } from '../../components/connections/ConnectionSummaryCard'
import { ConnectionItemsPreview } from '../../components/connections/ConnectionItemsPreview'
import { ConnectionItemsTable } from '../../components/connections/ConnectionItemsTable'
import { useConnections } from '../../hooks/useConnections'
import { useConnectionStore } from '../../stores/useConnectionStore'

type Tab = 'overview' | 'items' | 'events'

function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { connections: apiConnections, isLoading, mutate } = useConnections()
  const { setConnections } = useConnectionStore()

  // 同步 API 資料到 Store
  useEffect(() => {
    if (apiConnections.length > 0) {
      setConnections(apiConnections)
    }
  }, [apiConnections, setConnections])

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

        {/* Connection Rail */}
        <ConnectionRail />

        {/* Workspace Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Fixed Context Bar - positioned after Primary Nav (64px) + Connection Rail (256px) */}
          <div className="fixed top-16 left-80 right-0 z-40">
            <ContextBar />
          </div>

          {/* Workspace Tabs with Context Bar offset (48px for Context Bar height) */}
          <div className="flex-1 overflow-y-auto pt-12">
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'items'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Connection Items
                  </button>
                  <button
                    onClick={() => setActiveTab('events')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'events'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Events
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">載入中...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <ConnectionSummaryCard />
                      <ConnectionItemsPreview />
                    </div>
                  )}

                  {activeTab === 'items' && (
                    <ConnectionItemsTable />
                  )}

                  {activeTab === 'events' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="text-center text-gray-500">
                        Events Tab（待實作）
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Activity Dock */}
          <ActivityDock />
        </div>
      </div>
    </div>
  )
}

export default function ConnectionsPageWrapper() {
  return (
    <ProtectedRoute>
      <ConnectionsPage />
    </ProtectedRoute>
  )
}

