import * as React from "react"

import { shouldBypassAuthInDev } from "@/config"
import { clearAsyncSnapshotCache } from "@/hooks/use-async-snapshot"

import {
  completeRequiredPassword,
  getCurrentAuthProfile,
  registerAuthenticatedPasskey,
  registerCurrentPasskey,
  signInWithPasskey as signInWithPasskeyApi,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "../api"
import { AUTH_NEXT_ACTION, canAccessProtectedApp } from "../contracts"
import type {
  AuthPasswordResponse,
  AuthProfile,
} from "../types"
import type { AuthLoginPayload } from "../validation"
import { AuthContext, type AuthContextValue, type AuthSessionStatus } from "./auth-context"
import { useAuthInactivity } from "./auth-inactivity"
import {
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
} from "./auth-inactivity-storage"
import { createAuthAccessState } from "./create-auth-access-state"

export type {
  AuthAccessState,
  AuthActions,
  AuthContextValue,
  AuthInactivityState,
  AuthSessionStatus,
  AuthSessionValue,
  RequiredPasswordChallenge,
} from "./auth-context"
export { useAuth, useAuthSession } from "./auth-context"
export {
  consumeAuthInactivitySessionExpired,
  markAuthInactivitySessionExpired,
} from "./auth-inactivity-storage"

function resolveErrorMessage(caughtError: unknown) {
  return caughtError instanceof Error ? caughtError.message : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthSessionStatus>("loading")
  const [profile, setProfile] = React.useState<AuthProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [requiredPasswordChallenge, setRequiredPasswordChallenge] =
    React.useState<{ flowId: string | null } | null>(null)
  const requiredPasswordCredentialsRef = React.useRef<{
    cpf: string
    currentPassword: string
  } | null>(null)
  const isAuthenticated = status === "authenticated" && Boolean(profile)

  const clearLocalAuthState = React.useCallback(() => {
    setProfile(null)
    clearAsyncSnapshotCache()
    setStatus("anonymous")
    setRequiredPasswordChallenge(null)
    requiredPasswordCredentialsRef.current = null
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

  const inactivity = useAuthInactivity({
    isAuthenticated,
    onExpired: logout,
    profile,
  })

  const setResolvedProfile = React.useCallback(
    (nextProfile: AuthProfile | null) => {
      inactivity.resetForProfile(nextProfile)
      setProfile((currentProfile) => {
        if (currentProfile?.authUserId !== nextProfile?.authUserId) {
          clearAsyncSnapshotCache()
        }

        return nextProfile
      })
      setStatus(nextProfile ? "authenticated" : "anonymous")
    },
    [inactivity]
  )

  const refreshProfile = React.useCallback(async () => {
    setError(null)
    setResolvedProfile(await getCurrentAuthProfile())
  }, [setResolvedProfile])

  React.useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const nextProfile = await getCurrentAuthProfile()

        if (!cancelled) {
          setResolvedProfile(nextProfile)
        }
      } catch (caughtError) {
        if (!cancelled) {
          setProfile(null)
          inactivity.clearTracking()
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
  }, [inactivity, setResolvedProfile])

  const applyProfilePatch = React.useCallback(
    (
      patch: Partial<
        Pick<
          AuthProfile,
          "avatarPath" | "avatarUrl" | "email" | "name" | "passkeyStatus" | "phoneMasked"
        >
      >
    ) => {
      setProfile((currentProfile) =>
        currentProfile ? { ...currentProfile, ...patch } : currentProfile
      )
    },
    []
  )

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
          setRequiredPasswordChallenge({ flowId: response.flowId })
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
    async (newPassword: string): Promise<AuthPasswordResponse> => {
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

        if (response.nextAction === AUTH_NEXT_ACTION.registerPasskey) {
          return response
        }

        await signOutCurrentSession()
        setProfile(null)
        inactivity.clearTracking()
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
    [inactivity, requiredPasswordChallenge]
  )

  const registerRequiredPasskey = React.useCallback(
    async (input: { cpf: string; flowId: string | null }) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const response = await registerCurrentPasskey(input)
        await refreshProfile()
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

  const signInPasskey = React.useCallback(async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await signInWithPasskeyApi()
      await refreshProfile()
    } catch (caughtError) {
      setError(resolveErrorMessage(caughtError))
      throw caughtError
    } finally {
      setIsSubmitting(false)
    }
  }, [refreshProfile])

  const registerProfilePasskey = React.useCallback(async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const passkey = await registerAuthenticatedPasskey()
      applyProfilePatch({ passkeyStatus: "active" })
      await refreshProfile()
      return passkey
    } finally {
      setIsSubmitting(false)
    }
  }, [applyProfilePatch, refreshProfile])

  const access = React.useMemo(() => createAuthAccessState(profile), [profile])

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
      inactivity: inactivity.state,
      actions: {
        refreshProfile,
        applyProfilePatch,
        signInWithPassword: signIn,
        signInWithPasskey: signInPasskey,
        registerProfilePasskey,
        completeRequiredPassword: completePassword,
        registerRequiredPasskey,
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
      applyProfilePatch,
      completePassword,
      error,
      inactivity.state,
      isAuthenticated,
      isSubmitting,
      logout,
      logoutAsync,
      profile,
      refreshProfile,
      registerProfilePasskey,
      registerRequiredPasskey,
      requiredPasswordChallenge,
      signIn,
      signInPasskey,
      status,
    ]
  )

  if (shouldBypassAuthInDev()) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  if (!isAuthenticated && !canAccessProtectedApp(profile?.status)) {
    inactivity.clearTracking()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
