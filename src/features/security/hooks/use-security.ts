import * as React from "react"

import { useAuth } from "@/features/auth"

import {
  getCurrentSecuritySession,
  getLocalSecuritySessionSummary,
} from "../services/security-session-service"
import type { SecuritySnapshot } from "../types/security-types"

export function useSecurity(): SecuritySnapshot {
  const auth = useAuth()
  const [session, setSession] = React.useState(getLocalSecuritySessionSummary)

  React.useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const nextSession = await getCurrentSecuritySession()
      if (!cancelled) {
        setSession(nextSession)
      }
    }

    if (auth.isAuthenticated) {
      void loadSession()
    }

    return () => {
      cancelled = true
    }
  }, [auth.isAuthenticated])

  const security = React.useMemo(
    () => ({
      isAuthenticated: auth.isAuthenticated,
      passkeyStatus: auth.profile?.passkeyStatus ?? "inactive",
      permissions: auth.access.permissions,
      session,
    }),
    [auth.access.permissions, auth.isAuthenticated, auth.profile?.passkeyStatus, session]
  )

  return {
    isLoading: auth.isLoading,
    error: auth.error,
    profile: auth.profile,
    security,
    refreshProfile: auth.actions.refreshProfile,
    registerPasskey: auth.actions.registerProfilePasskey,
  }
}
