import { permissionRoleLabels } from "../constants"
import {
  permissionRoleValues,
  permissionSourceValues,
  type PermissionAccessFilter,
  type PermissionMatrixRow,
  type PermissionRole,
  type PermissionRoleAccess,
  type PermissionSource,
} from "./permissions-types"

export function isPermissionRole(value: unknown): value is PermissionRole {
  return permissionRoleValues.some((role) => role === value)
}

export function isPermissionSource(value: unknown): value is PermissionSource {
  return permissionSourceValues.some((source) => source === value)
}

export function createEmptyRoleAccess(): PermissionRoleAccess {
  return {
    admin: false,
    auditor: false,
    manager: false,
    operator: false,
    owner: false,
  }
}

export function sortPermissionRoles(
  roles: readonly PermissionRole[]
): PermissionRole[] {
  const roleSet = new Set(roles)

  return permissionRoleValues.filter((role) => roleSet.has(role))
}

export function createPermissionRoleAccess(
  roles: readonly PermissionRole[]
): PermissionRoleAccess {
  const roleAccess = createEmptyRoleAccess()

  for (const role of sortPermissionRoles(roles)) {
    roleAccess[role] = true
  }

  return roleAccess
}

export function formatPermissionRoles(roles: readonly PermissionRole[]) {
  const sortedRoles = sortPermissionRoles(roles)

  return sortedRoles.length > 0
    ? sortedRoles.map((role) => permissionRoleLabels[role]).join(", ")
    : "Nenhum perfil"
}

export function formatPermissionRolesWithoutAccess(
  roles: readonly PermissionRole[]
) {
  const roleSet = new Set(roles)
  const rolesWithoutAccess = permissionRoleValues.filter(
    (role) => !roleSet.has(role)
  )

  return rolesWithoutAccess.length > 0
    ? rolesWithoutAccess.map((role) => permissionRoleLabels[role]).join(", ")
    : "Nenhum"
}

function resolveAccessFilters(
  roles: readonly PermissionRole[]
): PermissionAccessFilter[] {
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
  const roles = sortPermissionRoles(row.roles)

  return {
    ...row,
    accessFilters: resolveAccessFilters(roles),
    roleAccess: createPermissionRoleAccess(roles),
    roleCount: roles.length,
    roleLabels: formatPermissionRoles(roles),
    roles,
  }
}
