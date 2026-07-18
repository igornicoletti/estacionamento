import * as React from "react"

import type { AuthPermission } from "../contracts"
import type {
  AuthPasskeyRegistrationResult,
  AuthPasswordResponse,
  AuthProfile,
} from "../types"
import type { AuthLoginPayload } from "../validation"

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
  applyProfilePatch: (
    patch: Partial<
      Pick<
        AuthProfile,
        "avatarPath" | "avatarUrl" | "email" | "name" | "passkeyStatus" | "phoneMasked"
      >
    >
  ) => void
  signInWithPassword: (payload: AuthLoginPayload) => Promise<AuthPasswordResponse>
  signInWithPasskey: () => Promise<void>
  registerProfilePasskey: () => Promise<AuthPasskeyRegistrationResult>
  completeRequiredPassword: (newPassword: string) => Promise<AuthPasswordResponse>
  registerRequiredPasskey: (input: {
    cpf: string
    flowId: string | null
  }) => Promise<AuthPasswordResponse>
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

export const AuthContext = React.createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = React.useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider.")
  }

  return context
}

export function useAuthSession(): AuthSessionValue {
  const auth = useAuth()

  return {
    profile: auth.profile,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    refresh: auth.actions.refreshProfile,
    signOut: auth.actions.logoutAsync,
  }
}
