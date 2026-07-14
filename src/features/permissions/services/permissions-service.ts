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

function parseRawPermissionGroup(value: unknown): RawPermissionGroupRow | null {
  if (!isRecord(value)) {
    return null
  }

  const id = readString(value.id)
  const key = readString(value.key)
  const label = readString(value.label)

  return id && key && label ? { id, key, label } : null
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

  if (!id || !key || !label || !groupId || isCritical === null || !source) {
    return null
  }

  return {
    description: readNullableString(value.description),
    group_id: groupId,
    id,
    is_critical: isCritical,
    key,
    label,
    source,
  }
}

function parseRawRolePermission(value: unknown): RawRolePermissionRow | null {
  if (!isRecord(value)) {
    return null
  }

  const permissionId = readString(value.permission_id)
  const role = isPermissionRole(value.role) ? value.role : null

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

  return permissions.flatMap((permission) => {
    const group = groupById.get(permission.group_id)

    if (!group) {
      return []
    }

    const roles = permissionRoleValues.filter((role) =>
      rolesByPermissionId.get(permission.id)?.has(role)
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

async function listPermissionMatrixDirect(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>
) {
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
    throw new Error(permissionsCopy.error.load, {
      cause: groupsResponse.error ?? permissionsResponse.error ?? rolesResponse.error,
    })
  }

  const groups = (groupsResponse.data ?? []).map(parseRawPermissionGroup)
  const permissions = (permissionsResponse.data ?? []).map(parseRawPermission)
  const rolePermissions = (rolesResponse.data ?? []).map(parseRawRolePermission)

  if (
    groups.some((group) => group === null) ||
    permissions.some((permission) => permission === null) ||
    rolePermissions.some((rolePermission) => rolePermission === null)
  ) {
    throw new Error(permissionsCopy.error.invalidResponse)
  }

  return buildPermissionMatrixFromRows({
    groups: groups.filter((group): group is RawPermissionGroupRow => Boolean(group)),
    permissions: permissions.filter(
      (permission): permission is RawPermissionRow => Boolean(permission)
    ),
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
