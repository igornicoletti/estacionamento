import type { AuthProfile } from "@/features/auth"

export type ProfileAccountStatus = AuthProfile["status"]

export interface ProfileSummary {
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
  status: ProfileAccountStatus
  unitLabel: string | null
}

export interface ProfileUpdateInput {
  avatarPath?: string | null
  avatarPreviewUrl?: string | null
  email: string | null
  name: string
  phone?: string | null
}

export interface MyProfileSnapshot {
  isLoading: boolean
  error: string | null
  profile: ProfileSummary | null
  refreshProfile: () => Promise<void>
  saveProfile: (input: ProfileUpdateInput) => Promise<void>
  uploadAvatarFile: (file: File) => Promise<string>
}
