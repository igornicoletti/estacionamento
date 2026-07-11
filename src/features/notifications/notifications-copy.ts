export const notificationsCopy = {
  page: {
    title: "Notificações",
    subtitle: "Acompanhe alertas de sistema, sincronização e segurança.",
    unreadCounter: (count: number) =>
      count === 1 ? "1 não lida" : `${count} não lidas`,
  },
  actions: {
    markAllAsRead: "Marcar todas como lidas",
    markAsRead: "Marcar como lida",
    markAsUnread: "Marcar como não lida",
    openDestination: "Abrir destino",
    openDetails: "Informações",
    retry: "Recarregar",
    updating: "Atualizando...",
    updatingAll: "Atualizando...",
    viewAll: "Ver todas",
  },
  details: {
    titleFallback: "Notificação",
    type: "Tipo",
    status: "Status",
    date: "Data",
    destination: "Destino",
    emptyDestination: "—",
  },
  filters: {
    searchPlaceholder: "Buscar notificações...",
    status: "Status",
    type: "Tipos",
  },
  empty: {
    allTitle: "Sem notificações",
    allDescription:
      "Ainda não há notificações registradas para o seu usuário.",
    unreadTitle: "Sem notificações não lidas",
    unreadDescription:
      "Tudo certo por aqui. Quando surgir algo novo, aparecerá neste painel.",
  },
  feedback: {
    loadError: "Não foi possível carregar as notificações.",
    markAsReadError: "Não foi possível marcar a notificação como lida.",
    markAsUnreadError: "Não foi possível marcar a notificação como não lida.",
    markAllAsReadError: "Não foi possível atualizar todas as notificações.",
  },
} as const
