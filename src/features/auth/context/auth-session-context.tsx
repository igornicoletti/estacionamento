import * as React from "react"

import {
  getCurrentSessionProfile,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
  subscribeToProfileSyncChanges,
} from "../services"
import { type AppUserProfile } from "../types"

interface AuthSessionContextValue {
  profile: AppUserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthSessionContext = React.createContext<AuthSessionContextValue | null>(
  null
)

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = React.useState<AppUserProfile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadProfile = React.useCallback(async () => {
    const nextProfile = await getCurrentSessionProfile()

    setProfile(nextProfile)
    setIsLoading(false)
  }, [])

  const refresh = React.useCallback(async () => {
    setIsLoading(true)
    await loadProfile()
  }, [loadProfile])

  const signOut = React.useCallback(async () => {
    await signOutCurrentSession()
    setProfile(null)
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    let isCancelled = false

    async function loadSessionProfile() {
      const nextProfile = await getCurrentSessionProfile()

      if (!isCancelled) {
        setProfile(nextProfile)
        setIsLoading(false)
      }
    }

    void loadSessionProfile()

    const unsubscribeAuth = subscribeToAuthSessionChanges(() => {
      void loadSessionProfile()
    })
    const unsubscribeSync = subscribeToProfileSyncChanges(() => {
      void loadSessionProfile()
    })

    return () => {
      isCancelled = true
      unsubscribeAuth()
      unsubscribeSync()
    }
  }, [])

  const value = React.useMemo<AuthSessionContextValue>(
    () => ({
      profile,
      isAuthenticated: Boolean(profile),
      isLoading,
      refresh,
      signOut,
    }),
    [isLoading, profile, refresh, signOut]
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  const context = React.useContext(AuthSessionContext)

  if (!context) {
    throw new Error(
      "useAuthSession deve ser usado dentro de AuthSessionProvider."
    )
  }

  return context
}
