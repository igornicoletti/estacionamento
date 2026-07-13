import type { AuthPermission, AuthProfile } from "@/features/auth"

export type SettingsAccountStatus = AuthProfile["status"]
export type SettingsPasskeyStatus = AuthProfile["passkeyStatus"]

export interface SettingsProfileSummary {
  id: string
  authUserId: string
  name: string
  cpfMasked: string | null
  email: string | null
  phoneMasked: string | null
  roleLabel: string | null
  roleKey: string | null
  status: SettingsAccountStatus
  unitLabel: string | null
}

export interface SettingsSecuritySummary {
  passkeyStatus: SettingsPasskeyStatus
  permissions: readonly AuthPermission[]
  isAuthenticated: boolean
}

export interface SettingsSnapshot {
  isLoading: boolean
  error: string | null
  profile: SettingsProfileSummary | null
  security: SettingsSecuritySummary
  refreshProfile: () => Promise<void>
}
