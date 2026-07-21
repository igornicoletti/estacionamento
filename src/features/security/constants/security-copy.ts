import type { SecurityScore } from "../types/security-types"

export const securityCopy = {
  page: {
    title: "Segurança",
    subtitle: "Revise autenticação, contato de recuperação, sessão atual e eventos recentes.",
  },
  empty: {
    title: "Dados de segurança indisponíveis",
    description: "Não foi possível carregar os dados de segurança desta conta.",
    action: "Recarregar",
  },
  error: {
    title: "Falha ao carregar segurança",
    action: "Tentar novamente",
    noticeTitle: "Não foi possível concluir a ação",
  },
  score: {
    title: "Pontuação de segurança",
    completed: (score: SecurityScore) =>
      `${score.completed} de ${score.total} medidas suportadas concluídas`,
    remaining: (score: SecurityScore) =>
      score.remaining === 0
        ? "Todas as medidas suportadas estão concluídas."
        : score.remaining === 1
          ? "Conclua 1 item para chegar à proteção máxima suportada."
          : `Conclua ${score.remaining} itens para chegar à proteção máxima suportada.`,
    labels: {
      destructive: "Crítica",
      info: "Boa",
      success: "Alta",
      warning: "Moderada",
    },
  },
  status: {
    completed: "Concluído",
    actionRequired: "Pendente",
  },
  measures: {
    strongPassword: {
      title: "Senha forte",
      description:
        "Política obrigatória: mínimo 12 caracteres com maiúscula, minúscula, número e símbolo.",
      action: "Alterar senha",
    },
    passkey: {
      title: "Passkey",
      activeDescription: "Existe ao menos uma passkey associada à sua conta.",
      inactiveDescription: "Nenhuma passkey ativa foi identificada para esta conta.",
      addAction: "Cadastrar passkey",
      rotateAction: "Gerar nova passkey",
      activating: "Gerando passkey...",
      dialogTitle: "Passkey gerada",
      dialogDescription: "A passkey foi salva no gerenciador de credenciais do dispositivo.",
      dialogClose: "Entendi",
      name: "Nome da credencial",
      createdAt: "Criada em",
    },
    recoveryContact: {
      title: "Contato de recuperação",
      configuredDescription: "Telefone de recuperação cadastrado para suporte administrativo.",
      missingDescription: "Cadastre um telefone no perfil para apoiar solicitações de recuperação.",
      updateAction: "Atualizar contato",
    },
  },
  events: {
    title: "Eventos recentes de segurança",
    description: "Notificações de segurança entregues ao seu usuário.",
    viewAll: "Ver todas",
    loading: "Carregando eventos de segurança...",
    emptyTitle: "Sem eventos recentes",
    emptyDescription: "Quando houver uma atualização de segurança, ela aparecerá aqui.",
    error: "Não foi possível carregar os eventos recentes.",
  },
  session: {
    title: "Sessão atual",
    description: "Dados disponíveis da sessão autenticada neste navegador.",
    browser: "Navegador",
    operatingSystem: "Sistema operacional",
    ip: "IP",
    authenticatedAt: "Última autenticação",
    unavailable: "Não informado",
  },
  permissions: {
    title: "Permissões efetivas",
    description: "Permissões recebidas pelo perfil ativo nesta sessão.",
    wildcard: "Acesso total",
    none: "Nenhuma permissão explícita vinculada à sessão.",
    count: (count: number) => (count === 1 ? "1 permissão ativa" : `${count} permissões ativas`),
  },
  passwordDialog: {
    title: "Alterar senha",
    description: "Informe a senha atual e defina uma nova senha de acesso.",
    currentLabel: "Senha atual",
    newLabel: "Nova senha",
    confirmLabel: "Confirme a nova senha",
    hint: "Mínimo 12 caracteres com maiúscula, minúscula, número e símbolo.",
    mismatch: "As senhas não coincidem.",
    sameAsCurrent: "A nova senha deve ser diferente da atual.",
    cancel: "Cancelar",
    save: "Alterar senha",
    saving: "Alterando...",
  },
  feedback: {
    passkey: {
      loading: "Aguardando validação da passkey...",
      success: "Passkey ativada.",
      error: "Não foi possível ativar a passkey.",
    },
    password: {
      loading: "Alterando senha...",
      success: "Senha alterada. Faça login novamente com a nova senha.",
      error: "Não foi possível alterar a senha. Verifique a senha atual.",
    },
  },
} as const
