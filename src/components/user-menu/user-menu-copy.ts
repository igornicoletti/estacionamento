import type {
  SignOutConfirmationCopy,
  UserMenuLabels,
} from "./user-menu.types"

export const userMenuCopy = {
  fallbackName: "Usuário",
  fallbackMeta: "Perfil",
  developmentMode: "Modo de desenvolvimento",
  avatarUpdateError: "Não foi possível atualizar a foto do perfil.",
  signOut: {
    title: "Encerrar sessão",
    description:
      "Deseja realmente sair agora? Você precisará fazer login novamente para continuar.",
    actionLabel: "Sair",
    pendingLabel: "Saindo...",
  } satisfies SignOutConfirmationCopy,
  labels: {
    account: "Conta",
    changePhoto: "Foto do perfil",
    profile: "Meu perfil",
    openMenu: (name: string) => `${name} - abrir menu de usuário`,
  } satisfies UserMenuLabels,
} as const
