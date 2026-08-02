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
  client_synced: "Clientes sincronizados",
  commercial_rule_version_created: "Versão de regra comercial criada",
  commercial_rule_version_updated: "Versão de regra comercial atualizada",
  login_failed: "Falha de login",
  login_passkey_success: "Login com passkey",
  login_success: "Login realizado",
  mfa_enabled: "Autenticação de dois fatores ativada",
  passkey_registered: "Passkey registrada",
  passkey_reset_requested: "Redefinição de passkey solicitada",
  passkeys_removed: "Passkeys removidas",
  password_changed: "Senha alterada",
  password_reset_requested: "Redefinição de senha solicitada",
  phone_change_requested: "Solicitação de alteração de telefone",
  phone_change_reviewed: "Solicitação de alteração de telefone revisada",
  price_table_created: "Tabela de preço criada",
  price_table_updated: "Tabela de preço atualizada",
  price_table_version_created: "Versão de tabela de preços criada",
  price_table_version_updated: "Versão de tabela de preços atualizada",
  profile_updated: "Perfil atualizado",
  security_device_trusted: "Dispositivo marcado como confiável",
  security_logins_reviewed: "Logins recentes revisados",
  rule_created: "Regra criada",
  rule_updated: "Regra atualizada",
  sessions_revoked: "Sessões revogadas",
  temporary_lock_cleared: "Bloqueio temporário removido",
  "unit.yard_updated": "Configuração do pátio da unidade atualizada",
  unit_synced: "Unidades sincronizadas",
  user_blocked: "Usuário bloqueado",
  user_created: "Usuário criado",
  user_unblocked: "Usuário desbloqueado",
  user_updated: "Usuário atualizado",

  // Compatibilidade de leitura para eventos históricos já persistidos.
  "client.synced": "Clientes sincronizados",
  client_sync: "Sincronização de clientes",
  "unit.synced": "Unidades sincronizadas",
  unit_sync: "Sincronização de unidades",
}
