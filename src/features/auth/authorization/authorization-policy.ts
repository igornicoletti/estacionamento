import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_ROLE_KEY,
  getRoleFallbackPermissions,
  type AuthPermission,
  type AuthRoleKey,
  type AuthStatus,
} from "../contracts"

export type AuthCapability = AuthPermission
export type AppUserStatus = AuthStatus
export type UserRole = AuthRoleKey

export const allRoles = [
  AUTH_ROLE_KEY.owner,
  AUTH_ROLE_KEY.admin,
  AUTH_ROLE_KEY.auditor,
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.operator,
] as const satisfies readonly UserRole[]

export const userRoleValues = allRoles

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gestor",
  operator: "Operador",
  owner: "Proprietário",
}

export const appUserStatusLabels: Record<AppUserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  passkey_reset: "Reset de passkey",
  password_reset: "Troca de senha",
  pending: "Pendente",
}

export const unitScopedRoleValues = [
  AUTH_ROLE_KEY.manager,
  AUTH_ROLE_KEY.operator,
] as const satisfies readonly UserRole[]

export const unitScopedRoles = new Set<UserRole>(unitScopedRoleValues)

export const routeCapabilities = {
  clients: [AUTH_PERMISSION.clientsRead],
  units: [AUTH_PERMISSION.unitsRead],
} as const satisfies Record<string, readonly AuthCapability[]>

export const authCapabilities = Object.values(AUTH_PERMISSION).filter(
  (permission): permission is Exclude<AuthPermission, typeof AUTH_PERMISSION_WILDCARD> => {
    return permission !== AUTH_PERMISSION_WILDCARD
  }
)

export const authCapabilityLabels: Record<AuthCapability, string> = {
  [AUTH_PERMISSION_WILDCARD]: "Acesso total",
  [AUTH_PERMISSION.profileReadSelf]: "Ler próprio perfil",
  [AUTH_PERMISSION.settingsReadSelf]: "Gerenciar próprias configurações",
  [AUTH_PERMISSION.notificationsRead]: "Ler notificações",
  [AUTH_PERMISSION.unitsRead]: "Consultar unidades",
  [AUTH_PERMISSION.unitsYardManage]: "Gerenciar configuração de pátio",
  [AUTH_PERMISSION.clientsRead]: "Consultar clientes",
  [AUTH_PERMISSION.clientVehiclesRead]: "Consultar veículos de clientes",
  [AUTH_PERMISSION.clientsSyncRead]: "Consultar sincronização de clientes",
  [AUTH_PERMISSION.pricesRead]: "Consultar preços",
  [AUTH_PERMISSION.pricesManage]: "Gerenciar preços",
  [AUTH_PERMISSION.rulesRead]: "Consultar regras",
  [AUTH_PERMISSION.rulesManage]: "Gerenciar regras",
  [AUTH_PERMISSION.usersRead]: "Consultar usuários",
  [AUTH_PERMISSION.usersManage]: "Gerenciar usuários",
  [AUTH_PERMISSION.accessRequestsRead]: "Consultar solicitações de acesso",
  [AUTH_PERMISSION.accessRequestsReview]: "Revisar solicitações de acesso",
  [AUTH_PERMISSION.permissionsRead]: "Consultar perfis e permissões",
  [AUTH_PERMISSION.auditRead]: "Consultar auditoria",
  [AUTH_PERMISSION.syncExecute]: "Executar sincronizações",
}

export const permissionsByRole = Object.fromEntries(
  allRoles.map((role) => [role, getRoleFallbackPermissions(role)])
) as Record<UserRole, readonly AuthCapability[]>

const roleRank: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  auditor: 3,
  manager: 2,
  operator: 1,
}

export function isUserRole(value: unknown): value is UserRole {
  return allRoles.includes(value as UserRole)
}

export function isGlobalRole(value: unknown) {
  return (
    value === AUTH_ROLE_KEY.owner ||
    value === AUTH_ROLE_KEY.admin ||
    value === AUTH_ROLE_KEY.auditor
  )
}

export function requiresSingleUnit(value: unknown) {
  return isUserRole(value) && unitScopedRoles.has(value)
}

export function hasCapability(role: UserRole, capability: AuthCapability) {
  const permissions = permissionsByRole[role] ?? []

  return (
    permissions.includes(AUTH_PERMISSION_WILDCARD) ||
    permissions.includes(capability)
  )
}

export function hasAllCapabilities(
  role: UserRole,
  capabilities: readonly AuthCapability[]
) {
  return capabilities.every((capability) => hasCapability(role, capability))
}

export function hasAnyCapability(
  role: UserRole,
  capabilities: readonly AuthCapability[]
) {
  return capabilities.length === 0 || capabilities.some((capability) => {
    return hasCapability(role, capability)
  })
}

export function hasAllPermissions(
  grantedPermissions: readonly AuthPermission[],
  requiredPermissions: readonly AuthPermission[]
) {
  return requiredPermissions.every((permission) => {
    return (
      grantedPermissions.includes(AUTH_PERMISSION_WILDCARD) ||
      grantedPermissions.includes(permission)
    )
  })
}

export function hasAnyPermission(
  grantedPermissions: readonly AuthPermission[],
  requiredPermissions: readonly AuthPermission[]
) {
  return (
    requiredPermissions.length === 0 ||
    requiredPermissions.some((permission) => {
      return (
        grantedPermissions.includes(AUTH_PERMISSION_WILDCARD) ||
        grantedPermissions.includes(permission)
      )
    })
  )
}

export function isRoleSuperior(candidate: UserRole, target: UserRole) {
  return roleRank[candidate] > roleRank[target]
}

export function canManageRole(managerRole: UserRole, targetRole: UserRole) {
  if (managerRole === targetRole) {
    return false
  }

  if (managerRole === AUTH_ROLE_KEY.owner) {
    return true
  }

  return isRoleSuperior(managerRole, targetRole)
}

export function getAssignableRoles(managerRole: UserRole): UserRole[] {
  return allRoles.filter((role) => canManageRole(managerRole, role))
}
