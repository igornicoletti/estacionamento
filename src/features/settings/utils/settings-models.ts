import type { AuthProfile } from "@/features/auth"

import { settingsCopy } from "../settings-copy"
import type { SettingsProfileSummary } from "../types/settings-types"

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized && normalized.length > 0 ? normalized : null
}

export function mapAuthProfileToSettingsProfile(
  profile: AuthProfile
): SettingsProfileSummary {
  return {
    id: profile.id,
    authUserId: profile.authUserId,
    name: profile.name,
    cpfMasked: normalizeText(profile.cpfMasked),
    email: normalizeText(profile.email),
    phoneMasked: normalizeText(profile.phoneMasked),
    roleLabel: normalizeText(profile.role?.label) ?? normalizeText(profile.roleKey),
    roleKey: normalizeText(profile.roleKey),
    status: profile.status,
    unitLabel: normalizeText(profile.unitName) ?? settingsCopy.profile.globalUnit,
  }
}

export function resolveDisplayValue(value: string | null | undefined) {
  return normalizeText(value) ?? settingsCopy.profile.fallback
}

export function resolveProfileEmail(value: string | null | undefined) {
  return normalizeText(value) ?? settingsCopy.profile.noEmail
}

export function resolveProfilePhone(value: string | null | undefined) {
  return normalizeText(value) ?? settingsCopy.profile.noPhone
}

export function resolveProfileCpf(value: string | null | undefined) {
  return normalizeText(value) ?? settingsCopy.profile.noCpf
}

export function resolveProfileRole(value: string | null | undefined) {
  return normalizeText(value) ?? settingsCopy.profile.noRole
}
