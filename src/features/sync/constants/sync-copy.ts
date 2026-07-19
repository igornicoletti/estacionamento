export const syncCopy = {
  blocking: {
    title: "Sincronização em andamento",
    description: "Aguarde a conclusão da sincronização. As ações da tela ficarão bloqueadas durante o processamento.",
  },
  history: {
    retryLabel: "Tentar novamente",
    loadErrorTitle: "Não foi possível carregar o histórico",
    details: {
      duration: "Duração",
      emptyValue: "—",
      end: "Fim",
      mode: "Modo",
      start: "Início",
      trigger: "Origem",
    },
    empty: {
      description: "Nenhuma execução foi registrada para esta sincronização.",
      title: "Nenhum histórico encontrado",
    },
    mode: {
      full: "Completa",
      incremental: "Incremental",
    },
    status: {
      failed: "Falhou",
      success: "Concluída",
      warning: "Concluída com alertas",
    },
    trigger: {
      automatic: "Automática",
      manual: "Manual",
    },
  },
} as const
