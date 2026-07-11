import { getSupabaseBrowserClient } from "@/lib"

import { permissionsCopy } from "../content/permissions-copy"
import {
  permissionRoleValues,
  permissionSourceValues,
  type PermissionMatrixRow,
  type PermissionRole,
  type PermissionSource,
} from "../types/permissions-types"
import {
  createEmptyRoleAccess,
  formatPermissionRoles,
  normalizePermissionMatrixRow,
} from "../utils/permissions-model"

interface PermissionMatrixResponse {
  permissions: PermissionMatrixRow[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null
}

function isPermissionSource(value: unknown): value is PermissionSource {
  return permissionSourceValues.includes(value as PermissionSource)
}

function normalizeRoles(value: unknown): PermissionRole[] {
  if (!Array.isArray(value)) {
    return []
  }

  const roles = new Set<PermissionRole>()

  for (const role of value) {
    if (permissionRoleValues.includes(role as PermissionRole)) {
      roles.add(role as PermissionRole)
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

  if (!id || !key || !label || !groupKey || !groupLabel || !source || isCritical === null) {
    return null
  }

  const roles = normalizeRoles(value.roles)
  const roleAccess = createEmptyRoleAccess()

  for (const role of roles) {
    roleAccess[role] = true
  }

  return normalizePermissionMatrixRow({
    description: readString(value.description),
    groupKey,
    groupLabel,
    id,
    accessFilters: [],
    isCritical,
    key,
    label,
    roleAccess,
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

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(permissionsCopy.error.unavailable)
  }

  const matrixResponse = await supabase.functions.invoke("list-permission-matrix", {
    body: {},
  })

  if (matrixResponse.error) {
    throw new Error(permissionsCopy.error.load, { cause: matrixResponse.error })
  }

  return parsePermissionMatrixResponse(matrixResponse.data).permissions
}
