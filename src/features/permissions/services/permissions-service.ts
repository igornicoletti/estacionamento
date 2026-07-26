import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  getRoleFallbackPermissions,
  type AuthPermission,
} from "@/features/auth/contracts"

import { permissionGroupLabels } from "../constants"
import {
  formatTechnicalPermissionKey,
  normalizePermissionMatrixRow,
  permissionRoleValues,
  type PermissionMatrixRow,
  type PermissionRole,
} from "../model"

const criticalPermissions = new Set<AuthPermission>([
  AUTH_PERMISSION.auditRead,
  AUTH_PERMISSION.permissionsRead,
  AUTH_PERMISSION.usersManage,
  AUTH_PERMISSION.accessRequestsReview,
  AUTH_PERMISSION.syncExecute,
])

const permissionValues = Object.values(AUTH_PERMISSION).filter(
  (permission): permission is Exclude<AuthPermission, typeof AUTH_PERMISSION_WILDCARD> => {
    return permission !== AUTH_PERMISSION_WILDCARD
  }
)

function resolvePermissionGroupKey(permission: AuthPermission) {
  return permission.split(".")[0] ?? "system"
}

function resolvePermissionGroupLabel(groupKey: string) {
  return permissionGroupLabels[groupKey] ?? formatTechnicalPermissionKey(groupKey)
}

function roleHasPermission(role: PermissionRole, permission: AuthPermission) {
  const rolePermissions = getRoleFallbackPermissions(role)

  return (
    rolePermissions.includes(AUTH_PERMISSION_WILDCARD) ||
    rolePermissions.includes(permission)
  )
}

function resolveRoles(permission: AuthPermission): PermissionRole[] {
  return permissionRoleValues.filter((role) => roleHasPermission(role, permission))
}

function buildPermissionMatrixRow(permission: AuthPermission): PermissionMatrixRow {
  const groupKey = resolvePermissionGroupKey(permission)
  const roles = resolveRoles(permission)

  return normalizePermissionMatrixRow({
    accessFilters: [],
    description: null,
    groupKey,
    groupLabel: resolvePermissionGroupLabel(groupKey),
    id: permission,
    isCritical: criticalPermissions.has(permission),
    key: permission,
    label: formatTechnicalPermissionKey(permission),
    roleAccess: {
      admin: false,
      auditor: false,
      manager: false,
      operator: false,
      owner: false,
    },
    roleCount: 0,
    roleLabels: "",
    roles,
    source: "system",
  })
}

export function buildPermissionMatrix(): PermissionMatrixRow[] {
  return permissionValues.map(buildPermissionMatrixRow)
}

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  await Promise.resolve()

  return buildPermissionMatrix()
}
