import { getSupabaseBrowserClient } from "@/lib"

import { permissionsCopy } from "../permissions-copy"
import {
  type PermissionMatrixRow,
  type PermissionRole,
  type PermissionSource,
  permissionRoleValues,
} from "../types/permissions-types"
import {
  createPermissionRoleAccess,
  formatPermissionRoles,
  isPermissionRole,
  isPermissionSource,
  normalizePermissionMatrixRow,
} from "../utils/permissions-model"

type UnknownRecord = Record<PropertyKey, unknown>

interface PermissionMatrixResponse {
  permissions: PermissionMatrixRow[]
}

interface RawPermissionGroupRow {
  id: string
  key: string
  label: string
}

interface RawPermissionRow {
  id: string
  key: string
  label: string
  description: string | null
  source: PermissionSource
  is_critical: boolean
  group_id: string
}

interface RawRolePermissionRow {
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

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null
}

function normalizeRoles(value: unknown): PermissionRole[] {
  if (!Array.isArray(value)) {
    return []
  }

  const roles = new Set<PermissionRole>()

  for (const role of value) {
    if (isPermissionRole(role)) {
      roles.add(role)
    }
  }

  return Array.from(roles)
}

function parsePermissionMatrixRow(value: unknown): PermissionMatrixRow | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const key = readString(value.key)
  const label = readString(value.label)
  const groupKey = readString(value.groupKey)
  const groupLabel = readString(value.groupLabel)
  const source = isPermissionSource(value.source) ? value.source : null
  const isCritical = readBoolean(value.isCritical)

  if (
    !id ||
    !key ||
    !label ||
    !groupKey ||
    !groupLabel ||
    !source ||
    isCritical === null
  ) {
    return null
  }

  const roles = normalizeRoles(value.roles)

  return normalizePermissionMatrixRow({
    accessFilters: [],
    description: readNullableString(value.description),
    groupKey,
    groupLabel,
    id,
    isCritical,
    key,
    label,
    roleAccess: createPermissionRoleAccess(roles),
    roleCount: roles.length,
    roleLabels: formatPermissionRoles(roles),
    roles,
    source,
  })
}

function parsePermissionMatrixResponse(value: unknown): PermissionMatrixResponse {
  if (!isRecord(value) || !Array.isArray(value.permissions)) {
    throw new Error(permissionsCopy.error.invalidResponse)
  }

  const permissions = value.permissions.map(parsePermissionMatrixRow)

  if (permissions.some((permission) => permission === null)) {
    throw new Error(permissionsCopy.error.invalidResponse)
  }

  return {
    permissions: permissions.filter(
      (permission): permission is PermissionMatrixRow => Boolean(permission)
    ),
  }
}

function resolvePermissionGroupKey(permissionKey: string) {
  if (permissionKey === "*") {
    return "system"
  }

  return permissionKey.split(".")[0] || "system"
}

function resolvePermissionGroup(permissionKey: string): RawPermissionGroupRow {
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

function parseRawPermission(value: unknown): RawPermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const key = readString(value.key)
  const label = readString(value.label)
  const groupId = readString(value.group_id)
  const isCritical = readBoolean(value.is_critical)
  const source = isPermissionSource(value.source) ? value.source : null

  if (!key || !label) {
    return null
  }

  return {
    description: readNullableString(value.description),
    group_id: groupId ?? resolvePermissionGroupKey(key),
    id: id ?? key,
    is_critical: isCritical ?? isCriticalPermission(key),
    key,
    label,
    source: source ?? "system",
  }
}

function parseRawRolePermission(value: unknown): RawRolePermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const permissionId = readString(value.permission_id) ?? readString(value.permission_key)
  const rawRole = value.role ?? value.role_key
  const role = isPermissionRole(rawRole) ? rawRole : null

  if (!permissionId || !role) {
    return null
  }

  return {
    permission_id: permissionId,
    role,
  }
}

function buildPermissionMatrixFromRows({
  groups,
  permissions,
  rolePermissions,
}: {
  groups: readonly RawPermissionGroupRow[]
  permissions: readonly RawPermissionRow[]
  rolePermissions: readonly RawRolePermissionRow[]
}) {
  const groupById = new Map(groups.map((group) => [group.id, group]))
  const rolesByPermissionId = new Map<string, Set<PermissionRole>>()

  for (const rolePermission of rolePermissions) {
    const roles =
      rolesByPermissionId.get(rolePermission.permission_id) ??
      new Set<PermissionRole>()

    roles.add(rolePermission.role)
    rolesByPermissionId.set(rolePermission.permission_id, roles)
  }

  const wildcardRoles = rolesByPermissionId.get("*") ?? new Set<PermissionRole>()

  return permissions.flatMap((permission) => {
    const group = groupById.get(permission.group_id)

    if (!group) {
      return []
    }

    const roles = permissionRoleValues.filter((role) =>
      rolesByPermissionId.get(permission.id)?.has(role) || wildcardRoles.has(role)
    )

    return [
      normalizePermissionMatrixRow({
        accessFilters: [],
        description: permission.description,
        groupKey: group.key,
        groupLabel: group.label,
        id: permission.id,
        isCritical: permission.is_critical,
        key: permission.key,
        label: permission.label,
        roleAccess: createPermissionRoleAccess(roles),
        roleCount: roles.length,
        roleLabels: formatPermissionRoles(roles),
        roles,
        source: permission.source,
      }),
    ]
  })
}

function buildPermissionGroupsFromRows(permissions: readonly RawPermissionRow[]) {
  return Array.from(
    new Map(
      permissions.map((permission) => {
        const group = resolvePermissionGroup(permission.key)
        return [group.id, group]
      })
    ).values()
  )
}

async function listPermissionMatrixDirect(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>
) {
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
    throw new Error(permissionsCopy.error.load, {
      cause: permissionsResponse.error ?? rolesResponse.error,
    })
  }

  const permissions = (permissionsResponse.data ?? []).map(parseRawPermission)
  const rolePermissions = (rolesResponse.data ?? []).map(parseRawRolePermission)

  if (
    permissions.some((permission) => permission === null) ||
    rolePermissions.some((rolePermission) => rolePermission === null)
  ) {
    throw new Error(permissionsCopy.error.invalidResponse)
  }

  const validPermissions = permissions.filter(
    (permission): permission is RawPermissionRow => Boolean(permission)
  )

  return buildPermissionMatrixFromRows({
    groups: buildPermissionGroupsFromRows(validPermissions),
    permissions: validPermissions,
    rolePermissions: rolePermissions.filter(
      (rolePermission): rolePermission is RawRolePermissionRow =>
        Boolean(rolePermission)
    ),
  })
}

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(permissionsCopy.error.unavailable)
  }

  try {
    const matrixResponse = await supabase.functions.invoke("list-permission-matrix", {
      body: {},
    })

    if (matrixResponse.error) {
      throw new Error(permissionsCopy.error.load, { cause: matrixResponse.error })
    }

    return parsePermissionMatrixResponse(matrixResponse.data).permissions
  } catch (error) {
    try {
      return await listPermissionMatrixDirect(supabase)
    } catch {
      throw error instanceof Error
        ? error
        : new Error(permissionsCopy.error.load, { cause: error })
    }
  }
}
