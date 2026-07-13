import * as React from "react"

import { useAuth } from "@/features/auth"

import type { SettingsSnapshot } from "../types/settings-types"
import { mapAuthProfileToSettingsProfile } from "../utils/settings-models"

export function useSettings(): SettingsSnapshot {
  const auth = useAuth()

  const profile = React.useMemo(
    () => (auth.profile ? mapAuthProfileToSettingsProfile(auth.profile) : null),
    [auth.profile]
  )

  const security = React.useMemo(
    () => ({
      isAuthenticated: auth.isAuthenticated,
      passkeyStatus: auth.profile?.passkeyStatus ?? "inactive",
      permissions: auth.access.permissions,
    }),
    [auth.access.permissions, auth.isAuthenticated, auth.profile?.passkeyStatus]
  )

  return {
    isLoading: auth.isLoading,
    error: auth.error,
    profile,
    security,
    refreshProfile: auth.actions.refreshProfile,
  }
}
