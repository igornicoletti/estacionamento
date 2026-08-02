import * as React from "react"

import { useAuth } from "@/features/auth"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { getSecurityPosture } from "../services/security-posture-service"
import {
  getCurrentSecuritySession,
  getLocalSecuritySessionSummary,
} from "../services/security-session-service"
import type { SecuritySnapshot } from "../types/security-types"

const emptyPosture = {
  currentLevel: "aal1",
  currentSessionTrusted: false,
  mfaConfigured: false,
  recentLoginsReviewed: false,
  sessions: [],
  trustedDevicesConfigured: false,
} as const

export function useSecurity(): SecuritySnapshot {
  const auth = useAuth()
  const [session, setSession] = React.useState(getLocalSecuritySessionSummary)
  const loadPosture = React.useCallback(
    () => auth.isAuthenticated
      ? getSecurityPosture()
      : Promise.resolve({ ...emptyPosture, sessions: [] }),
    [auth.isAuthenticated]
  )
  const postureSnapshot = useAsyncSnapshot({
    cacheKey: auth.profile?.authUserId
      ? `security:posture:${auth.profile.authUserId}`
      : undefined,
    errorMessage: "Não foi possível carregar as configurações de segurança.",
    initialData: { ...emptyPosture, sessions: [] },
    loadData: loadPosture,
  })

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
      account: {
        email: auth.profile?.email ?? null,
        phoneMasked: auth.profile?.phoneMasked ?? null,
        status: auth.profile?.status ?? "inactive",
      },
      isAuthenticated: auth.isAuthenticated,
      passkeyStatus: auth.profile?.passkeyStatus ?? "inactive",
      permissions: auth.access.permissions,
      posture: postureSnapshot.data,
      session,
    }),
    [
      auth.access.permissions,
      auth.isAuthenticated,
      auth.profile?.email,
      auth.profile?.passkeyStatus,
      auth.profile?.phoneMasked,
      auth.profile?.status,
      postureSnapshot.data,
      session,
    ]
  )

  return {
    isLoading: auth.isLoading,
    error: auth.error,
    profile: auth.profile,
    security,
    isPostureLoading: postureSnapshot.isLoading,
    postureError: postureSnapshot.error,
    refreshSecurity: postureSnapshot.refetch,
    refreshProfile: auth.actions.refreshProfile,
    registerPasskey: auth.actions.registerProfilePasskey,
    logout: auth.actions.logoutAsync,
  }
}
