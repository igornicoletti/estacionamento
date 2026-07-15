import {
  actorHasPermission,
  authError,
  createAdminClient,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
} from "../_shared/index.ts"

const permissionRoles = ["owner", "admin", "auditor", "manager", "operator"] as const

type PermissionRole = (typeof permissionRoles)[number]
type PermissionSource = "system" | "custom"

interface PermissionGroupRow {
  id: string
  key: string
  label: string
}

interface PermissionRow {
  id: string
  key: string
  label: string
  description: string | null
  source: PermissionSource
  is_critical: boolean
  group_id: string
}

interface RolePermissionRow {
  permission_id: string
  role: PermissionRole
}

const permissionGroupLabels: Record<string, string> = {
  access_requests: "Solicitações de acesso",
  audit: "Auditoria",
  client_vehicles: "Veículos de clientes",
  clients: "Clientes",
  notifications: "Notificações",
  permissions: "Permissões",
  prices: "Preços",
  profile: "Perfil",
  rules: "Regras",
  settings: "Configurações",
  sync: "Sincronização",
  system: "Sistema",
  units: "Unidades",
  users: "Usuários",
}

const criticalPermissionPrefixes = new Set([
  "access_requests",
  "audit",
  "permissions",
  "sync",
  "users",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isPermissionRole(value: unknown): value is PermissionRole {
  return permissionRoles.some((role) => role === value)
}

function parsePermission(value: unknown): PermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const key = typeof value.key === "string" ? value.key : ""
  const groupKey = resolvePermissionGroupKey(key)

  return key &&
    typeof value.label === "string" &&
    (typeof value.description === "string" || value.description === null)
    ? {
        description: value.description,
        group_id: groupKey,
        id: key,
        is_critical: isCriticalPermission(key),
        key,
        label: value.label,
        source: "system",
      }
    : null
}

function parseRolePermission(value: unknown): RolePermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const permissionKey = value.permission_key
  const roleKey = value.role_key

  return typeof permissionKey === "string" && isPermissionRole(roleKey)
    ? { permission_id: permissionKey, role: roleKey }
    : null
}

function createEmptyRoleAccess(): Record<PermissionRole, boolean> {
  return {
    admin: false,
    auditor: false,
    manager: false,
    operator: false,
    owner: false,
  }
}

function resolvePermissionGroupKey(permissionKey: string) {
  if (permissionKey === "*") {
    return "system"
  }

  return permissionKey.split(".")[0] || "system"
}

function resolvePermissionGroup(permissionKey: string): PermissionGroupRow {
  const groupKey = resolvePermissionGroupKey(permissionKey)

  return {
    id: groupKey,
    key: groupKey,
    label: permissionGroupLabels[groupKey] ?? groupKey,
  }
}

function isCriticalPermission(permissionKey: string) {
  return permissionKey === "*" || criticalPermissionPrefixes.has(resolvePermissionGroupKey(permissionKey))
}

Deno.serve(async (req) => {
  const cors = handleCors(req)

  if (cors) {
    return cors
  }

  if (req.method !== "POST") {
    return authError("method_not_allowed", 405, req)
  }

  try {
    const actor = await getAuthenticatedActor(req)
    const supabase = createAdminClient()

    if (!actor || actor.status !== "active") {
      return authError("unauthorized", 401, req)
    }

    if (!(await actorHasPermission(actor, "permissions.read", supabase))) {
      return authError("forbidden", 403, req)
    }

    const [permissionsResponse, rolesResponse] = await Promise.all([
      supabase
        .from("app_permissions")
        .select("key, label, description")
        .order("label", { ascending: true }),
      supabase
        .from("app_role_permissions")
        .select("permission_key, role_key"),
    ])

    if (permissionsResponse.error || rolesResponse.error) {
      console.error("permission_matrix_query_failed", {
        permissions: permissionsResponse.error?.message,
        roles: rolesResponse.error?.message,
      })
      return authError("dependency_unavailable", 503, req)
    }

    const permissions = (permissionsResponse.data ?? []).map(parsePermission)
    const rolePermissions = (rolesResponse.data ?? []).map(parseRolePermission)

    if (
      permissions.some((permission) => permission === null) ||
      rolePermissions.some((rolePermission) => rolePermission === null)
    ) {
      console.error("permission_matrix_invalid_response")
      return authError("invalid_response", 502, req)
    }

    const groupById = new Map<string, PermissionGroupRow>()

    for (const permission of permissions.filter(
      (item): item is PermissionRow => Boolean(item)
    )) {
      groupById.set(permission.group_id, resolvePermissionGroup(permission.key))
    }

    const rolesByPermissionId = new Map<string, Set<PermissionRole>>()

    for (const rolePermission of rolePermissions.filter(
      (item): item is RolePermissionRow => Boolean(item)
    )) {
      const roles = rolesByPermissionId.get(rolePermission.permission_id) ?? new Set<PermissionRole>()
      roles.add(rolePermission.role)
      rolesByPermissionId.set(rolePermission.permission_id, roles)
    }

    const matrix = permissions
      .filter((permission): permission is PermissionRow => Boolean(permission))
      .flatMap((permission) => {
        const group = groupById.get(permission.group_id)

        if (!group) {
          return []
        }

        const wildcardRoles = rolesByPermissionId.get("*") ?? new Set<PermissionRole>()
        const roles = permissionRoles.filter((role) =>
          rolesByPermissionId.get(permission.id)?.has(role) || wildcardRoles.has(role)
        )
        const roleAccess = createEmptyRoleAccess()

        for (const role of roles) {
          roleAccess[role] = true
        }

        return [{
          description: permission.description,
          groupKey: group.key,
          groupLabel: group.label,
          id: permission.id,
          isCritical: permission.is_critical,
          key: permission.key,
          label: permission.label,
          roleAccess,
          roleCount: roles.length,
          roleLabels: "",
          roles,
          source: permission.source,
        }]
      })

    return jsonResponse({ ok: true, permissions: matrix }, 200, req)
  } catch (error) {
    console.error("permission_matrix_request_failed", error)
    return authError("request_failed", 400, req)
  }
})
