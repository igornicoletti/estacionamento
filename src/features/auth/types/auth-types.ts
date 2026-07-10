import { type AppUserStatus, type AuthPermission } from "../authorization"

export type AuthFlowStep =
  | "credentials"
  | "passkey"
  | "new_password"
  | "passkey_registration"
  | "authenticated"

export type AuthPasswordNextAction =
  | "use_passkey"
  | "set_new_password"
  | "register_passkey"
  | "authenticated"

export interface AuthPasswordResponse {
  flowId: string
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

export interface AppUserRoleProfile {
  id: string | null
  key: string
  label: string | null
}

export interface AppUserProfile {
  id: string
  authUserId: string
  avatarUrl?: string | null
  name: string
  role: AppUserRoleProfile | null
  roleKey: string | null
  status: AppUserStatus
  permissions: readonly AuthPermission[]
  unitId: string | null
  unitName: string | null
  phoneMasked: string
  cpfMasked: string | null
  email: string | null
  passkeyStatus?: "active" | "inactive"
}

export interface RecoveryRequestResponse {
  message: string
}
