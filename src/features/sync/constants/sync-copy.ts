import { type SyncResource } from "../model/sync-types"

const resourceLabels: Record<SyncResource, string> = {
  clients: "clientes",
  units: "unidades",
}

export const syncCopy = {
  actions: {
    cancel: "Cancelar",
    close: "Fechar",
    history: "Histórico",
    reload: "Recarregar",
    retry: "Tentar novamente",
    synchronize: "Sincronizar",
  },
  history: {
    title: "Histórico de sincronizações",
    description: (resource: SyncResource) =>
      `Consulte as execuções recentes de ${resourceLabels[resource]}.`,
    emptyTitle: "Nenhuma sincronização registrada",
    emptyDescription: "O histórico ainda não possui execuções.",
    errorTitle: "Não foi possível carregar o histórico",
    errorDescription: "Tente recarregar somente o histórico de sincronizações.",
  },
  dialog: {
    title: (resource: SyncResource) =>
      `Sincronizar ${resourceLabels[resource]}`,
    description: (resource: SyncResource) =>
      `A sincronização incremental atualizará os dados de ${resourceLabels[resource]} a partir do ERP.`,
    confirmTitle: "Confirme a sincronização manual",
    confirmDescription:
      "A operação não poderá ser cancelada depois de iniciada.",
    lastRunTitle: "Última sincronização",
    loadingLastRun: "Carregando a última sincronização",
    lastRunUnavailable: "Não foi possível consultar a última sincronização.",
    noPreviousRun: "Nenhuma sincronização anterior foi registrada.",
    runningTitle: "Sincronização em andamento",
    runningDescription: "Aguarde enquanto os dados são atualizados.",
    successTitle: "Sincronização concluída",
    errorTitle: "Não foi possível concluir a sincronização",
  },
  labels: {
    automatic: "Automática",
    clients: "Clientes",
    created: "Criados",
    completedAt: "Concluída em",
    duration: "Duração",
    failed: "Falhas",
    full: "Completa",
    incremental: "Incremental",
    manual: "Manual",
    mode: "Modo",
    received: "Recebidos",
    rejected: "Rejeitados",
    remaining: "Tempo restante estimado",
    status: "Status",
    trigger: "Origem",
    unchanged: "Sem alteração",
    units: "Unidades",
    unavailable: "Indisponível",
    updated: "Atualizados",
    vehicles: "Veículos",
  },
  status: {
    failed: "Falhou",
    success: "Concluída",
    warning: "Concluída com ressalvas",
  },
} as const
