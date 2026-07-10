import {
  AUTH_PERMISSION_WILDCARD,
  normalizeAuthPermissions,
  type AuthCapability,
  type AuthPermission,
} from "./auth-permissions"

export interface AuthPermissionSource {
  permissions?: readonly AuthPermission[] | null
}

type AuthPermissionCollection =
  | readonly AuthPermission[]
  | AuthPermissionSource
  | null
  | undefined

function isPermissionSource(value: unknown): value is AuthPermissionSource {
  return typeof value === "object" && value !== null && "permissions" in value
}

function getPermissions(source: AuthPermissionCollection) {
  if (Array.isArray(source)) {
    return normalizeAuthPermissions(source)
  }

  if (isPermissionSource(source)) {
    return normalizeAuthPermissions(source.permissions)
  }

  return []
}

export function hasPermission(
  source: AuthPermissionCollection,
  permission: AuthPermission
) {
  const permissions = new Set(getPermissions(source))

  return permissions.has(AUTH_PERMISSION_WILDCARD) || permissions.has(permission)
}

export function hasAnyPermission(
  source: AuthPermissionCollection,
  permissions: readonly AuthPermission[]
) {
  if (permissions.length === 0) {
    return true
  }

  return permissions.some((permission) => hasPermission(source, permission))
}

export function hasAllPermissions(
  source: AuthPermissionCollection,
  permissions: readonly AuthPermission[]
) {
  if (permissions.length === 0) {
    return true
  }

  return permissions.every((permission) => hasPermission(source, permission))
}

export const hasCapability = hasPermission
export const hasAnyCapability = hasAnyPermission
export const hasAllCapabilities = hasAllPermissions

export type { AuthCapability, AuthPermission }
