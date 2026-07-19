import {
  type PermissionAccessFilter,
  type PermissionRole,
  type PermissionSource,
} from "../model"

export const permissionRoleLabels: Record<PermissionRole, string> = {
  admin: "Administrador",
  auditor: "Auditor",
  manager: "Gestor",
  operator: "Operador",
  owner: "Proprietário",
}

export const permissionSourceLabels: Record<PermissionSource, string> = {
  custom: "Customizada",
  system: "Sistema",
}

export const permissionAccessFilterLabels: Record<PermissionAccessFilter, string> = {
  with_access: "Com acesso",
  without_access: "Sem acesso",
}

export const permissionGroupLabels: Record<string, string> = {
  access: "Solicitações de acesso",
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

export const permissionActionLabels: Record<string, string> = {
  approve: "Aprovar",
  create: "Cadastrar",
  delete: "Excluir",
  export: "Exportar",
  list: "Consultar",
  manage: "Gerenciar",
  read: "Consultar",
  reject: "Rejeitar",
  review: "Revisar",
  update: "Atualizar",
  write: "Editar",
}

export const permissionObjectLabels: Record<string, string> = {
  all: "todos os registros",
  matrix: "matriz",
  own: "próprios dados",
  self: "próprio perfil",
}
