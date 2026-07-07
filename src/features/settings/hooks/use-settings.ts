import * as React from "react"

import {
  getAuthErrorMessage,
  requestProfilePhoneChange,
  useAuthSession,
} from "@/features/auth"

import { type SettingsProfile } from "../types/settings-types"

const saveError = "Não foi possível enviar a solicitação."
const enableMfaError = "Não foi possível habilitar a autenticação multifator."
const enableMfaMissingPhoneError = "Cadastre um telefone antes de habilitar a autenticação multifator."

export function useSettings() {
  const {
    profile: sessionProfile,
    isLoading,
    refresh: refreshSession,
  } = useAuthSession()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isEnablingMfa, setIsEnablingMfa] = React.useState(false)

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

  const enableMfa = React.useCallback(async () => {
    if (!sessionProfile?.phoneMasked) {
      throw new Error(enableMfaMissingPhoneError)
    }

    setIsEnablingMfa(true)

    try {
      await requestProfilePhoneChange({ phone: sessionProfile.phoneMasked })
      await refreshSession()
    } catch (caughtError) {
      throw new Error(getAuthErrorMessage(caughtError, enableMfaError), {
        cause: caughtError,
      })
    } finally {
      setIsEnablingMfa(false)
    }
  }, [refreshSession, sessionProfile])

  return {
    isLoading,
    isSaving,
    isEnablingMfa,
    mfaStatus: sessionProfile?.mfaStatus ?? "inactive",
    profile,
    saveProfile,
    enableMfa,
  }
}
