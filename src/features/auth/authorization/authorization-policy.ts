/**
 * Política de autorização centralizada.
 *
 * Todas as regras de autorização, hierarquia de papéis e mapeamento
 * role → permissões estão consolidadas aqui.
 *
 * - Roles com prioridade numérica crescente (owner = máximo)
 * - Permissões resolvidas por intersecção: usuário precisa de TODAS
 *   as permissões requeridas por uma rota/ação
 * - Wildcard "*" concede acesso total (apenas owner)
 */

import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_ROLE_KEY,
  type AuthPermission,
  type AuthRoleKey,
} from "../contracts/auth-contracts"

// ---------------------------------------------------------------------------
// Hierarquia de papéis (prioridade crescente)
// ---------------------------------------------------------------------------

const rolePriority: Record<AuthRoleKey, number> = {
  [AUTH_ROLE_KEY.operator]: 0,
  [AUTH_ROLE_KEY.manager]: 1,
  [AUTH_ROLE_KEY.auditor]: 2,
  [AUTH_ROLE_KEY.admin]: 3,
  [AUTH_ROLE_KEY.owner]: 4,
}

/** Retorna true se `actor` tem prioridade >= `target`. */
export function canManageRole(actor: AuthRoleKey, target: AuthRoleKey) {
  return rolePriority[actor] > rolePriority[target]
}

/** Retorna true se `actor` tem prioridade estritamente superior a `target`. */
export function isRoleSuperior(actor: AuthRoleKey, target: AuthRoleKey) {
  return rolePriority[actor] > rolePriority[target]
}

/** Retorna os papéis que um ator pode atribuir a outros. */
export function getAssignableRoles(actorRole: AuthRoleKey): readonly AuthRoleKey[] {
  return allRoles.filter((role) => rolePriority[role] < rolePriority[actorRole])
}

// ---------------------------------------------------------------------------
// Lista de papéis (ordenada por prioridade)
// ---------------------------------------------------------------------------

export const allRoles: readonly AuthRoleKey[] = [
  AUTH_ROLE_KEY.operator,
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.auditor,
  AUTH_ROLE_KEY.admin,
  AUTH_ROLE_KEY.owner,
]

// ---------------------------------------------------------------------------
// Permissões agrupadas por papel
// ---------------------------------------------------------------------------

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

/**
 * Mapeamento estático role → permissões.
 * Usado como fallback quando o backend não retorna permissões explícitas.
 */
export const permissionsByRole: Record<AuthRoleKey, readonly AuthPermission[]> = {
  [AUTH_ROLE_KEY.operator]: operatorPermissions,
  [AUTH_ROLE_KEY.manager]: managerPermissions,
  [AUTH_ROLE_KEY.auditor]: auditorPermissions,
  [AUTH_ROLE_KEY.admin]: adminPermissions,
  [AUTH_ROLE_KEY.owner]: [AUTH_PERMISSION_WILDCARD],
}

// ---------------------------------------------------------------------------
// Verificação de permissões
// ---------------------------------------------------------------------------

/**
 * Retorna true se a lista de permissões do usuário contém TODAS as requeridas.
 * Wildcard "*" concede acesso total.
 */
export function hasAllPermissions(
  userPermissions: readonly string[],
  required: readonly string[]
): boolean {
  if (required.length === 0) {
    return true
  }

  if (userPermissions.includes(AUTH_PERMISSION_WILDCARD)) {
    return true
  }

  return required.every((permission) => userPermissions.includes(permission))
}

/**
 * Retorna true se a lista de permissões do usuário contém PELO MENOS UMA das requeridas.
 */
export function hasAnyPermission(
  userPermissions: readonly string[],
  required: readonly string[]
): boolean {
  if (required.length === 0) {
    return true
  }

  if (userPermissions.includes(AUTH_PERMISSION_WILDCARD)) {
    return true
  }

  return required.some((permission) => userPermissions.includes(permission))
}

// ---------------------------------------------------------------------------
// Escopo de unidade
// ---------------------------------------------------------------------------

/** Papéis com escopo restrito a uma única unidade. */
export const unitScopedRoles: ReadonlySet<AuthRoleKey> = new Set([
  AUTH_ROLE_KEY.operator,
  AUTH_ROLE_KEY.manager,
])

/** Retorna true se o papel tem escopo global (acessa todas as unidades). */
export function isGlobalRole(role: AuthRoleKey) {
  return !unitScopedRoles.has(role)
}
