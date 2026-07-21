import * as React from "react"

import { useAuth } from "@/features/auth"

import {
  updateCurrentProfile,
  uploadProfileAvatarFile,
} from "../services"
import type { MyProfileSnapshot } from "../types/profile-types"
import { mapAuthProfileToProfileSummary } from "../utils/profile-models"

export function useMyProfile(): MyProfileSnapshot {
  const auth = useAuth()

  const profile = React.useMemo(
    () => (auth.profile ? mapAuthProfileToProfileSummary(auth.profile) : null),
    [auth.profile]
  )

  return {
    isLoading: auth.isLoading,
    error: auth.error,
    profile,
    refreshProfile: auth.actions.refreshProfile,
    saveProfile: async (input) => {
      const savedProfile = await updateCurrentProfile(input)

      const avatarUrl = savedProfile.avatarPath?.startsWith("data:image/")
        ? savedProfile.avatarPath
        : savedProfile.avatarPath?.startsWith("https://")
          ? savedProfile.avatarPath
          : input.avatarPreviewUrl ?? undefined

      auth.actions.applyProfilePatch({
        avatarPath: savedProfile.avatarPath,
        ...(avatarUrl ? { avatarUrl } : {}),
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
