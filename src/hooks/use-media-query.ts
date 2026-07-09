"use client"

import * as React from "react"

export function useMediaQuery(query: string, defaultValue = false) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mediaQueryList = window.matchMedia(query)

      mediaQueryList.addEventListener("change", callback)

      return () => {
        mediaQueryList.removeEventListener("change", callback)
      }
    },
    [query]
  )

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = React.useCallback(() => {
    return defaultValue
  }, [defaultValue])

  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}
