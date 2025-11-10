const STORAGE_KEY = 'connection_cache'
const CACHE_VERSION = 'v1'

export interface ConnectionCachePayload {
  version: string
  platform: string | null
  connectionId: string | null
  connectionItemId: string | null
  updatedAt: string
}

const isBrowser = () => typeof window !== 'undefined'

export const loadConnectionCache = (): ConnectionCachePayload | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as ConnectionCachePayload
    if (parsed.version !== CACHE_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to load connection cache', error)
    return null
  }
}

export const saveConnectionCache = ({
  platform,
  connectionId,
  connectionItemId,
}: {
  platform: string | null
  connectionId: string | null
  connectionItemId: string | null
}) => {
  if (!isBrowser()) {
    return
  }

  if (!platform && !connectionId && !connectionItemId) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }

  try {
    const payload: ConnectionCachePayload = {
      version: CACHE_VERSION,
      platform: platform ?? null,
      connectionId: connectionId ?? null,
      connectionItemId: connectionItemId ?? null,
      updatedAt: new Date().toISOString(),
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Failed to save connection cache', error)
  }
}

export const clearConnectionCache = () => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}

