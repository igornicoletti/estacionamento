export const permissionRoleValues = [
  "owner",
  "admin",
  "auditor",
  "manager",
  "operator",
] as const

export type PermissionRole = (typeof permissionRoleValues)[number]

export const permissionSourceValues = ["system", "custom"] as const

export type PermissionSource = (typeof permissionSourceValues)[number]

export const permissionAccessFilterValues = [
  "with_access",
  "without_access",
] as const

export type PermissionAccessFilter = (typeof permissionAccessFilterValues)[number]

export type PermissionRoleAccess = Record<PermissionRole, boolean>

export interface PermissionMatrixRow {
  id: string
  key: string
  label: string
  description: string | null
  groupKey: string
  groupLabel: string
  source: PermissionSource
  isCritical: boolean
  roles: PermissionRole[]
  accessFilters: PermissionAccessFilter[]
  roleAccess: PermissionRoleAccess
  roleLabels: string
  roleCount: number
}

export interface PermissionMatrixResponse {
  permissions: PermissionMatrixRow[]
}

export interface RawPermissionGroupRow {
  id: string
  key: string
  label: string
}

export interface RawPermissionRow {
  id: string
  key: string
  label: string
  description: string | null
  source: PermissionSource
  is_critical: boolean
  group_id: string
}

export interface RawRolePermissionRow {
  permission_id: string
  role: PermissionRole
}
