import { permissionsCopy } from "../constants/permissions-copy"
import { permissionGroupLabels } from "../constants/permissions-labels"
import { type PermissionMatrixWirePayload } from "../schemas/permissions-gateway-schema"
import {
  type Permission,
  type PermissionMatrix,
  type PermissionRole,
  type PermissionRoleKey,
  type PermissionTableRow,
} from "./permissions-types"

export function toPermissionMatrix(
  payload: PermissionMatrixWirePayload
): PermissionMatrix {
  return {
    permissions: payload.permissions.map((permission) => ({
      description: permission.description,
      key: permission.key,
      label: permission.label,
      roleKeys: [...permission.roleKeys],
    })),
    roles: payload.roles.map((role) => ({ ...role })),
  }
}

export function resolvePermissionGroupKey(permissionKey: string) {
  return permissionKey === "*"
    ? "system"
    : permissionKey.split(".")[0] || "system"
}

export function toPermissionTableRow(
  permission: Permission
): PermissionTableRow {
  const groupKey = resolvePermissionGroupKey(permission.key)

  return {
    ...permission,
    groupKey,
    groupLabel:
      permissionGroupLabels[groupKey] ?? permissionsCopy.labels.unknownGroup,
    roleCount: permission.roleKeys.length,
  }
}

export function toPermissionTableRows(
  permissions: readonly Permission[]
): PermissionTableRow[] {
  return permissions.map(toPermissionTableRow)
}

export function formatPermissionRoles(
  roleKeys: readonly PermissionRoleKey[],
  roles: readonly PermissionRole[]
) {
  const selectedRoles = new Set(roleKeys)

  return roles
    .filter((role) => selectedRoles.has(role.key))
    .map((role) => role.label)
}

export function formatPermissionRolesWithoutAccess(
  roleKeys: readonly PermissionRoleKey[],
  roles: readonly PermissionRole[]
) {
  const selectedRoles = new Set(roleKeys)

  return roles
    .filter((role) => !selectedRoles.has(role.key))
    .map((role) => role.label)
}
