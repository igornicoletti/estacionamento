import * as React from "react"

import {
  AUTH_INACTIVITY,
  AUTH_NEXT_ACTION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_STORAGE_KEYS,
  canAccessProtectedApp,
  type AuthPermission,
} from "../contracts/auth-contracts"
import {
  completeRequiredPassword,
  getCurrentAuthProfile,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "../api"
import { clearAsyncSnapshotCache } from "@/hooks/use-async-snapshot"
import type { AuthPasswordResponse, AuthProfile } from "../types/auth-types"
import type { AuthLoginPayload } from "../validation/auth-validation"

export type AuthSessionStatus = "loading" | "anonymous" | "authenticated"

export interface RequiredPasswordChallenge {
  flowId: string | null
}

export interface AuthInactivityState {
  isWarningOpen: boolean
  secondsRemaining: number
  continueSession: () => void
  markExpired: () => void
  consumeExpired: () => boolean
}

export interface AuthAccessState {
  permissions: readonly AuthPermission[]
  hasPermission: (permission: AuthPermission) => boolean
  hasAllPermissions: (permissions: readonly AuthPermission[]) => boolean
  hasAnyPermission: (permissions: readonly AuthPermission[]) => boolean
}

export interface AuthActions {
  refreshProfile: () => Promise<void>
  signInWithPassword: (payload: AuthLoginPayload) => Promise<AuthPasswordResponse>
  completeRequiredPassword: (newPassword: string) => Promise<AuthPasswordResponse>
  clearRequiredPasswordChallenge: () => void
  logout: () => void
  logoutAsync: () => Promise<void>
}

export interface AuthContextValue {
  status: AuthSessionStatus
  profile: AuthProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isSubmitting: boolean
  error: string | null
  passwordChange: {
    required: boolean
  }
  access: AuthAccessState
  inactivity: AuthInactivityState
  actions: AuthActions
}

export interface AuthSessionValue {
  profile: AuthProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function readInactivityExpired() {
  if (typeof window === "undefined") {
    return false
  }

  return window.sessionStorage.getItem(AUTH_STORAGE_KEYS.inactivityExpired) === "1"
}

function writeInactivityExpired() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEYS.inactivityExpired, "1")
}

function consumeInactivityExpired() {
  if (typeof window === "undefined") {
    return false
  }

  const expired = readInactivityExpired()

  if (expired) {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEYS.inactivityExpired)
  }

  return expired
}

function now() {
  return Date.now()
}

function createPermissionSet(profile: AuthProfile | null) {
  return new Set<AuthPermission>(profile?.permissions ?? [])
}

function resolveErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthSessionStatus>("loading")
  const [profile, setProfile] = React.useState<AuthProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [requiredPasswordChallenge, setRequiredPasswordChallenge] =
    React.useState<RequiredPasswordChallenge | null>(null)
  const requiredPasswordCredentialsRef = React.useRef<{
    cpf: string
    currentPassword: string
  } | null>(null)
  const [isWarningOpen, setIsWarningOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.ceil(AUTH_INACTIVITY.warningMs / 1000)
  )
  const lastActivityAtRef = React.useRef(now())
  const isAuthenticated = status === "authenticated" && Boolean(profile)
  const canTrackInactivity =
    isAuthenticated && canAccessProtectedApp(profile?.status)
  const effectiveWarningOpen = canTrackInactivity && isWarningOpen

  const refreshProfile = React.useCallback(async () => {
    setError(null)
    const nextProfile = await getCurrentAuthProfile()

    setProfile((currentProfile) => {
      if (currentProfile?.authUserId !== nextProfile?.authUserId) {
        clearAsyncSnapshotCache()
      }

      return nextProfile
    })
    setStatus(nextProfile ? "authenticated" : "anonymous")
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const nextProfile = await getCurrentAuthProfile()

        if (!cancelled) {
          setProfile((currentProfile) => {
            if (currentProfile?.authUserId !== nextProfile?.authUserId) {
              clearAsyncSnapshotCache()
            }

            return nextProfile
          })
          setStatus(nextProfile ? "authenticated" : "anonymous")
        }
      } catch (caughtError) {
        if (!cancelled) {
          setProfile(null)
          setStatus("anonymous")
          setError(resolveErrorMessage(caughtError))
        }
      }
    }

    void loadProfile()

    const unsubscribe = subscribeToAuthSessionChanges(() => {
      void loadProfile()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const clearLocalAuthState = React.useCallback(() => {
    setProfile(null)
    clearAsyncSnapshotCache()
    setStatus("anonymous")
    setRequiredPasswordChallenge(null)
    requiredPasswordCredentialsRef.current = null
    setIsWarningOpen(false)
  }, [])

  const logoutAsync = React.useCallback(async () => {
    try {
      await signOutCurrentSession()
      setError(null)
    } catch (caughtError) {
      setError(resolveErrorMessage(caughtError))
    } finally {
      clearLocalAuthState()
    }
  }, [clearLocalAuthState])

  const logout = React.useCallback(() => {
    void logoutAsync()
  }, [logoutAsync])

  const continueSession = React.useCallback(() => {
    lastActivityAtRef.current = now()
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(AUTH_INACTIVITY.warningMs / 1000))
  }, [])

  React.useEffect(() => {
    if (!canTrackInactivity) {
      return
    }

    const events: readonly (keyof WindowEventMap)[] = [
      "click",
      "keydown",
      "scroll",
      "touchstart",
    ]

    function handleActivity() {
      if (!isWarningOpen) {
        lastActivityAtRef.current = now()
      }
    }

    for (const event of events) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleActivity)
      }
    }
  }, [canTrackInactivity, isWarningOpen])

  React.useEffect(() => {
    if (!canTrackInactivity) {
      return
    }

    const timer = window.setInterval(() => {
      const elapsed = now() - lastActivityAtRef.current
      const remainingMs = AUTH_INACTIVITY.timeoutMs - elapsed

      if (remainingMs <= 0) {
        writeInactivityExpired()
        setIsWarningOpen(false)
        logout()
        return
      }

      if (remainingMs <= AUTH_INACTIVITY.warningMs) {
        setIsWarningOpen(true)
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)))
      }
    }, AUTH_INACTIVITY.tickMs)

    return () => window.clearInterval(timer)
  }, [canTrackInactivity, logout])

  const signIn = React.useCallback(
    async (payload: AuthLoginPayload) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await signInWithPassword(payload)

        if (response.nextAction === AUTH_NEXT_ACTION.setNewPassword) {
          requiredPasswordCredentialsRef.current = {
            cpf: payload.cpf,
            currentPassword: payload.password,
          }
          setRequiredPasswordChallenge({
            flowId: response.flowId,
          })
          return response
        }

        if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
          await refreshProfile()
        }

        return response
      } catch (caughtError) {
        setError(resolveErrorMessage(caughtError))
        throw caughtError
      } finally {
        setIsSubmitting(false)
      }
    },
    [refreshProfile]
  )

  const completePassword = React.useCallback(
    async (newPassword: string) => {
      if (!requiredPasswordChallenge) {
        throw new Error("Não há troca de senha pendente.")
      }

      const credentials = requiredPasswordCredentialsRef.current

      if (!credentials) {
        throw new Error("Credenciais temporárias expiradas. Faça login novamente.")
      }

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await completeRequiredPassword({
          ...credentials,
          flowId: requiredPasswordChallenge.flowId,
          newPassword,
        })

        setRequiredPasswordChallenge(null)
        requiredPasswordCredentialsRef.current = null
        await signOutCurrentSession()
        setProfile(null)
        setStatus("anonymous")
        return response
      } catch (caughtError) {
        setError(resolveErrorMessage(caughtError))
        throw caughtError
      } finally {
        requiredPasswordCredentialsRef.current = null
        setRequiredPasswordChallenge(null)
        setIsSubmitting(false)
      }
    },
    [requiredPasswordChallenge]
  )

  const permissionSet = React.useMemo(
    () => createPermissionSet(profile),
    [profile]
  )

  const access = React.useMemo<AuthAccessState>(
    () => ({
      permissions: profile?.permissions ?? [],
      hasPermission(permission) {
        return (
          permissionSet.has(AUTH_PERMISSION_WILDCARD) ||
          permissionSet.has(permission)
        )
      },
      hasAllPermissions(permissions) {
        return permissions.every(
          (permission) =>
            permissionSet.has(AUTH_PERMISSION_WILDCARD) ||
            permissionSet.has(permission)
        )
      },
      hasAnyPermission(permissions) {
        return (
          permissions.length === 0 ||
          permissions.some(
            (permission) =>
              permissionSet.has(AUTH_PERMISSION_WILDCARD) ||
              permissionSet.has(permission)
          )
        )
      },
    }),
    [permissionSet, profile?.permissions]
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      isLoading: status === "loading",
      isAuthenticated,
      isSubmitting,
      error,
      passwordChange: {
        required: Boolean(requiredPasswordChallenge),
      },
      access,
      inactivity: {
        isWarningOpen: effectiveWarningOpen,
        secondsRemaining,
        continueSession,
        markExpired: writeInactivityExpired,
        consumeExpired: consumeInactivityExpired,
      },
      actions: {
        refreshProfile,
        signInWithPassword: signIn,
        completeRequiredPassword: completePassword,
        clearRequiredPasswordChallenge: () => {
          requiredPasswordCredentialsRef.current = null
          setRequiredPasswordChallenge(null)
        },
        logout,
        logoutAsync,
      },
    }),
    [
      access,
      completePassword,
      continueSession,
      effectiveWarningOpen,
      error,
      isAuthenticated,
      isSubmitting,
      logout,
      logoutAsync,
      profile,
      refreshProfile,
      requiredPasswordChallenge,
      secondsRemaining,
      signIn,
      status,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.")
  }

  return context
}

export function useAuthSession(): AuthSessionValue {
  const auth = useAuth()

  return React.useMemo(
    () => ({
      profile: auth.profile,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      refresh: auth.actions.refreshProfile,
      signOut: auth.actions.logoutAsync,
    }),
    [
      auth.actions.logoutAsync,
      auth.actions.refreshProfile,
      auth.isAuthenticated,
      auth.isLoading,
      auth.profile,
    ]
  )
}

export const markAuthInactivitySessionExpired = writeInactivityExpired
export const consumeAuthInactivitySessionExpired = consumeInactivityExpired
