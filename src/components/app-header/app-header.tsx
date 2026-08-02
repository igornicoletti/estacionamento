import * as React from "react"
import { useNavigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { NotificationsPopover } from "@/components/notifications"
import { SidebarPageHeader } from "@/components/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { useAuthSession } from "@/features/auth/hooks"

import { appHeaderCopy } from "./app-header-copy"
import { HeaderLogoutButton } from "./header-logout-button"

export type AppHeaderProps = {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}

export function AppHeader({
  leading,
  trailing,
  className,
}: AppHeaderProps) {
  const { signOut } = useAuthSession()
  const navigate = useNavigate()

  const handleSignOut = React.useCallback(async () => {
    await signOut()
    void navigate(appRoutePaths.login, { replace: true })
  }, [navigate, signOut])

  return (
    <SidebarPageHeader className={className}>
      <SidebarTrigger
        className="lg:hidden"
        aria-label={appHeaderCopy.openNavigation}
        title={appHeaderCopy.openNavigation}
      />

      {leading}

      <div className="ml-auto flex min-w-0 items-center gap-2">
        {trailing}
        <NotificationsPopover />
        <UserMenu signOutCopy={appHeaderCopy.signOut} />
        <HeaderLogoutButton
          copy={appHeaderCopy.signOut}
          onSignOut={handleSignOut}
        />
      </div>
    </SidebarPageHeader>
  )
}
