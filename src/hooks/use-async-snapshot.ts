import * as React from "react"

import { toError } from "@/lib/errors"

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 50

interface CacheEntry {
  data: unknown
  timestamp: number
}

const asyncSnapshotCache = new Map<string, CacheEntry>()

export function clearAsyncSnapshotCache() {
  asyncSnapshotCache.clear()
}

function getCachedData<TData>(key: string): TData | undefined {
  const entry = asyncSnapshotCache.get(key)

  if (!entry) {
    return undefined
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    asyncSnapshotCache.delete(key)
    return undefined
  }

  return entry.data as TData
}

function setCachedData(key: string, data: unknown) {
  if (asyncSnapshotCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = asyncSnapshotCache.keys().next().value

    if (oldestKey !== undefined) {
      asyncSnapshotCache.delete(oldestKey)
    }
  }

  asyncSnapshotCache.set(key, { data, timestamp: Date.now() })
}

function hasCachedEntry(key: string) {
  return getCachedData(key) !== undefined
}

interface UseAsyncSnapshotOptions<TData> {
  initialData: TData
  loadData: () => Promise<TData>
  errorMessage: string
  cacheKey?: string
}

export function useAsyncSnapshot<TData>({
  initialData,
  loadData,
  errorMessage,
  cacheKey,
}: UseAsyncSnapshotOptions<TData>) {
  const hasCachedData = cacheKey ? hasCachedEntry(cacheKey) : false

  const [dataState, setDataState] = React.useState<TData>(() => {
    if (cacheKey) {
      const cached = getCachedData<TData>(cacheKey)

      if (cached !== undefined) {
        return cached
      }
    }

    return initialData
  })
  const [isLoading, setIsLoading] = React.useState(!hasCachedData)
  const [error, setError] = React.useState<Error | null>(null)
  const requestVersionRef = React.useRef(0)
  const loadDataRef = React.useRef(loadData)

  React.useEffect(() => {
    loadDataRef.current = loadData
  })

  const setData = React.useCallback<React.Dispatch<React.SetStateAction<TData>>>(
    (value) => {
      setDataState((current) => {
        const nextValue = value instanceof Function ? value(current) : value

        if (cacheKey) {
          setCachedData(cacheKey, nextValue)
        }

        return nextValue
      })
    },
    [cacheKey]
  )

  const loadSnapshot = React.useCallback(async (
    isCurrent: () => boolean,
    options: { setLoading?: boolean } = {}
  ) => {
    const shouldSetLoading = options.setLoading ?? true
    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion
    const shouldApplyResult = () =>
      isCurrent() && requestVersionRef.current === requestVersion

    try {
      if (shouldSetLoading) {
        setIsLoading(true)
      }

      setError(null)
      const snapshot = await loadDataRef.current()

      if (shouldApplyResult()) {
        setData(snapshot)
      }
    } catch (caughtError) {
      if (shouldApplyResult()) {
        setError(toError(caughtError, errorMessage))
      }
    } finally {
      if (shouldApplyResult()) {
        setIsLoading(false)
      }
    }
  }, [errorMessage, setData])

  const refetch = React.useCallback(() => {
    return loadSnapshot(() => true, { setLoading: true })
  }, [loadSnapshot])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialSnapshot() {
      await loadSnapshot(() => isMounted, { setLoading: false })
    }

    void loadInitialSnapshot()

    return () => {
      isMounted = false
    }
  }, [cacheKey, loadSnapshot])

  return {
    data: dataState,
    setData,
    error,
    setError,
    isLoading,
    setIsLoading,
    loadSnapshot,
    refetch,
  }
}
