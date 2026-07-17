import { type RecoveryReason } from "@/features/auth"

export const accessRequestsCopy = {
  page: {
    title: "Solicitações de acesso",
    subtitle: "Revise solicitações pendentes de recuperação de acesso.",
  },
  actions: {
    approve: "Aprovar",
    deny: "Negar",
    cancel: "Cancelar",
    details: "Detalhes",
    confirmApprove: "Aprovar solicitação",
    confirmDeny: "Negar solicitação",
    retry: "Recarregar",
  },
  dialogs: {
    approveTitle: "Aprovar solicitação",
    denyTitle: "Negar solicitação",
    approveDescription:
      "Crie uma senha temporária. No próximo acesso, o usuário deverá definir uma nova senha antes de cadastrar a passkey.",
    denyDescription:
      "A solicitação será negada e o usuário vinculado ao CPF informado permanecerá bloqueado.",
    temporaryPasswordLabel: "Senha temporária",
    temporaryPasswordHint:
      "Use uma senha forte. Ela será exigida apenas para iniciar o fluxo de primeiro acesso.",
  },
  tables: {
    recovery: {
      searchPlaceholder: "Buscar solicitações de recuperação...",
      emptyTitle: "Nenhuma solicitação de recuperação pendente",
      emptyDescription:
        "Não há solicitações de recuperação de acesso aguardando análise.",
      filteredEmptyTitle: "Nenhuma recuperação encontrada",
      filteredEmptyDescription:
        "Ajuste a busca para localizar uma solicitação de recuperação.",
      columns: {
        createdAt: "Data/hora",
        reason: "Motivo",
        phone: "Telefone",
        email: "E-mail",
        description: "Descrição",
      },
    },
  },
  details: {
    titleFallback: "Solicitação de acesso",
    recoveryDescription: "Solicitação administrativa de recuperação de acesso.",
    labels: {
      id: "ID",
      createdAt: "Data/hora",
      reason: "Motivo",
      phone: "Telefone",
      email: "E-mail",
      description: "Descrição",
    },
  },
  feedback: {
    loadError: "Não foi possível carregar as solicitações pendentes.",
    invalidResponse: "A resposta das solicitações de acesso é inválida.",
    recovery: {
      approved: {
        loading: "Aprovando solicitação de recuperação...",
        success: "Solicitação aprovada. O usuário deverá trocar a senha no próximo acesso.",
        error: "Não foi possível aprovar a solicitação.",
      },
      denied: {
        loading: "Negando solicitação de recuperação...",
        success: "Solicitação negada. O acesso permanece bloqueado.",
        error: "Não foi possível negar a solicitação.",
      },
    },
  },
  shared: {
    emptyValue: "—",
    unavailableSensitiveValue: "Dado indisponível",
  },
  reasonLabels: {
    attempts_blocked: "Bloqueio por tentativas",
    forgot_password: "Esqueci minha senha",
    lost_phone: "Perdi ou troquei de celular",
    other: "Outro motivo",
  } as const satisfies Record<RecoveryReason, string>,
} as const
