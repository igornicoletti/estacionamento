import type { AuthNextAction } from "../auth-contracts"
import type { AuthProfile } from "../auth-api"

export type AuthFlowStep =
  | "credentials"
  | "passkey"
  | "new_password"
  | "passkey_registration"
  | "authenticated"

export type AuthPasswordNextAction = AuthNextAction

export interface AuthPasswordResponse {
  flowId: string | null
  nextAction: AuthPasswordNextAction
  message: string
  session?: {
    access_token: string
    refresh_token: string
  }
}

export interface AuthStartResponse {
  flowId: string
  nextAction: "use_password"
  message: string
}

export interface AuthFlowActionResponse {
  flowId: string
  nextAction: "authenticated"
  message: string
}

export interface ProfileActionResponse {
  message: string
}

export type AppUserProfile = AuthProfile

export interface RecoveryRequestResponse {
  message: string
}
