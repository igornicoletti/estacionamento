import { type RecoveryReason } from "@/features/auth"

export const accessRequestsCopy = {
  page: {
    title: "Solicitações de acesso",
    subtitle: "Revise pedidos pendentes de recuperação de acesso e alteração de telefone.",
  },
  tabs: {
    recovery: "Recuperação de acesso",
    phoneChanges: "Alterações de telefone",
  },
  actions: {
    approve: "Aprovar",
    deny: "Negar",
    cancel: "Cancelar",
    confirmApprove: "Aprovar solicitação",
    confirmDeny: "Negar solicitação",
  },
  dialogs: {
    approveTitle: "Aprovar solicitação",
    denyTitle: "Negar solicitação",
    approveDescription:
      "Informe o motivo da aprovação para registrar a análise administrativa.",
    denyDescription:
      "Informe o motivo da negativa para registrar a análise administrativa.",
    reviewReasonLabel: "Motivo da análise",
    reviewReasonPlaceholder: "Descreva a decisão tomada pela administração.",
    reviewReasonHint: "Informe pelo menos 10 caracteres.",
  },
  tables: {
    recovery: {
      searchPlaceholder: "Buscar solicitações de recuperação...",
      empty: "Nenhuma solicitação de recuperação pendente.",
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
      empty: "Nenhuma alteração de telefone pendente.",
      columns: {
        name: "Usuário",
        currentPhone: "Telefone atual",
        pendingPhone: "Telefone solicitado",
        requestedAt: "Solicitado em",
      },
    },
  },
  feedback: {
    loadError: "Não foi possível carregar as solicitações pendentes.",
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
