import { LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks"

import { sidebarCopy } from "./sidebar-copy"
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
      <SidebarTrigger
        className="md:hidden"
        aria-label={sidebarCopy.header.openNavigation}
      />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover />
        <UserMenu />
        <DestructiveConfirmDialog
          title={sidebarCopy.dialog.signOutTitle}
          description={sidebarCopy.dialog.signOutDescription}
          confirmLabel={sidebarCopy.dialog.signOutConfirm}
          onConfirm={async () => {
            await handleSignOut()
          }}
          trigger={
            <Button
              type="button"
              variant="destructive"
              className="hidden bg-destructive text-destructive-foreground md:inline-flex hover:bg-destructive/90"
              aria-label={sidebarCopy.menu.signOut}
            >
              <LogOutIcon />
              {sidebarCopy.menu.signOut}
            </Button>
          }
        />
      </div>
    </header>
  )
}
