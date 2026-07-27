import { LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks"

import { NotificationsPopover } from "./sidebar-notifications-popover"
import { UserMenu } from "./sidebar-user-menu"

export function AppHeader() {
  const { signOut } = useAuthSession()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    void navigate(appRoutePaths.login, { replace: true })
  }

  return (
    <header className="z-10 sticky top-0 flex h-16 shrink-0 items-center gap-2 bg-background border-b">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="lg:hidden" />
        <div className="ml-auto flex items-center gap-2">
          <NotificationsPopover />
          <UserMenu />
          <AppAlertDialog
            size="sm"
            tone="destructive"
            title="Encerrar sessão"
            description="Deseja realmente sair agora? Você precisará fazer login novamente para continuar."
            actionLabel="Sair"
            pendingLabel="Saindo..."
            onAction={handleSignOut}
            trigger={
              <Button
                type="button"
                variant="destructive"
                className="hidden md:inline-flex"
              >
                <LogOutIcon data-icon="inline-start" aria-hidden="true" />
                Sair
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}
