export const auditScopeValues = ["login", "system"] as const

export type AuditScope = (typeof auditScopeValues)[number]

export const auditScopeLabels: Record<AuditScope, string> = {
  login: "Login",
  system: "Sistema",
}

export const auditSeverityValues = ["info", "warning", "critical"] as const

export type AuditSeverity = (typeof auditSeverityValues)[number]

export const auditSeverityLabels: Record<AuditSeverity, string> = {
  info: "Informativo",
  warning: "Atenção",
  critical: "Crítico",
}

export const auditEventLabels: Readonly<Record<string, string>> = {
  account_locked: "Conta bloqueada",
  access_recovery_requested: "Recuperação de acesso solicitada",
  access_recovery_reviewed: "Recuperação de acesso revisada",
  admin_user_action_denied: "Ação administrativa negada",
  "client.synced": "Clientes sincronizados",
  login_failed: "Falha de login",
  login_passkey_success: "Login com passkey",
  login_success: "Login realizado",
  phone_change_requested: "Solicitação de alteração de telefone",
  commercial_rule_version_created: "Versão de regra comercial criada",
  commercial_rule_version_updated: "Versão de regra comercial atualizada",
  price_table_version_created: "Versão de tabela de preços criada",
  price_table_version_updated: "Versão de tabela de preços atualizada",
  passkey_registered: "Passkey registrada",
  passkey_reset_requested: "Redefinição de passkey solicitada",
  password_changed: "Senha alterada",
  password_reset_requested: "Redefinição de senha solicitada",
  price_table_created: "Tabela de preço criada",
  price_table_updated: "Tabela de preço atualizada",
  profile_updated: "Perfil atualizado",
  rule_created: "Regra criada",
  rule_updated: "Regra atualizada",
  sessions_revoked: "Sessões revogadas",
  temporary_lock_cleared: "Bloqueio temporário removido",
  "unit.synced": "Unidades sincronizadas",
  user_blocked: "Usuário bloqueado",
  user_created: "Usuário criado",
  user_updated: "Usuário atualizado",
}
