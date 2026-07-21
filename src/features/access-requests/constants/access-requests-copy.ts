import type { RecoveryReason } from "@/features/auth"

export const accessRequestsCopy = {
  page: {
    title: "Solicitações de acesso",
    subtitle: "Revise solicitações pendentes de recuperação de acesso com aprovação controlada e rastreável.",
  },
  actions: {
    approve: "Aprovar",
    cancel: "Cancelar",
    confirmApprove: "Aprovar solicitação",
    confirmDeny: "Negar solicitação",
    continue: "Continuar",
    deny: "Negar",
    details: "Detalhes",
    retry: "Recarregar",
  },
  filters: {
    reason: "Motivos",
  },
  dialogs: {
    approveDescription: "Crie uma senha temporária forte. No próximo acesso, o usuário deverá definir uma nova senha antes de cadastrar a passkey.",
    approveTitle: "Aprovar solicitação",
    denyDescription: "A solicitação será negada e o usuário vinculado ao CPF informado permanecerá bloqueado.",
    denyTitle: "Negar solicitação",
    temporaryPasswordHint: "Use uma senha temporária forte. Ela será usada apenas para iniciar o fluxo de recuperação.",
    temporaryPasswordLabel: "Senha temporária",
  },
  tables: {
    recovery: {
      columns: {
        createdAt: "Data/hora",
        email: "E-mail",
        phone: "Telefone",
        reason: "Motivo",
        requester: "Solicitante",
      },
      emptyDescription: "Não há solicitações de recuperação de acesso aguardando análise.",
      emptyTitle: "Nenhuma solicitação de recuperação pendente",
      filteredEmptyDescription: "Ajuste a busca para localizar uma solicitação de recuperação.",
      filteredEmptyTitle: "Nenhuma recuperação encontrada",
      searchPlaceholder: "Buscar solicitações...",
    },
  },
  details: {
    labels: {
      createdAt: "Data/hora",
      email: "E-mail",
      id: "ID",
      phone: "Telefone",
      reason: "Motivo",
    },
    recoveryDescription: "Informações da solicitação de recuperação.",
    titleFallback: "Solicitação de acesso",
  },
  feedback: {
    invalidResponse: "A resposta das solicitações de acesso é inválida.",
    loadError: "Não foi possível carregar as solicitações pendentes.",
    recovery: {
      approved: {
        error: "Não foi possível aprovar a solicitação.",
        loading: "Aprovando solicitação de recuperação...",
        success: "Solicitação aprovada. O usuário deverá trocar a senha no próximo acesso.",
      },
      denied: {
        error: "Não foi possível negar a solicitação.",
        loading: "Negando solicitação de recuperação...",
        success: "Solicitação negada. O acesso permanece bloqueado.",
      },
    },
  },
  reasonLabels: {
    attempts_blocked: "Bloqueio por tentativas",
    forgot_password: "Esqueci minha senha",
    lost_phone: "Perdi ou troquei de celular",
    other: "Outro motivo",
  } as const satisfies Record<RecoveryReason, string>,
  shared: {
    emptyValue: "—",
    unavailableSensitiveValue: "—",
  },
} as const
