import { type AuthCapability, type UserRole } from "@/features/auth"

export const permissionGroupValues = [
  "audit",
  "commercial",
  "security",
  "clients",
  "vehicles",
  "units",
  "users",
  "profile",
  "sessions",
  "passkeys",
] as const

export type PermissionGroup = (typeof permissionGroupValues)[number]

export const permissionGroupLabels: Record<PermissionGroup, string> = {
  audit: "Auditoria",
  commercial: "Comercial",
  security: "Segurança",
  clients: "Clientes",
  vehicles: "Veículos",
  units: "Unidades",
  users: "Usuários",
  profile: "Perfil",
  sessions: "Sessões",
  passkeys: "Passkeys",
}

/**
 * A single row of the role × capability matrix, derived from the live RBAC
 * policy so the screen is always an accurate reflection of what each role can
 * actually do.
 */
export interface PermissionMatrixRow {
  capability: AuthCapability
  label: string
  group: PermissionGroup
  groupLabel: string
  /** Roles that currently hold this capability. */
  roles: UserRole[]
  roleLabels: string
  roleCount: number
}
