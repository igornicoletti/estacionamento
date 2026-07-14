import type {
  AuthPasskeyRegistrationResult,
  AuthPermission,
  AuthProfile,
} from "@/features/auth"

export type SettingsAccountStatus = AuthProfile["status"]
export type SettingsPasskeyStatus = AuthProfile["passkeyStatus"]

export interface SettingsProfileSummary {
  id: string
  authUserId: string
  name: string
  avatarPath: string | null
  avatarUrl: string | null
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
  session: SettingsSessionSummary
}

export interface SettingsSessionSummary {
  authenticatedAt: string | null
  browser: string
  ipAddress: string | null
  operatingSystem: string
}

export interface SettingsSnapshot {
  isLoading: boolean
  error: string | null
  profile: SettingsProfileSummary | null
  security: SettingsSecuritySummary
  refreshProfile: () => Promise<void>
  registerPasskey: () => Promise<AuthPasskeyRegistrationResult>
  saveProfile: (input: SettingsProfileUpdateInput) => Promise<void>
  uploadAvatarFile: (file: File) => Promise<string>
}

export interface SettingsProfileUpdateInput {
  avatarUrl: string | null
  email: string | null
  name: string
  phone?: string | null
}
