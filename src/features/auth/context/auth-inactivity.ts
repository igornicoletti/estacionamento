import * as React from "react"

import { AUTH_INACTIVITY, canAccessProtectedApp } from "../contracts"
import type { AuthProfile } from "../types"
import type { AuthInactivityState } from "./auth-context"
import {
  clearAuthInactivitySessionExpired,
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
} from "./auth-inactivity-storage"

function now() {
  return Date.now()
}

export function useAuthInactivity({
  isAuthenticated,
  onExpired,
  profile,
}: {
  isAuthenticated: boolean
  onExpired: () => void
  profile: AuthProfile | null
}) {
  const [isWarningOpen, setIsWarningOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.ceil(AUTH_INACTIVITY.warningMs / 1000)
  )
  const lastActivityAtRef = React.useRef(now())
  const trackedAuthUserIdRef = React.useRef<string | null>(null)
  const canTrackInactivity = isAuthenticated && canAccessProtectedApp(profile?.status)

  const resetState = React.useCallback(() => {
    clearAuthInactivitySessionExpired()
    lastActivityAtRef.current = now()
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(AUTH_INACTIVITY.warningMs / 1000))
  }, [])

  const resetForProfile = React.useCallback(
    (nextProfile: AuthProfile | null) => {
      const nextAuthUserId =
        nextProfile && canAccessProtectedApp(nextProfile.status)
          ? nextProfile.authUserId
          : null

      if (nextAuthUserId && trackedAuthUserIdRef.current !== nextAuthUserId) {
        resetState()
      }

      trackedAuthUserIdRef.current = nextAuthUserId
    },
    [resetState]
  )

  const clearTracking = React.useCallback(() => {
    trackedAuthUserIdRef.current = null
    setIsWarningOpen(false)
  }, [])

  React.useEffect(() => {
    if (!canTrackInactivity) {
      return
    }

    const events: readonly (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "scroll",
      "touchstart",
    ]

    function handleActivity() {
      if (!isWarningOpen) {
        lastActivityAtRef.current = now()
      }
    }

    for (const event of events) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleActivity)
      }
    }
  }, [canTrackInactivity, isWarningOpen])

  React.useEffect(() => {
    if (!canTrackInactivity) {
      return
    }

    const timer = window.setInterval(() => {
      const elapsed = now() - lastActivityAtRef.current
      const remainingMs = AUTH_INACTIVITY.timeoutMs - elapsed

      if (remainingMs <= 0) {
        markAuthInactivitySessionExpired()
        setIsWarningOpen(false)
        onExpired()
        return
      }

      if (remainingMs <= AUTH_INACTIVITY.warningMs) {
        setIsWarningOpen(true)
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)))
      }
    }, AUTH_INACTIVITY.tickMs)

    return () => window.clearInterval(timer)
  }, [canTrackInactivity, onExpired])

  const state = React.useMemo<AuthInactivityState>(
    () => ({
      isWarningOpen: canTrackInactivity && isWarningOpen,
      secondsRemaining,
      continueSession: resetState,
      markExpired: markAuthInactivitySessionExpired,
      consumeExpired: consumeAuthInactivitySessionExpired,
    }),
    [canTrackInactivity, isWarningOpen, resetState, secondsRemaining]
  )

  return {
    clearTracking,
    resetForProfile,
    state,
  }
}
