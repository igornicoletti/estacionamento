import { SidebarTrigger } from "@/components/ui/sidebar"

import { sidebarCopy } from "./sidebar-copy"
import { NotificationsPopover } from "./sidebar-notifications-popover"
import { UserMenu } from "./sidebar-user-menu"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger
        className="md:hidden"
        aria-label={sidebarCopy.header.openNavigation}
      />
      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover />
        <UserMenu />
      </div>
    </header>
  )
}
