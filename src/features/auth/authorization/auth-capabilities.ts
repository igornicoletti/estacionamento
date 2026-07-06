export const authCapabilities = [
  "audit.read",

  "commercial.prices.read",
  "commercial.rules.read",

  "security.permissions.read",

  "admin.clients.read",
  "admin.clients.manage",

  "admin.vehicles.read",
  "admin.vehicles.manage",

  "admin.units.read",
  "admin.units.manage",

  "admin.users.read",
  "admin.users.create",
  "admin.users.update",
  "admin.users.disable",
  "admin.users.resetAccess",

  "profile.readSelf",
  "profile.updateSelf",

  "sessions.readSelf",
  "sessions.revokeSelf",

  "passkeys.readSelf",
  "passkeys.manageSelf",
] as const

export type AuthCapability = (typeof authCapabilities)[number]

export const authCapabilityLabels: Record<AuthCapability, string> = {
  "audit.read": "Visualizar auditoria",

  "commercial.prices.read": "Visualizar preços",
  "commercial.rules.read": "Visualizar regras",

  "security.permissions.read": "Visualizar perfis e permissões",

  "admin.clients.read": "Visualizar cadastros de clientes",
  "admin.clients.manage": "Gerenciar cadastros de clientes",

  "admin.vehicles.read": "Visualizar cadastros de veículos",
  "admin.vehicles.manage": "Gerenciar cadastros de veículos",

  "admin.units.read": "Visualizar cadastros de unidades",
  "admin.units.manage": "Gerenciar cadastros de unidades",

  "admin.users.read": "Visualizar usuários",
  "admin.users.create": "Criar usuários",
  "admin.users.update": "Atualizar usuários",
  "admin.users.disable": "Desativar usuários",
  "admin.users.resetAccess": "Redefinir acesso de usuários",

  "profile.readSelf": "Visualizar próprio perfil",
  "profile.updateSelf": "Atualizar próprio perfil",

  "sessions.readSelf": "Visualizar próprias sessões",
  "sessions.revokeSelf": "Revogar próprias sessões",

  "passkeys.readSelf": "Visualizar próprias passkeys",
  "passkeys.manageSelf": "Gerenciar próprias passkeys",
}

export function isAuthCapability(value: unknown): value is AuthCapability {
  return (
    typeof value === "string" &&
    authCapabilities.includes(value as AuthCapability)
  )
}
