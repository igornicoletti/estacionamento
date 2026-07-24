import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const mediaQuery = React.useMemo(
    () => `(max-width: ${breakpoint - 1}px)`,
    [breakpoint]
  )

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.matchMedia(mediaQuery).matches
  }, [mediaQuery])

  const subscribe = React.useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined") {
        return () => {}
      }

      const currentMediaQuery = window.matchMedia(mediaQuery)

      currentMediaQuery.addEventListener("change", callback)

      return () => {
        currentMediaQuery.removeEventListener("change", callback)
      }
    },
    [mediaQuery]
  )

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
