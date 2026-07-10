export type AuthPermission = string
export type AuthCapability = AuthPermission

export const AUTH_PERMISSION_WILDCARD = "*"

export function isAuthPermission(value: unknown): value is AuthPermission {
  return typeof value === "string" && value.trim().length > 0
}

export function normalizeAuthPermission(value: unknown): AuthPermission | null {
  if (!isAuthPermission(value)) {
    return null
  }

  return value.trim()
}

export function normalizeAuthPermissions(value: unknown): readonly AuthPermission[] {
  if (!Array.isArray(value)) {
    return []
  }

  const permissions = new Set<AuthPermission>()

  for (const item of value) {
    const permission = normalizeAuthPermission(item)

    if (permission) {
      permissions.add(permission)
    }
  }

  return Array.from(permissions)
}

export const isAuthCapability = isAuthPermission
