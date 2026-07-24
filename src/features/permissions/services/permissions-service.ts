import {
  authCapabilities,
  authCapabilityLabels,
  hasCapability,
  userRoleLabels,
  userRoleValues,
  type AuthCapability,
} from "@/features/auth"

import {
  permissionGroupLabels,
  type PermissionGroup,
  type PermissionMatrixRow,
} from "../types/permissions-types"

function resolvePermissionGroup(capability: AuthCapability): PermissionGroup {
  if (capability.startsWith("audit.")) {
    return "audit"
  }

  if (capability.startsWith("security.")) {
    return "security"
  }

  if (capability.startsWith("admin.clients.")) {
    return "clients"
  }

  if (capability.startsWith("admin.vehicles.")) {
    return "vehicles"
  }

  if (capability.startsWith("admin.units.")) {
    return "units"
  }

  if (capability.startsWith("admin.users.")) {
    return "users"
  }

  if (capability.startsWith("profile.")) {
    return "profile"
  }

  if (capability.startsWith("sessions.")) {
    return "sessions"
  }

  return "passkeys"
}

function buildPermissionMatrixRow(
  capability: AuthCapability
): PermissionMatrixRow {
  const roles = userRoleValues.filter((role) => hasCapability(role, capability))
  const group = resolvePermissionGroup(capability)

  return {
    capability,
    label: authCapabilityLabels[capability],
    group,
    groupLabel: permissionGroupLabels[group],
    roles: [...roles],
    roleLabels:
      roles.length > 0
        ? roles.map((role) => userRoleLabels[role]).join(", ")
        : "Nenhum perfil",
    roleCount: roles.length,
  }
}

export function buildPermissionMatrix(): PermissionMatrixRow[] {
  return authCapabilities.map(buildPermissionMatrixRow)
}

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  await Promise.resolve()

  return buildPermissionMatrix()
}
