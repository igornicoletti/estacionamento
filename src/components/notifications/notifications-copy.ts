import type { NotificationsPopoverLabels } from "./notifications.types"

export const notificationsCopy = {
  open: "Abrir painel de notificações",
  openWithUnread: (count: number) =>
    `Abrir painel de notificações, ${count} não lida${count === 1 ? "" : "s"}`,
  title: "Notificações",
  markAllRead: "Marcar todas como lidas",
  updatingAll: "Atualizando...",
  loading: "Carregando notificações",
  errorTitle: "Não foi possível carregar as notificações",
  errorDescription: "Tente novamente para atualizar o painel.",
  retry: "Tentar novamente",
  emptyTitle: "Sem notificações",
  emptyDescription:
    "Tudo certo por aqui. Novas notificações aparecerão neste painel.",
  unread: "Não lida",
  viewAll: "Ver todas",
} satisfies NotificationsPopoverLabels
