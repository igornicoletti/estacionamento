import type { AuthCapability } from "./auth-capabilities"
import { isUserRole, type UserRole } from "./auth-roles"
import { roleCapabilities } from "./authorization-policy"

export function getRoleCapabilities(role: UserRole | null | undefined) {
  if (!isUserRole(role)) {
    return [] as readonly AuthCapability[]
  }

  return roleCapabilities[role] as readonly AuthCapability[]
}

export function hasCapability(
  role: UserRole | null | undefined,
  capability: AuthCapability
) {
  return getRoleCapabilities(role).includes(capability)
}

export function hasAnyCapability(
  role: UserRole | null | undefined,
  capabilities: readonly AuthCapability[]
) {
  return capabilities.some((capability) => hasCapability(role, capability))
}

export function hasAllCapabilities(
  role: UserRole | null | undefined,
  capabilities: readonly AuthCapability[]
) {
  return capabilities.every((capability) => hasCapability(role, capability))
}

export function canReadAudit(role: UserRole | null | undefined) {
  return hasCapability(role, "audit.read")
}

export function canReadPermissions(role: UserRole | null | undefined) {
  return hasCapability(role, "security.permissions.read")
}
