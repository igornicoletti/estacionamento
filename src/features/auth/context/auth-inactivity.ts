import * as React from "react"

import {
  AUTH_SESSION_LEASE_STATUS,
  touchCurrentAuthSession,
} from "../api"
import { AUTH_INACTIVITY, AUTH_STORAGE_KEYS } from "../contracts"
import type { AuthProfile } from "../types"
import {
  clearAuthInactivitySessionExpired,
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
  publishAuthActivity,
  readPublishedAuthActivity,
} from "./auth-inactivity-storage"

const ACTIVITY_EVENTS = ["click", "keydown", "scroll", "touchstart"] as const

interface LeaseDeadlineInput {
  absoluteExpiresAt: string | null
  enforcementEnabled: boolean
  idleExpiresAt: string | null
  serverTime: string
}

export function resolveAuthSessionLeaseDeadline(
  lease: LeaseDeadlineInput,
  now = Date.now()
) {
  if (!lease.enforcementEnabled) {
    return null
  }

  const serverTime = Date.parse(lease.serverTime)
  const expirations = [lease.absoluteExpiresAt, lease.idleExpiresAt]
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((value): value is number => Number.isFinite(value))

  if (!Number.isFinite(serverTime) || expirations.length === 0) {
    return null
  }

  return now + Math.max(0, Math.min(...expirations) - serverTime)
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
  const canTrack = isAuthenticated && Boolean(profile)
  const [isWarningOpen, setIsWarningOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(0)
  const serverDeadlineAtRef = React.useRef<number | null>(null)
  const lastActivityAtRef = React.useRef(Date.now())
  const lastBroadcastAtRef = React.useRef(0)
  const pendingActivityRef = React.useRef(false)
  const synchronizingRef = React.useRef(false)
  const expiredRef = React.useRef(false)
  const trackingEnabledRef = React.useRef(false)
  const trackedAuthUserIdRef = React.useRef<string | null>(null)

  const expire = React.useCallback(() => {
    if (expiredRef.current) {
      return
    }

    expiredRef.current = true
    markAuthInactivitySessionExpired()
    setIsWarningOpen(false)
    setSecondsRemaining(0)
    onExpired()
  }, [onExpired])

  const synchronize = React.useCallback(
    async (force: boolean) => {
      if (!trackingEnabledRef.current || synchronizingRef.current) {
        return
      }

      if (!force && !pendingActivityRef.current) {
        return
      }

      synchronizingRef.current = true
      const activityObserved = pendingActivityRef.current

      try {
        const lease = await touchCurrentAuthSession({ activityObserved })

        if (lease.status !== AUTH_SESSION_LEASE_STATUS.active) {
          expire()
          return
        }

        pendingActivityRef.current = false
        serverDeadlineAtRef.current = resolveAuthSessionLeaseDeadline(lease)
        expiredRef.current = false
        clearAuthInactivitySessionExpired()

        if (activityObserved) {
          setIsWarningOpen(false)
        }
      } catch {
        pendingActivityRef.current = activityObserved
      } finally {
        synchronizingRef.current = false
      }
    },
    [expire]
  )

  const registerActivity = React.useCallback(
    (at = Date.now(), broadcast = true) => {
      if (!trackingEnabledRef.current || expiredRef.current) {
        return
      }

      lastActivityAtRef.current = Math.max(lastActivityAtRef.current, at)
      pendingActivityRef.current = true
      setIsWarningOpen(false)

      if (
        broadcast &&
        at - lastBroadcastAtRef.current >=
          AUTH_INACTIVITY.activityBroadcastThrottleMs
      ) {
        lastBroadcastAtRef.current = at
        publishAuthActivity(at)
      }
    },
    []
  )

  const clearTracking = React.useCallback(() => {
    trackingEnabledRef.current = false
    trackedAuthUserIdRef.current = null
    serverDeadlineAtRef.current = null
    pendingActivityRef.current = false
    synchronizingRef.current = false
    expiredRef.current = false
    setIsWarningOpen(false)
    setSecondsRemaining(0)
  }, [])

  const resetForProfile = React.useCallback(
    (nextProfile: AuthProfile | null) => {
      const nextAuthUserId = nextProfile?.authUserId ?? null

      trackingEnabledRef.current = Boolean(nextProfile)

      if (!nextAuthUserId) {
        clearTracking()
        return
      }

      if (trackedAuthUserIdRef.current === nextAuthUserId) {
        return
      }

      const now = Date.now()

      trackedAuthUserIdRef.current = nextAuthUserId
      lastActivityAtRef.current = now
      serverDeadlineAtRef.current = null
      pendingActivityRef.current = true
      expiredRef.current = false
      setIsWarningOpen(false)
      setSecondsRemaining(0)
      publishAuthActivity(now)
      void synchronize(true)
    },
    [clearTracking, synchronize]
  )

  React.useEffect(() => {
    trackingEnabledRef.current = canTrack
  }, [canTrack])

  React.useEffect(() => {
    if (!canTrack) {
      return
    }

    const handleActivity = () => registerActivity()
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEYS.activityAt || !event.newValue) {
        return
      }

      const timestamp = Number(event.newValue)

      if (Number.isFinite(timestamp)) {
        registerActivity(timestamp, false)
      }
    }
    const handleFocus = () => {
      const publishedAt = readPublishedAuthActivity()

      if (publishedAt !== null) {
        registerActivity(publishedAt, false)
      }

      void synchronize(true)
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handleActivity, { passive: true })
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("storage", handleStorage)

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handleActivity)
      }

      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("storage", handleStorage)
    }
  }, [canTrack, registerActivity, synchronize])

  React.useEffect(() => {
    if (!canTrack) {
      return
    }

    const heartbeat = window.setInterval(() => {
      void synchronize(true)
    }, AUTH_INACTIVITY.heartbeatMs)

    const ticker = window.setInterval(() => {
      const localDeadline = lastActivityAtRef.current + AUTH_INACTIVITY.timeoutMs
      const deadline = Math.min(
        serverDeadlineAtRef.current ?? localDeadline,
        localDeadline
      )
      const remainingMs = deadline - Date.now()

      if (remainingMs <= 0) {
        expire()
        return
      }

      setSecondsRemaining(Math.ceil(remainingMs / 1000))
      setIsWarningOpen(remainingMs <= AUTH_INACTIVITY.warningMs)
    }, AUTH_INACTIVITY.tickMs)

    return () => {
      window.clearInterval(heartbeat)
      window.clearInterval(ticker)
    }
  }, [canTrack, expire, synchronize])

  return {
    clearTracking,
    resetForProfile,
    state: {
      isWarningOpen,
      secondsRemaining,
      continueSession: () => {
        registerActivity()
        void synchronize(true)
      },
      markExpired: expire,
      consumeExpired: consumeAuthInactivitySessionExpired,
    },
  }
}
