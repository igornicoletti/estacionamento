export const clientsCopy = {
  pages: {
    clients: {
      title: "Clientes",
      subtitle: "Consulte os clientes cadastrados no sistema.",
    },
    clientVehicles: {
      fallbackTitle: "Cliente não encontrado",
      subtitleFallback: "",
    },
  },
  actions: {
    history: "Histórico",
    sync: "Sincronizar",
    openVehicles: "Veículos",
    toggleClientVip: "Cliente VIP",
    toggleVehicleVip: "Veículo VIP",
  },
  sync: {
    historyLoadError: "Não foi possível carregar o histórico de sincronização.",
    confirmTitle: "Confirmar sincronização de clientes",
    confirmDescription:
      "Deseja iniciar a sincronização incremental de clientes e veículos com o ERP agora?",
    confirmButton: "Confirmar",
    cancelButton: "Cancelar",
    runningTitle: "Sincronização em andamento",
    runningDescription:
      "Aguarde alguns instantes. A tela será liberada automaticamente ao finalizar.",
    timeoutError: "A sincronização demorou mais do que o esperado. Tente novamente.",
    feedback: {
      success: "Sincronização concluída.",
      error: "Não foi possível sincronizar os clientes.",
      inProgress: "Já existe uma sincronização de clientes em andamento.",
    },
  },
  feedback: {
    clientVip: {
      loading: "Atualizando status VIP do cliente...",
      success: "Status VIP do cliente atualizado.",
      error: "Não foi possível atualizar o status VIP do cliente.",
    },
    vehicleVip: {
      loading: "Atualizando status VIP do veículo...",
      success: "Status VIP do veículo atualizado.",
      error: "Não foi possível atualizar o status VIP do veículo.",
    },
  },
} as const
