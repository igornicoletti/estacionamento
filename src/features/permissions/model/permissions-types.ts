import { type AuthRoleKey } from "@/features/auth/contracts"

export type PermissionRoleKey = AuthRoleKey

export interface PermissionRole {
  key: PermissionRoleKey
  label: string
}

export interface Permission {
  key: string
  label: string
  description: string | null
  roleKeys: PermissionRoleKey[]
}

export interface PermissionMatrix {
  permissions: Permission[]
  roles: PermissionRole[]
}

export interface PermissionTableRow extends Permission {
  groupKey: string
  groupLabel: string
  roleCount: number
}
