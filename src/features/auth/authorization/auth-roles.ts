export const userRoleValues = [
  "owner",
  "admin",
  "auditor",
  "manager",
  "operator",
] as const

export type UserRole = (typeof userRoleValues)[number]

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gerente",
  operator: "Operador",
  owner: "Proprietário",
}

export const userRoleScopes = {
  global: ["owner", "admin", "auditor"],
  singleUnit: ["manager", "operator"],
} as const satisfies Record<string, readonly UserRole[]>

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    userRoleValues.includes(value as UserRole)
  )
}

export function isGlobalRole(role: UserRole) {
  return (userRoleScopes.global as readonly UserRole[]).includes(role)
}

export function requiresSingleUnit(role: UserRole) {
  return (userRoleScopes.singleUnit as readonly UserRole[]).includes(role)
}
