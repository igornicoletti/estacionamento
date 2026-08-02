
import type { SignOutConfirmationCopy } from "@/components/user-menu"

export const appHeaderCopy = {
  openNavigation: "Abrir navegação",
  signOut: {
    title: "Encerrar sessão",
    description:
      "Deseja realmente sair agora? Você precisará fazer login novamente para continuar.",
    actionLabel: "Sair",
    pendingLabel: "Saindo...",
  } satisfies SignOutConfirmationCopy,
} as const
