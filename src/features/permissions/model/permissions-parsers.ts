import { permissionsCopy } from "../constants"
import {
  createPermissionRoleAccess,
  formatPermissionRoles,
  isPermissionRole,
  isPermissionSource,
  normalizePermissionMatrixRow,
} from "./permissions-rules"
import {
  type PermissionMatrixResponse,
  type PermissionMatrixRow,
  type PermissionRole,
} from "./permissions-types"

type UnknownRecord = Record<PropertyKey, unknown>

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

export function parsePermissionMatrixResponse(
  value: unknown
): PermissionMatrixResponse {
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
