import type {
  AuthPasskeyRegistrationResult,
  AuthPermission,
  AuthProfile,
} from "@/features/auth"

export type SecurityPasskeyStatus = AuthProfile["passkeyStatus"]
export type SecurityAccountStatus = AuthProfile["status"]

export type SecurityMeasureId =
  | "two-factor-authentication"
  | "strong-password"
  | "passkey"
  | "recovery-options"
  | "recent-logins"
  | "trusted-devices"

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
  id: string
  occurredAt: string
  title: string
  tone: "success" | "warning"
}

export interface SecuritySessionRecord {
  aal: "aal1" | "aal2" | null
  browser: string
  createdAt: string
  current: boolean
  ipAddress: string | null
  lastSeenAt: string
  operatingSystem: string
  reviewed: boolean
  trusted: boolean
}

export interface SecurityPosture {
  currentLevel: "aal1" | "aal2"
  currentSessionTrusted: boolean
  mfaConfigured: boolean
  recentLoginsReviewed: boolean
  sessions: SecuritySessionRecord[]
  trustedDevicesConfigured: boolean
}

export interface SecurityMfaEnrollment {
  factorId: string
  qrCode: string
  secret: string
}

export interface SecuritySummary {
  account: SecurityAccountSummary
  passkeyStatus: SecurityPasskeyStatus
  permissions: readonly AuthPermission[]
  isAuthenticated: boolean
  posture: SecurityPosture
  session: SecuritySessionSummary
}

export interface SecuritySnapshot {
  isLoading: boolean
  error: string | null
  profile: AuthProfile | null
  security: SecuritySummary
  isPostureLoading: boolean
  postureError: Error | null
  refreshSecurity: () => Promise<void>
  refreshProfile: () => Promise<void>
  registerPasskey: () => Promise<AuthPasskeyRegistrationResult>
  logout: () => Promise<void>
}
