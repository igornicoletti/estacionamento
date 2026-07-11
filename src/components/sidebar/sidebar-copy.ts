export const sidebarCopy = {
  brand: {
    name: "Rede Monte Carlo",
    shortName: "RMC",
  },
  header: {
    openNavigation: "Alternar navegação",
  },
  profile: {
    fallbackName: "Usuário",
    fallbackRole: "Proprietário",
    developmentMode: "Modo desenvolvimento",
  },
  menu: {
    myProfile: "Meu perfil",
    settings: "Configurações",
    notifications: "Notificações",
    signOut: "Sair",
    openUserMenu: (name: string) => `${name} - abrir menu de usuário`,
  },
  dialog: {
    signOutTitle: "Encerrar sessão",
    signOutDescription:
      "Deseja realmente sair agora? Você precisará fazer login novamente para continuar.",
    signOutCancel: "Cancelar",
    signOutConfirm: "Sair",
  },
  notifications: {
    open: "Abrir notificações",
    panelTitle: "Notificações",
    markAllRead: "Marcar todas como lidas",
    updatingAll: "Atualizando...",
    unreadOnlyEmptyTitle: "Sem notificações não lidas",
    unreadOnlyEmptyDescription:
      "Tudo certo por aqui. Quando surgir algo novo, aparecerá neste painel.",
    viewAll: "Ver todas",
  },
} as const
