import {
  authCapabilities,
  authCapabilityLabels,
  userRoleLabels,
  userRoleValues,
  type AuthCapability,
  type UserRole,
} from "@/features/auth"

import { permissionsCopy } from "../permissions-copy"
import {
  permissionGroupLabels,
  type PermissionGroup,
} from "../types/permissions-types"

interface PermissionGroupRule {
  group: PermissionGroup
  capabilityPrefix: string
}

const permissionGroupRules: readonly PermissionGroupRule[] = [
  { group: "audit", capabilityPrefix: "audit." },
  { group: "commercial", capabilityPrefix: "commercial." },
  { group: "security", capabilityPrefix: "security." },
  { group: "clients", capabilityPrefix: "admin.clients." },
  { group: "vehicles", capabilityPrefix: "admin.vehicles." },
  { group: "units", capabilityPrefix: "admin.units." },
  { group: "users", capabilityPrefix: "admin.users." },
  { group: "profile", capabilityPrefix: "profile." },
  { group: "sessions", capabilityPrefix: "sessions." },
]

export interface PermissionCapabilityDescriptor {
  capability: AuthCapability
  label: string
  group: PermissionGroup
  groupLabel: string
}

export function resolvePermissionGroup(capability: AuthCapability): PermissionGroup {
  const matchedRule = permissionGroupRules.find((rule) =>
    capability.startsWith(rule.capabilityPrefix)
  )

  return matchedRule?.group ?? "passkeys"
}

export function listPermissionCapabilityDescriptors() {
  return authCapabilities.map((capability): PermissionCapabilityDescriptor => {
    const group = resolvePermissionGroup(capability)

    return {
      capability,
      label: authCapabilityLabels[capability],
      group,
      groupLabel: permissionGroupLabels[group],
    }
  })
}

export function formatRolesWithAccess(roles: readonly UserRole[]) {
  return roles.length > 0
    ? roles.map((role) => userRoleLabels[role]).join(", ")
    : permissionsCopy.labels.noneRole
}

export function formatRolesWithoutAccess(roles: readonly UserRole[]) {
  const rolesWithoutAccess = userRoleValues.filter((role) => !roles.includes(role))

  return rolesWithoutAccess.length > 0
    ? rolesWithoutAccess.map((role) => userRoleLabels[role]).join(", ")
    : permissionsCopy.labels.noRoleWithoutAccess
}
