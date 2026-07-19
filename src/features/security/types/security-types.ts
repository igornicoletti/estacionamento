import type {
  AuthPasskeyRegistrationResult,
  AuthPermission,
  AuthProfile,
} from "@/features/auth"

export type SecurityPasskeyStatus = AuthProfile["passkeyStatus"]

export interface SecuritySessionSummary {
  authenticatedAt: string | null
  browser: string
  ipAddress: string | null
  operatingSystem: string
}

export interface SecuritySummary {
  passkeyStatus: SecurityPasskeyStatus
  permissions: readonly AuthPermission[]
  isAuthenticated: boolean
  session: SecuritySessionSummary
}

export interface SecuritySnapshot {
  isLoading: boolean
  error: string | null
  profile: AuthProfile | null
  security: SecuritySummary
  refreshProfile: () => Promise<void>
  registerPasskey: () => Promise<AuthPasskeyRegistrationResult>
}
