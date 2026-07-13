import { type RecoveryReason } from "@/features/auth"

export const accessRequestsCopy = {
  page: {
    title: "Solicitações de acesso",
    subtitle:
      "Revise solicitações pendentes de recuperação de acesso e alteração de telefone.",
  },
  tabs: {
    recovery: "Recuperação de acesso",
    phoneChanges: "Alterações de telefone",
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
      "Informe o motivo da aprovação para registrar a análise administrativa.",
    denyDescription:
      "Informe o motivo da negativa para registrar a análise administrativa.",
    phoneApproveTitle: "Aprovar alteração de telefone",
    phoneDenyTitle: "Negar alteração de telefone",
    phoneApproveDescription:
      "A alteração solicitada será aplicada ao cadastro do usuário.",
    phoneDenyDescription:
      "A alteração solicitada será descartada e o telefone atual será mantido.",
    reviewReasonLabel: "Motivo da análise",
    reviewReasonPlaceholder: "Descreva a decisão tomada pela administração.",
    reviewReasonHint: "Informe pelo menos 10 caracteres.",
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
    phoneChanges: {
      searchPlaceholder: "Buscar solicitações de telefone...",
      emptyTitle: "Nenhuma alteração de telefone pendente",
      emptyDescription:
        "Não há solicitações de alteração de telefone aguardando análise.",
      filteredEmptyTitle: "Nenhuma alteração encontrada",
      filteredEmptyDescription:
        "Ajuste a busca para localizar uma solicitação de telefone.",
      columns: {
        name: "Usuário",
        currentPhone: "Telefone atual",
        pendingPhone: "Telefone solicitado",
        requestedAt: "Solicitado em",
      },
    },
  },
  details: {
    titleFallback: "Solicitação de acesso",
    recoveryDescription: "Solicitação administrativa de recuperação de acesso.",
    phoneDescription: "Solicitação administrativa de alteração de telefone.",
    labels: {
      id: "ID",
      userId: "ID do usuário",
      createdAt: "Data/hora",
      requestedAt: "Solicitado em",
      reason: "Motivo",
      phone: "Telefone",
      currentPhone: "Telefone atual",
      pendingPhone: "Telefone solicitado",
      email: "E-mail",
      name: "Usuário",
      description: "Descrição",
    },
  },
  feedback: {
    loadError: "Não foi possível carregar as solicitações pendentes.",
    invalidResponse: "A resposta das solicitações de acesso é inválida.",
    recovery: {
      approved: {
        loading: "Aprovando solicitação de recuperação...",
        success: "Solicitação aprovada.",
        error: "Não foi possível aprovar a solicitação.",
      },
      denied: {
        loading: "Negando solicitação de recuperação...",
        success: "Solicitação negada.",
        error: "Não foi possível negar a solicitação.",
      },
    },
    phoneChanges: {
      approved: {
        loading: "Aprovando alteração de telefone...",
        success: "Alteração de telefone aprovada.",
        error: "Não foi possível aprovar a alteração de telefone.",
      },
      denied: {
        loading: "Negando alteração de telefone...",
        success: "Alteração de telefone negada.",
        error: "Não foi possível negar a alteração de telefone.",
      },
    },
  },
  shared: {
    emptyValue: "—",
  },
  reasonLabels: {
    attempts_blocked: "Bloqueio por tentativas",
    forgot_password: "Esqueci minha senha",
    lost_phone: "Perdi ou troquei de celular",
    other: "Outro motivo",
  } as const satisfies Record<RecoveryReason, string>,
} as const
