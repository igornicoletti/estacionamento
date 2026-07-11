import {
  permissionRoleLabels,
  permissionRoleValues,
  type PermissionAccessFilter,
  type PermissionMatrixRow,
  type PermissionRole,
} from "../types/permissions-types"

export function isPermissionRole(value: unknown): value is PermissionRole {
  return permissionRoleValues.includes(value as PermissionRole)
}

export function createEmptyRoleAccess(): Record<PermissionRole, boolean> {
  return {
    admin: false,
    auditor: false,
    manager: false,
    operator: false,
    owner: false,
  }
}

export function formatPermissionRoles(roles: readonly PermissionRole[]) {
  return roles.length > 0
    ? roles.map((role) => permissionRoleLabels[role]).join(", ")
    : "Nenhum perfil"
}

export function formatPermissionRolesWithoutAccess(
  roles: readonly PermissionRole[]
) {
  const roleSet = new Set(roles)
  const rolesWithoutAccess = permissionRoleValues.filter((role) => !roleSet.has(role))

  return rolesWithoutAccess.length > 0
    ? rolesWithoutAccess.map((role) => permissionRoleLabels[role]).join(", ")
    : "Nenhum"
}

function resolveAccessFilters(roles: readonly PermissionRole[]): PermissionAccessFilter[] {
  const filters: PermissionAccessFilter[] = []

  if (roles.length > 0) {
    filters.push("with_access")
  }

  if (roles.length < permissionRoleValues.length) {
    filters.push("without_access")
  }

  return filters
}

export function normalizePermissionMatrixRow(
  row: PermissionMatrixRow
): PermissionMatrixRow {
  const normalizedRoles = permissionRoleValues.filter((role) =>
    row.roles.includes(role)
  )
  const roleAccess = createEmptyRoleAccess()

  for (const role of normalizedRoles) {
    roleAccess[role] = true
  }

  return {
    ...row,
    accessFilters: resolveAccessFilters(normalizedRoles),
    roles: normalizedRoles,
    roleAccess,
    roleLabels: formatPermissionRoles(normalizedRoles),
    roleCount: normalizedRoles.length,
  }
}
