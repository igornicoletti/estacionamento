import type { AuthNextAction, AuthPermission, AuthStatus } from "../contracts"

export interface AuthRoleProfile {
  id: string | null
  key: string | null
  label: string | null
}

export interface AuthProfile {
  id: string
  authUserId: string
  name: string
  role: AuthRoleProfile | null
  roleKey: string | null
  status: AuthStatus
  permissions: readonly AuthPermission[]
  unitId: string | null
  unitName: string | null
  phoneMasked: string
  cpfMasked: string | null
  email: string | null
  avatarPath: string | null
  avatarUrl: string | null
  passkeyStatus: "active" | "inactive"
}

export interface AuthSessionPayload {
  access_token: string
  refresh_token: string
}

export interface AuthPasskeyRegistrationResult {
  createdAt: string | null
  friendlyName: string | null
  id: string
}

export interface AuthPasswordResponse {
  flowId: string | null
  message: string
  nextAction: AuthNextAction
  session?: AuthSessionPayload
}

export type AuthFlowStep =
  | "credentials"
  | "passkey"
  | "new_password"
  | "passkey_registration"
  | "authenticated"

export type AuthPasswordNextAction = AuthNextAction
export type AppUserProfile = AuthProfile

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

export interface RecoveryRequestResponse {
  message: string
}
