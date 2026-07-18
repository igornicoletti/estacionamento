export const auditEventLabels: Record<string, string> = {
  account_locked: "Conta bloqueada",
  admin_user_action_denied: "Ação administrativa negada",
  access_recovery_requested: "Recuperação de acesso solicitada",
  access_recovery_reviewed: "Recuperação de acesso revisada",
  client_synced: "Clientes sincronizados",
  login_failed: "Falha de login",
  login_success: "Login realizado",
  login_passkey_success: "Login com passkey",
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
  unit_synced: "Unidades sincronizadas",
  user_blocked: "Usuário bloqueado",
  user_created: "Usuário criado",
  user_updated: "Usuário atualizado",
}

export function humanizeAuditIdentifier(value: string) {
  const humanized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")

  if (!humanized) {
    return ""
  }

  return humanized.charAt(0).toLocaleUpperCase("pt-BR") + humanized.slice(1)
}

export function getAuditEventLabel(event: string): string {
  const mappedLabel = auditEventLabels[event]

  if (mappedLabel) {
    return mappedLabel
  }

  return humanizeAuditIdentifier(event) || event
}
