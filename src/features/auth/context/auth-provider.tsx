import * as React from "react"

import { clearAsyncSnapshotCache } from "@/hooks/use-async-snapshot"

import {
  completeRequiredPassword,
  getCurrentAuthProfile,
  isAuthSessionExpiredError,
  registerAuthenticatedPasskey,
  signInWithPasskey as signInWithPasskeyApi,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthSessionChanges,
} from "../api"
import { AUTH_NEXT_ACTION, canAccessProtectedApp } from "../contracts"
import type { AuthPasswordResponse, AuthProfile } from "../types"
import type { AuthLoginPayload } from "../validation"
import {
  AuthContext,
  type AuthContextValue,
  type AuthSessionStatus,
} from "./auth-context"
import { useAuthInactivity } from "./auth-inactivity"
import { markAuthInactivitySessionExpired } from "./auth-inactivity-storage"
import { createAuthAccessState } from "./create-auth-access-state"

export { useAuth, useAuthSession } from "./auth-context"
export type {
  AuthAccessState,
  AuthActions,
  AuthContextValue,
  AuthInactivityState,
  AuthSessionStatus,
  AuthSessionValue,
  RequiredPasswordChallenge,
} from "./auth-context"
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
  const profileLoadIdRef = React.useRef(0)
  const isAuthenticated = status === "authenticated" && Boolean(profile)

  const clearLocalAuthState = React.useCallback(() => {
    profileLoadIdRef.current += 1
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

  const {
    clearTracking: clearInactivityTracking,
    resetForProfile: resetInactivityForProfile,
    state: inactivityState,
  } = useAuthInactivity({
    isAuthenticated,
    onExpired: logout,
    profile,
  })

  const setResolvedProfile = React.useCallback(
    (nextProfile: AuthProfile | null) => {
      resetInactivityForProfile(nextProfile)
      setProfile((currentProfile) => {
        if (currentProfile?.authUserId !== nextProfile?.authUserId) {
          clearAsyncSnapshotCache()
        }

        return nextProfile
      })
      setStatus(nextProfile ? "authenticated" : "anonymous")
    },
    [resetInactivityForProfile]
  )

  const loadProfile = React.useCallback(
    async (throwOnError: boolean) => {
      const profileLoadId = profileLoadIdRef.current + 1
      profileLoadIdRef.current = profileLoadId

      try {
        const nextProfile = await getCurrentAuthProfile()

        if (profileLoadId === profileLoadIdRef.current) {
          setResolvedProfile(nextProfile)
        }
      } catch (caughtError) {
        const sessionExpired = isAuthSessionExpiredError(caughtError)

        if (profileLoadId === profileLoadIdRef.current) {
          setProfile(null)
          clearInactivityTracking()
          setStatus("anonymous")
          setError(sessionExpired ? null : resolveErrorMessage(caughtError))

          if (sessionExpired) {
            markAuthInactivitySessionExpired()
          }
        }

        if (sessionExpired) {
          try {
            await signOutCurrentSession()
          } catch {
            // O lease já está inválido; a limpeza local é concluída pelo provider.
          }

          if (throwOnError) {
            throw caughtError
          }
        } else if (throwOnError) {
          throw caughtError
        }
      }
    },
    [clearInactivityTracking, setResolvedProfile]
  )

  const refreshProfile = React.useCallback(async () => {
    setError(null)
    await loadProfile(true)
  }, [loadProfile])

  React.useEffect(() => {
    const unsubscribe = subscribeToAuthSessionChanges(() => {
      void loadProfile(false)
    })

    return () => {
      profileLoadIdRef.current += 1
      unsubscribe()
    }
  }, [loadProfile])

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

        if (response.nextAction === AUTH_NEXT_ACTION.authenticated) {
          await refreshProfile()
        }

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
    [refreshProfile, requiredPasswordChallenge]
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
    } catch (caughtError) {
      setError(resolveErrorMessage(caughtError))
      throw caughtError
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
      inactivity: inactivityState,
      actions: {
        refreshProfile,
        applyProfilePatch,
        signInWithPassword: signIn,
        signInWithPasskey: signInPasskey,
        registerProfilePasskey,
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
      applyProfilePatch,
      completePassword,
      error,
      inactivityState,
      isAuthenticated,
      isSubmitting,
      logout,
      logoutAsync,
      profile,
      refreshProfile,
      registerProfilePasskey,
      requiredPasswordChallenge,
      signIn,
      signInPasskey,
      status,
    ]
  )

  React.useEffect(() => {
    if (!isAuthenticated && !canAccessProtectedApp(profile?.status)) {
      clearInactivityTracking()
    }
  }, [clearInactivityTracking, isAuthenticated, profile?.status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
