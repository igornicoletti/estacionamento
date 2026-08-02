
import type { UserMenuProfileView } from "./user-menu.types"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

function readStringField(value: unknown, field: PropertyKey) {
  if (!isRecord(value) || typeof value[field] !== "string") {
    return null
  }

  const normalized = value[field].trim()
  return normalized || null
}

function getRoleLabel(profile: unknown) {
  if (!isRecord(profile) || !isRecord(profile.role)) {
    return null
  }

  return readStringField(profile.role, "label")
}

export function createUserInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return initials || "U"
}

export function createUserMenuProfile(
  profile: unknown,
  options: {
    fallbackName: string
    fallbackMeta: string
  }
): UserMenuProfileView {
  const displayName = readStringField(profile, "name") ?? options.fallbackName
  const displayMeta = getRoleLabel(profile) ?? options.fallbackMeta

  return {
    displayName,
    displayMeta,
    fallback: createUserInitials(displayName),
    avatarUrl: readStringField(profile, "avatarUrl"),
    authUserId: readStringField(profile, "authUserId"),
    email: readStringField(profile, "email"),
  }
}
