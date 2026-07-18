import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_ROLE_KEY,
  type AuthPermission,
  type AuthRoleKey,
} from "../contracts"

const rolePriority: Record<AuthRoleKey, number> = {
  [AUTH_ROLE_KEY.operator]: 0,
  [AUTH_ROLE_KEY.manager]: 1,
  [AUTH_ROLE_KEY.auditor]: 2,
  [AUTH_ROLE_KEY.admin]: 3,
  [AUTH_ROLE_KEY.owner]: 4,
}

export const allRoles: readonly AuthRoleKey[] = [
  AUTH_ROLE_KEY.operator,
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.auditor,
  AUTH_ROLE_KEY.admin,
  AUTH_ROLE_KEY.owner,
]

const operatorPermissions: readonly AuthPermission[] = [
  AUTH_PERMISSION.profileReadSelf,
  AUTH_PERMISSION.settingsReadSelf,
  AUTH_PERMISSION.notificationsRead,
  AUTH_PERMISSION.unitsRead,
  AUTH_PERMISSION.clientsRead,
  AUTH_PERMISSION.clientVehiclesRead,
  AUTH_PERMISSION.pricesRead,
  AUTH_PERMISSION.rulesRead,
]

const managerPermissions: readonly AuthPermission[] = [
  ...operatorPermissions,
  AUTH_PERMISSION.usersRead,
]

const auditorPermissions: readonly AuthPermission[] = [
  ...managerPermissions,
  AUTH_PERMISSION.accessRequestsRead,
  AUTH_PERMISSION.permissionsRead,
  AUTH_PERMISSION.auditRead,
]

const adminPermissions: readonly AuthPermission[] = [
  ...auditorPermissions,
  AUTH_PERMISSION.pricesManage,
  AUTH_PERMISSION.rulesManage,
  AUTH_PERMISSION.usersManage,
  AUTH_PERMISSION.accessRequestsReview,
  AUTH_PERMISSION.syncExecute,
]

export const permissionsByRole: Record<AuthRoleKey, readonly AuthPermission[]> = {
  [AUTH_ROLE_KEY.operator]: operatorPermissions,
  [AUTH_ROLE_KEY.manager]: managerPermissions,
  [AUTH_ROLE_KEY.auditor]: auditorPermissions,
  [AUTH_ROLE_KEY.admin]: adminPermissions,
  [AUTH_ROLE_KEY.owner]: [AUTH_PERMISSION_WILDCARD],
}

export const unitScopedRoles: ReadonlySet<AuthRoleKey> = new Set([
  AUTH_ROLE_KEY.operator,
  AUTH_ROLE_KEY.manager,
])

export function canManageRole(actor: AuthRoleKey, target: AuthRoleKey) {
  return rolePriority[actor] > rolePriority[target]
}

export function isRoleSuperior(actor: AuthRoleKey, target: AuthRoleKey) {
  return rolePriority[actor] > rolePriority[target]
}

export function getAssignableRoles(actorRole: AuthRoleKey): readonly AuthRoleKey[] {
  return allRoles.filter((role) => rolePriority[role] < rolePriority[actorRole])
}

export function hasAllPermissions(
  userPermissions: readonly string[],
  required: readonly string[]
): boolean {
  if (required.length === 0 || userPermissions.includes(AUTH_PERMISSION_WILDCARD)) {
    return true
  }

  return required.every((permission) => userPermissions.includes(permission))
}

export function hasAnyPermission(
  userPermissions: readonly string[],
  required: readonly string[]
): boolean {
  if (required.length === 0 || userPermissions.includes(AUTH_PERMISSION_WILDCARD)) {
    return true
  }

  return required.some((permission) => userPermissions.includes(permission))
}

export function isGlobalRole(role: AuthRoleKey) {
  return !unitScopedRoles.has(role)
}
