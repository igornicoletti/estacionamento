export const permissionRoleValues = [
  "owner",
  "admin",
  "auditor",
  "manager",
  "operator",
] as const

export type PermissionRole = (typeof permissionRoleValues)[number]

export const permissionRoleLabels: Record<PermissionRole, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gestor",
  operator: "Operador",
  owner: "Proprietário",
}

export const permissionSourceValues = ["system", "custom"] as const

export type PermissionSource = (typeof permissionSourceValues)[number]

export const permissionSourceLabels: Record<PermissionSource, string> = {
  custom: "Customizada",
  system: "Sistema",
}

export const permissionAccessFilterValues = [
  "with_access",
  "without_access",
] as const

export type PermissionAccessFilter = (typeof permissionAccessFilterValues)[number]

export const permissionAccessFilterLabels: Record<PermissionAccessFilter, string> = {
  with_access: "Com acesso",
  without_access: "Sem acesso",
}

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
