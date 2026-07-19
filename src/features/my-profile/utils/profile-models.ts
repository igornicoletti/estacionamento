import type { AuthProfile } from "@/features/auth"
import { resolveVisibleSensitiveValue } from "@/lib"

import { myProfileCopy } from "../my-profile-copy"
import type { ProfileSummary } from "../types/profile-types"

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

export function mapAuthProfileToProfileSummary(profile: AuthProfile): ProfileSummary {
  return {
    id: profile.id,
    authUserId: profile.authUserId,
    name: profile.name,
    avatarPath: profile.avatarPath,
    avatarUrl: profile.avatarUrl,
    cpfMasked: normalizeText(profile.cpfMasked),
    email: normalizeText(profile.email),
    phoneMasked: normalizeText(profile.phoneMasked),
    roleLabel: normalizeText(profile.role?.label) ?? normalizeText(profile.roleKey),
    roleKey: normalizeText(profile.roleKey),
    status: profile.status,
    unitLabel: normalizeText(profile.unitName) ?? myProfileCopy.profile.globalUnit,
  }
}

export function resolveDisplayValue(value: string | null | undefined) {
  return normalizeText(value) ?? myProfileCopy.profile.fallback
}

export function resolveProfileEmail(value: string | null | undefined) {
  return normalizeText(value) ?? myProfileCopy.profile.noEmail
}

export function resolveProfilePhone(value: string | null | undefined) {
  return resolveVisibleSensitiveValue(value) ?? myProfileCopy.profile.noPhone
}

export function resolveProfileCpf(value: string | null | undefined) {
  return resolveVisibleSensitiveValue(value) ?? myProfileCopy.profile.noCpf
}

export function resolveProfileRole(value: string | null | undefined) {
  return normalizeText(value) ?? myProfileCopy.profile.noRole
}
