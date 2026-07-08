import * as React from "react"

import {
  getAuthErrorMessage,
  registerPasskey,
  requestProfilePhoneChange,
  useAuthSession,
} from "@/features/auth"

import { type SettingsProfile } from "../types/settings-types"

const saveError = "Não foi possível enviar a solicitação."
const registerPasskeyError = "Não foi possível cadastrar a passkey."

export function useSettings() {
  const {
    profile: sessionProfile,
    isLoading,
    refresh: refreshSession,
  } = useAuthSession()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRegisteringPasskey, setIsRegisteringPasskey] = React.useState(false)

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

  const registerCurrentPasskey = React.useCallback(async () => {
    setIsRegisteringPasskey(true)

    try {
      await registerPasskey()
      await refreshSession()
    } catch (caughtError) {
      throw new Error(getAuthErrorMessage(caughtError, registerPasskeyError), {
        cause: caughtError,
      })
    } finally {
      setIsRegisteringPasskey(false)
    }
  }, [refreshSession])

  return {
    isLoading,
    isSaving,
    isRegisteringPasskey,
    passkeyStatus: sessionProfile?.passkeyStatus ?? "inactive",
    profile,
    saveProfile,
    registerPasskey: registerCurrentPasskey,
  }
}
