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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isPermissionSource(value: unknown): value is PermissionSource {
  return value === "system" || value === "custom"
}

function isPermissionRole(value: unknown): value is PermissionRole {
  return permissionRoles.some((role) => role === value)
}

function parsePermissionGroup(value: unknown): PermissionGroupRow | null {
  if (!isRecord(value)) {
    return null
  }

  return typeof value.id === "string" &&
    typeof value.key === "string" &&
    typeof value.label === "string"
    ? { id: value.id, key: value.key, label: value.label }
    : null
}

function parsePermission(value: unknown): PermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  return typeof value.id === "string" &&
    typeof value.key === "string" &&
    typeof value.label === "string" &&
    typeof value.group_id === "string" &&
    typeof value.is_critical === "boolean" &&
    isPermissionSource(value.source) &&
    (typeof value.description === "string" || value.description === null)
    ? {
        description: value.description,
        group_id: value.group_id,
        id: value.id,
        is_critical: value.is_critical,
        key: value.key,
        label: value.label,
        source: value.source,
      }
    : null
}

function parseRolePermission(value: unknown): RolePermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  return typeof value.permission_id === "string" && isPermissionRole(value.role)
    ? { permission_id: value.permission_id, role: value.role }
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

    const [groupsResponse, permissionsResponse, rolesResponse] = await Promise.all([
      supabase
        .from("permission_groups")
        .select("id, key, label")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true }),
      supabase
        .from("permissions")
        .select("id, key, label, description, source, is_critical, group_id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true }),
      supabase
        .from("role_permissions")
        .select("permission_id, role"),
    ])

    if (groupsResponse.error || permissionsResponse.error || rolesResponse.error) {
      console.error("permission_matrix_query_failed", {
        groups: groupsResponse.error?.message,
        permissions: permissionsResponse.error?.message,
        roles: rolesResponse.error?.message,
      })
      return authError("dependency_unavailable", 503, req)
    }

    const groups = (groupsResponse.data ?? []).map(parsePermissionGroup)
    const permissions = (permissionsResponse.data ?? []).map(parsePermission)
    const rolePermissions = (rolesResponse.data ?? []).map(parseRolePermission)

    if (
      groups.some((group) => group === null) ||
      permissions.some((permission) => permission === null) ||
      rolePermissions.some((rolePermission) => rolePermission === null)
    ) {
      console.error("permission_matrix_invalid_response")
      return authError("invalid_response", 502, req)
    }

    const groupById = new Map(
      groups
        .filter((group): group is PermissionGroupRow => Boolean(group))
        .map((group) => [group.id, group])
    )
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

        const roles = permissionRoles.filter((role) =>
          rolesByPermissionId.get(permission.id)?.has(role)
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
