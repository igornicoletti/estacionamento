import * as React from "react"

import {
  AUTH_INACTIVITY,
  AUTH_NEXT_ACTION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_STORAGE_KEYS,
  canAccessProtectedApp,
  type AuthPermission,
} from "./auth-contracts"
import {
  completeRequiredPassword,
  getCurrentAuthProfile,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
  type AuthPasswordResponse,
  type AuthProfile,
} from "./auth-api"
import type { AuthLoginPayload } from "./auth-validation"

type AuthSessionStatus = "loading" | "anonymous" | "authenticated"

interface RequiredPasswordChallenge {
  cpf: string
  currentPassword: string
  flowId: string | null
}

interface AuthInactivityState {
  isWarningOpen: boolean
  secondsRemaining: number
  continueSession: () => void
  markExpired: () => void
  consumeExpired: () => boolean
}

interface AuthAccessState {
  permissions: readonly AuthPermission[]
  hasPermission: (permission: AuthPermission) => boolean
  hasAllPermissions: (permissions: readonly AuthPermission[]) => boolean
  hasAnyPermission: (permissions: readonly AuthPermission[]) => boolean
}

interface AuthActions {
  refreshProfile: () => Promise<void>
  signInWithPassword: (payload: AuthLoginPayload) => Promise<AuthPasswordResponse>
  completeRequiredPassword: (newPassword: string) => Promise<AuthPasswordResponse>
  clearRequiredPasswordChallenge: () => void
  logout: () => void
  logoutAsync: () => Promise<void>
}

interface AuthContextValue {
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
  return new Set(profile?.permissions ?? [])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthSessionStatus>("loading")
  const [profile, setProfile] = React.useState<AuthProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [requiredPasswordChallenge, setRequiredPasswordChallenge] =
    React.useState<RequiredPasswordChallenge | null>(null)
  const [isWarningOpen, setIsWarningOpen] = React.useState(false)
  const [secondsRemaining, setSecondsRemaining] = React.useState(
    Math.ceil(AUTH_INACTIVITY.warningMs / 1000)
  )
  const lastActivityAtRef = React.useRef(now())

  const isAuthenticated = status === "authenticated" && Boolean(profile)

  const refreshProfile = React.useCallback(async () => {
    setError(null)
    const nextProfile = await getCurrentAuthProfile()

    setProfile(nextProfile)
    setStatus(nextProfile ? "authenticated" : "anonymous")
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const nextProfile = await getCurrentAuthProfile()

        if (!cancelled) {
          setProfile(nextProfile)
          setStatus(nextProfile ? "authenticated" : "anonymous")
        }
      } catch (caughtError) {
        if (!cancelled) {
          setProfile(null)
          setStatus("anonymous")
          setError(caughtError instanceof Error ? caughtError.message : null)
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

  const logoutAsync = React.useCallback(async () => {
    await signOutCurrentSession()
    setProfile(null)
    setStatus("anonymous")
    setRequiredPasswordChallenge(null)
    setIsWarningOpen(false)
  }, [])

  const logout = React.useCallback(() => {
    void logoutAsync()
  }, [logoutAsync])

  const continueSession = React.useCallback(() => {
    lastActivityAtRef.current = now()
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(AUTH_INACTIVITY.warningMs / 1000))
  }, [])

  React.useEffect(() => {
    if (!isAuthenticated || !canAccessProtectedApp(profile?.status)) {
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
  }, [isAuthenticated, isWarningOpen, profile?.status])

  React.useEffect(() => {
    if (!isAuthenticated || !canAccessProtectedApp(profile?.status)) {
      setIsWarningOpen(false)
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
  }, [isAuthenticated, logout, profile?.status])

  const signIn = React.useCallback(
    async (payload: AuthLoginPayload) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await signInWithPassword(payload)

        if (response.nextAction === AUTH_NEXT_ACTION.setNewPassword) {
          setRequiredPasswordChallenge({
            cpf: payload.cpf,
            currentPassword: payload.password,
            flowId: response.flowId,
          })
          return response
        }

        if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
          await refreshProfile()
        }

        return response
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : null)
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

      setIsSubmitting(true)
      setError(null)

      try {
        const response = await completeRequiredPassword({
          ...requiredPasswordChallenge,
          newPassword,
        })

        setRequiredPasswordChallenge(null)
        await signOutCurrentSession()
        setProfile(null)
        setStatus("anonymous")
        return response
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : null)
        throw caughtError
      } finally {
        setIsSubmitting(false)
      }
    },
    [requiredPasswordChallenge]
  )

  const permissionSet = React.useMemo(() => createPermissionSet(profile), [profile])

  const access = React.useMemo<AuthAccessState>(
    () => ({
      permissions: profile?.permissions ?? [],
      hasPermission(permission) {
        return permissionSet.has(AUTH_PERMISSION_WILDCARD) || permissionSet.has(permission)
      },
      hasAllPermissions(permissions) {
        return permissions.every((permission) =>
          permissionSet.has(AUTH_PERMISSION_WILDCARD) || permissionSet.has(permission)
        )
      },
      hasAnyPermission(permissions) {
        return permissions.length === 0 || permissions.some((permission) =>
          permissionSet.has(AUTH_PERMISSION_WILDCARD) || permissionSet.has(permission)
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
        isWarningOpen,
        secondsRemaining,
        continueSession,
        markExpired: writeInactivityExpired,
        consumeExpired: consumeInactivityExpired,
      },
      actions: {
        refreshProfile,
        signInWithPassword: signIn,
        completeRequiredPassword: completePassword,
        clearRequiredPasswordChallenge: () => setRequiredPasswordChallenge(null),
        logout,
        logoutAsync,
      },
    }),
    [
      access,
      completePassword,
      continueSession,
      error,
      isAuthenticated,
      isSubmitting,
      isWarningOpen,
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

export function useAuth() {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.")
  }

  return context
}

export function useAuthSession() {
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
