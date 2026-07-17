export const AUTH_STATUS = {
  active: "active",
  pending: "pending",
  inactive: "inactive",
  passwordReset: "password_reset",
  passkeyReset: "passkey_reset",
} as const

export const AUTH_NEXT_ACTION = {
  authenticated: "authenticated",
  setNewPassword: "set_new_password",
  registerPasskey: "register_passkey",
  usePasskey: "use_passkey",
} as const

export const AUTH_FUNCTIONS = {
  password: "auth-password",
  passkeyLogin: "auth-passkey-login",
  registerPasskey: "auth-register-passkey",
  recovery: "auth-recovery-request",
} as const

export const AUTH_STORAGE_KEYS = {
  inactivityExpired: "rmc.auth.inactivity-expired",
} as const

export const AUTH_INACTIVITY = {
  timeoutMs: 45 * 60 * 1000,
  warningMs: 60 * 1000,
  tickMs: 1000,
} as const

export const AUTH_PERMISSION_WILDCARD = "*"

export const AUTH_PERMISSION = {
  all: AUTH_PERMISSION_WILDCARD,
  profileReadSelf: "profile.read_self",
  settingsReadSelf: "settings.read_self",
  notificationsRead: "notifications.read",
  unitsRead: "units.read",
  clientsRead: "clients.read",
  clientVehiclesRead: "client_vehicles.read",
  pricesRead: "prices.read",
  pricesManage: "prices.manage",
  rulesRead: "rules.read",
  rulesManage: "rules.manage",
  usersRead: "users.read",
  usersManage: "users.manage",
  accessRequestsRead: "access_requests.read",
  accessRequestsReview: "access_requests.review",
  permissionsRead: "permissions.read",
  auditRead: "audit.read",
  syncExecute: "sync.execute",
} as const

export const AUTH_ROLE_KEY = {
  owner: "owner",
  admin: "admin",
  auditor: "auditor",
  manager: "manager",
  operator: "operator",
} as const

export type AuthStatus = (typeof AUTH_STATUS)[keyof typeof AUTH_STATUS]
export type AuthNextAction = (typeof AUTH_NEXT_ACTION)[keyof typeof AUTH_NEXT_ACTION]
export type AuthRoleKey = (typeof AUTH_ROLE_KEY)[keyof typeof AUTH_ROLE_KEY]
export type AuthPermission = (typeof AUTH_PERMISSION)[keyof typeof AUTH_PERMISSION]

const knownAuthPermissions = new Set<string>(Object.values(AUTH_PERMISSION))

const operatorPermissions = [
  AUTH_PERMISSION.profileReadSelf,
  AUTH_PERMISSION.settingsReadSelf,
  AUTH_PERMISSION.notificationsRead,
  AUTH_PERMISSION.unitsRead,
  AUTH_PERMISSION.clientsRead,
  AUTH_PERMISSION.clientVehiclesRead,
  AUTH_PERMISSION.pricesRead,
  AUTH_PERMISSION.rulesRead,
] as const

const managerPermissions = [...operatorPermissions, AUTH_PERMISSION.usersRead] as const

const auditorPermissions = [
  ...managerPermissions,
  AUTH_PERMISSION.accessRequestsRead,
  AUTH_PERMISSION.permissionsRead,
  AUTH_PERMISSION.auditRead,
] as const

const adminPermissions = [
  ...auditorPermissions,
  AUTH_PERMISSION.pricesManage,
  AUTH_PERMISSION.rulesManage,
  AUTH_PERMISSION.usersManage,
  AUTH_PERMISSION.accessRequestsReview,
  AUTH_PERMISSION.syncExecute,
] as const

const fallbackPermissionsByRole: Record<AuthRoleKey, readonly AuthPermission[]> = {
  owner: [AUTH_PERMISSION_WILDCARD],
  admin: adminPermissions,
  auditor: auditorPermissions,
  manager: managerPermissions,
  operator: operatorPermissions,
}

export function isAuthStatus(value: unknown): value is AuthStatus {
  return (
    value === AUTH_STATUS.active ||
    value === AUTH_STATUS.pending ||
    value === AUTH_STATUS.inactive ||
    value === AUTH_STATUS.passwordReset ||
    value === AUTH_STATUS.passkeyReset
  )
}

export function normalizeAuthStatus(value: unknown): AuthStatus | null {
  return isAuthStatus(value) ? value : null
}

export function isAuthPermission(value: unknown): value is AuthPermission {
  return typeof value === "string" && knownAuthPermissions.has(value.trim())
}

export function normalizeAuthPermission(value: unknown): AuthPermission | null {
  if (typeof value !== "string") {
    return null
  }

  const permission = value.trim()

  return isAuthPermission(permission) ? permission : null
}

export function normalizeAuthPermissions(value: unknown): readonly AuthPermission[] {
  if (!Array.isArray(value)) {
    return []
  }

  const permissions = new Set<AuthPermission>()

  for (const item of value) {
    const permission = normalizeAuthPermission(item)

    if (permission) {
      permissions.add(permission)
    }
  }

  return Array.from(permissions)
}

export function getRoleFallbackPermissions(
  roleKey: string | null | undefined
): readonly AuthPermission[] {
  if (
    roleKey === AUTH_ROLE_KEY.owner ||
    roleKey === AUTH_ROLE_KEY.admin ||
    roleKey === AUTH_ROLE_KEY.auditor ||
    roleKey === AUTH_ROLE_KEY.manager ||
    roleKey === AUTH_ROLE_KEY.operator
  ) {
    return fallbackPermissionsByRole[roleKey]
  }

  return []
}

export function resolveAuthProfilePermissions({
  permissions,
  roleKey,
}: {
  permissions: unknown
  roleKey: string | null | undefined
}) {
  const resolvedPermissions = normalizeAuthPermissions(permissions)

  if (resolvedPermissions.length > 0) {
    return resolvedPermissions
  }

  return permissions === null || permissions === undefined
    ? getRoleFallbackPermissions(roleKey)
    : []
}

export function canAccessProtectedApp(status: AuthStatus | null | undefined) {
  return status === AUTH_STATUS.active
}

export function requiresAccountRecovery(status: AuthStatus | null | undefined) {
  return status === AUTH_STATUS.passwordReset || status === AUTH_STATUS.passkeyReset
}
