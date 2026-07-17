import * as React from "react"

import { useAuth } from "@/features/auth"

import {
  updateCurrentProfile,
  uploadProfileAvatarFile,
} from "../services/settings-profile-service"
import {
  getCurrentSettingsSession,
  getLocalSettingsSessionSummary,
} from "../services/settings-session-service"
import type { SettingsSnapshot } from "../types/settings-types"
import { mapAuthProfileToSettingsProfile } from "../utils/settings-models"

export function useSettings(): SettingsSnapshot {
  const auth = useAuth()
  const [session, setSession] = React.useState(getLocalSettingsSessionSummary)

  React.useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const nextSession = await getCurrentSettingsSession()

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

  const profile = React.useMemo(
    () => (auth.profile ? mapAuthProfileToSettingsProfile(auth.profile) : null),
    [auth.profile]
  )

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
    profile,
    security,
    refreshProfile: auth.actions.refreshProfile,
    registerPasskey: auth.actions.registerProfilePasskey,
    saveProfile: async (input) => {
      const savedProfile = await updateCurrentProfile(input)

      auth.actions.applyProfilePatch({
        avatarPath:
          savedProfile.avatarUrl &&
          !/^(https?:|data:image\/)/i.test(savedProfile.avatarUrl)
            ? savedProfile.avatarUrl
            : null,
        avatarUrl: savedProfile.avatarUrl,
        email: savedProfile.email,
        name: savedProfile.name,
        ...(savedProfile.requiresPasskeyRegistration
          ? { passkeyStatus: "inactive" as const }
          : {}),
        ...(savedProfile.phoneMasked ? { phoneMasked: savedProfile.phoneMasked } : {}),
      })
      await auth.actions.refreshProfile()
    },
    uploadAvatarFile: async (file) => {
      if (!auth.profile?.authUserId) {
        throw new Error("Sessão indisponível para enviar a foto.")
      }

      return uploadProfileAvatarFile(file, auth.profile.authUserId)
    },
  }
}
