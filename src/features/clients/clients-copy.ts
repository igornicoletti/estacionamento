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
