import { shouldBypassAuthInDev } from "@/config"
import {
  canAccessProtectedApp,
  hasAllCapabilities,
  isAppUserStatus,
  isUserRole,
  type AppUserStatus,
  type AuthCapability,
  type UserRole,
} from "@/features/auth"

type UnknownRecord = Record<PropertyKey, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null
}

export function isRouteAuthBypassEnabled() {
  return Boolean(import.meta.env.DEV && shouldBypassAuthInDev())
}

export function getAuthProfileStatus(profile: unknown): AppUserStatus | null {
  if (!isRecord(profile)) {
    return null
  }

  const status = profile.status

  return isAppUserStatus(status) ? status : null
}

export function getAuthProfileRole(profile: unknown): UserRole | null {
  if (!isRecord(profile)) {
    return null
  }

  const role = profile.role

  return isUserRole(role) ? role : null
}

export function canProfileAccessProtectedApp(profile: unknown) {
  return canAccessProtectedApp(getAuthProfileStatus(profile))
}

export function canRoleAccessCapabilities(
  role: UserRole | null | undefined,
  requiredCapabilities: readonly AuthCapability[] | null | undefined,
) {
  if (isRouteAuthBypassEnabled()) {
    return true
  }

  if (!requiredCapabilities || requiredCapabilities.length === 0) {
    return true
  }

  return hasAllCapabilities(role, requiredCapabilities)
}
