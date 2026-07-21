import type {
  AuthPasskeyRegistrationResult,
  AuthPermission,
  AuthProfile,
} from "@/features/auth"

export type SecurityPasskeyStatus = AuthProfile["passkeyStatus"]
export type SecurityAccountStatus = AuthProfile["status"]

export type SecurityMeasureId =
  | "strong-password"
  | "passkey"
  | "recovery-contact"

export type SecurityMeasureStatus = "completed" | "action-required"

export interface SecurityAccountSummary {
  email: string | null
  phoneMasked: string | null
  status: SecurityAccountStatus
}

export interface SecuritySessionSummary {
  authenticatedAt: string | null
  browser: string
  ipAddress: string | null
  operatingSystem: string
}

export interface SecurityScore {
  completed: number
  total: number
  value: number
  remaining: number
}

export interface SecurityEventSummary {
  description: string
  href?: `/${string}`
  id: string
  occurredAt: string
  title: string
}

export interface SecuritySummary {
  account: SecurityAccountSummary
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
  logout: () => Promise<void>
}
