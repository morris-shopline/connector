import { useMemo } from 'react'
import { useConnectionStore } from '../stores/useConnectionStore'
import { useConnections } from './useConnections'

/**
 * Hook to get the currently selected connection from useConnectionStore
 * This bridges the gap between useConnectionStore (which stores connectionId)
 * and pages that need connection details (like handle/externalAccountId)
 */
export function useSelectedConnection() {
  const { connections: storeConnections, selectedConnectionId } = useConnectionStore()
  const { connections: apiConnections } = useConnections()

  // Use store connections if available, otherwise fall back to API connections
  const connections = storeConnections.length > 0 ? storeConnections : apiConnections

  const selectedConnection = useMemo(() => {
    if (!selectedConnectionId) {
      return null
    }
    return connections.find((c) => c.id === selectedConnectionId) || null
  }, [connections, selectedConnectionId])

  // Get handle (externalAccountId) from selected connection
  const handle = useMemo(() => {
    if (!selectedConnection) {
      return null
    }
    return selectedConnection.externalAccountId || null
  }, [selectedConnection])

  // Get connection item ID (use first item if available)
  const connectionItemId = useMemo(() => {
    if (!selectedConnection || selectedConnection.connectionItems.length === 0) {
      return null
    }
    return selectedConnection.connectionItems[0].id || null
  }, [selectedConnection])

  return {
    selectedConnection,
    handle,
    connectionItemId,
    connectionId: selectedConnectionId,
  }
}

