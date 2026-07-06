import * as React from "react"

import {
  getAuthErrorMessage,
  requestProfilePhoneChange,
  useAuthSession,
} from "@/features/auth"

import {
  addMfaApp,
  getSidebarBehavior,
  listMfaApps,
  removeMfaApp,
  updateSidebarBehavior,
} from "../services/settings-service"
import {
  type SettingsMfaApp,
  type SettingsProfile,
  type SidebarBehavior,
} from "../types/settings-types"

const loadError = "Não foi possível carregar as configurações."

export function useSettings() {
  const { profile: sessionProfile, refresh: refreshSession } = useAuthSession()
  const [mfaApps, setMfaApps] = React.useState<SettingsMfaApp[]>([])
  const [sidebarBehavior, setSidebarBehavior] =
    React.useState<SidebarBehavior>("expanded")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const profile: SettingsProfile | null = sessionProfile
    ? {
        name: sessionProfile.name,
        phone: sessionProfile.phoneMasked,
        email: sessionProfile.email ?? "",
      }
    : null

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [fetchedApps, fetchedBehavior] = await Promise.all([
          listMfaApps(),
          getSidebarBehavior(),
        ])

        if (isMounted) {
          setMfaApps(fetchedApps)
          setSidebarBehavior(fetchedBehavior)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(loadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const saveProfile = React.useCallback(
    async (values: SettingsProfile) => {
      setIsSaving(true)

      try {
        if (values.phone !== sessionProfile?.phoneMasked) {
          await requestProfilePhoneChange({ phone: values.phone })
          await refreshSession()
        }
      } catch (caughtError) {
        throw new Error(
          getAuthErrorMessage(caughtError, loadError),
          { cause: caughtError }
        )
      } finally {
        setIsSaving(false)
      }
    },
    [refreshSession, sessionProfile]
  )

  const addApp = React.useCallback(async (name: string) => {
    const app = await addMfaApp(name)
    setMfaApps((current) => [...current, app])
    return app
  }, [])

  const removeApp = React.useCallback(async (id: string) => {
    await removeMfaApp(id)
    setMfaApps((current) => current.filter((app) => app.id !== id))
  }, [])

  const saveSidebarBehavior = React.useCallback(
    async (behavior: SidebarBehavior) => {
      const saved = await updateSidebarBehavior(behavior)
      setSidebarBehavior(saved)
    },
    []
  )

  return {
    error,
    isLoading,
    isSaving,
    mfaApps,
    profile,
    sidebarBehavior,
    addApp,
    removeApp,
    saveProfile,
    saveSidebarBehavior,
  }
}
