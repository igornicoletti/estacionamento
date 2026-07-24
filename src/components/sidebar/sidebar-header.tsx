import { LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks"

import { NotificationsPopover } from "./sidebar-notifications-popover"
import { UserMenu } from "./sidebar-user-menu"

export function AppHeader() {
  const { signOut } = useAuthSession()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    void navigate("/login", { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="lg:hidden" />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover />
        <UserMenu />
        <DestructiveConfirmDialog
          title="Encerrar sessão"
          description="Deseja realmente sair agora? Você precisará fazer login novamente para continuar."
          confirmLabel="Sair"
          onConfirm={async () => {
            await handleSignOut()
          }}
          trigger={
            <Button
              type="button"
              variant="destructive"
              className="hidden bg-destructive text-destructive-foreground md:inline-flex hover:bg-destructive/90"
            >
              <LogOutIcon />
              Sair
            </Button>
          }
        />
      </div>
    </header>
  )
}
