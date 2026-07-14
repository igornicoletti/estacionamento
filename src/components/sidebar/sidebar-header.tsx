import { LogOutIcon } from "lucide-react"
import * as React from "react"

import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/features/auth"

import { sidebarCopy } from "./sidebar-copy"
import { NotificationsPopover } from "./sidebar-notifications-popover"
import { UserMenu } from "./sidebar-user-menu"

export function AppHeader() {
  const auth = useAuth()
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = React.useState(false)

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger
          className="md:hidden"
          aria-label={sidebarCopy.header.openNavigation}
        />
        <div className="ml-auto flex items-center gap-6">
          <NotificationsPopover />
          <UserMenu />
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="hidden md:inline-flex"
            onClick={() => setIsSignOutDialogOpen(true)}
          >
            <LogOutIcon aria-hidden="true" />
            {sidebarCopy.menu.signOut}
          </Button>
        </div>
      </header>

      <AppAlertDialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        media={<LogOutIcon />}
        title={sidebarCopy.dialog.signOutTitle}
        description={sidebarCopy.dialog.signOutDescription}
        cancelLabel={sidebarCopy.dialog.signOutCancel}
        actionLabel={sidebarCopy.dialog.signOutConfirm}
        onAction={() => {
          void auth.actions.logoutAsync()
        }}
      />
    </>
  )
}
