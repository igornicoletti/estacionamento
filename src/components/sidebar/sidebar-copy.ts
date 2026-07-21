export const sidebarCopy = {
  brand: {
    name: "Rede Monte Carlo",
    shortName: "RMC",
  },
  header: {
    openNavigation: "Abrir navegação",
  },
  profile: {
    fallbackName: "Usuário",
    fallbackRole: "Proprietário",
    developmentMode: "Modo de desenvolvimento",
  },
  menu: {
    changePhoto: "Foto do perfil",
    myProfile: "Meu perfil",
    notifications: "Notificações",
    signOut: "Sair",
    openUserMenu: (name: string) => `${name} - abrir menu de usuário`,
  },
  dialog: {
    signOutTitle: "Sair da conta",
    signOutDescription:
      "Você tem certeza que deseja sair da sua conta? Você precisará entrar novamente para acessar o sistema.",
    signOutCancel: "Cancelar",
    signOutConfirm: "Continuar",
  },
  notifications: {
    open: "Abrir painel de notificações",
    panelTitle: "Notificações",
    markAllRead: "Marcar todas como lidas",
    updatingAll: "Atualizando todas as notificações",
    unreadOnlyEmptyTitle: "Nada de novo por aqui",
    unreadOnlyEmptyDescription:
      "Você está atualizado! Não há notificações não lidas.",
    viewAll: "Ver todas",
  },
} as const
