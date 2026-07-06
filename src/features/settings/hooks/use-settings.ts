import * as React from "react"

import {
  getAuthErrorMessage,
  requestProfilePhoneChange,
  useAuthSession,
} from "@/features/auth"

import { type SettingsProfile } from "../types/settings-types"

const saveError = "Não foi possível enviar a solicitação."

export function useSettings() {
  const {
    profile: sessionProfile,
    isLoading,
    refresh: refreshSession,
  } = useAuthSession()
  const [isSaving, setIsSaving] = React.useState(false)

  const profile: SettingsProfile | null = sessionProfile
    ? {
        name: sessionProfile.name,
        cpf: sessionProfile.cpfMasked ?? "",
        phone: sessionProfile.phoneMasked,
        email: sessionProfile.email ?? "",
      }
    : null

  const saveProfile = React.useCallback(
    async (values: SettingsProfile) => {
      setIsSaving(true)

      try {
        if (values.phone !== sessionProfile?.phoneMasked) {
          await requestProfilePhoneChange({ phone: values.phone })
          await refreshSession()
        }
      } catch (caughtError) {
        throw new Error(getAuthErrorMessage(caughtError, saveError), {
          cause: caughtError,
        })
      } finally {
        setIsSaving(false)
      }
    },
    [refreshSession, sessionProfile]
  )

  return {
    isLoading,
    isSaving,
    mfaStatus: sessionProfile?.mfaStatus ?? "inactive",
    profile,
    saveProfile,
  }
}
