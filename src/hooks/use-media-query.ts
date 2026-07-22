"use client"

import * as React from "react"

export function useMediaQuery(query: string, defaultValue = false) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => undefined
      }

      const mediaQueryList = window.matchMedia(query)

      mediaQueryList.addEventListener("change", callback)

      return () => {
        mediaQueryList.removeEventListener("change", callback)
      }
    },
    [query]
  )

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return defaultValue
    }

    return window.matchMedia(query).matches
  }, [defaultValue, query])

  const getServerSnapshot = React.useCallback(() => {
    return defaultValue
  }, [defaultValue])

  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}
