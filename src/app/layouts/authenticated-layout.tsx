import { ClockIcon } from "lucide-react"
import { Outlet } from "react-router"

import {
  appRouteIds,
  appRoutePaths,
} from "@/app/router/route-registry"
import { AppHeader } from "@/components/app-header"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppSidebar, SidebarLayoutProvider } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset } from "@/components/ui/sidebar"
import { authCopy, useAuth } from "@/features/auth"
import { useNotifications } from "@/features/notifications"

export function AuthenticatedLayout() {
  const auth = useAuth()
  const { unreadCount } = useNotifications()
  const inactivity = auth.inactivity
  const copy = authCopy.inactivity
  const sidebarBadge =
    unreadCount > 0
      ? {
          [appRouteIds.notifications]: {
            content: unreadCount > 99 ? "+99" : unreadCount,
            ariaLabel: `${unreadCount} notificações não lidas`,
          },
        }
      : undefined

  return (
    <>
      <SidebarLayoutProvider>
        <AppSidebar
          homeHref={appRoutePaths.home}
          {...(sidebarBadge ? { badgesByRouteId: sidebarBadge } : {})}
        />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <Outlet />
        </SidebarInset>
      </SidebarLayoutProvider>

      <AppAlertDialog
        open={inactivity.isWarningOpen}
        size="default"
        tone="warning"
        title={copy.title}
        description={copy.secondsRemaining(inactivity.secondsRemaining)}
        media={<ClockIcon aria-hidden="true" />}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                void auth.actions.logout()
              }}
            >
              {copy.signOutNow}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={inactivity.continueSession}
            >
              {copy.continueSession}
            </Button>
          </>
        }
      />
    </>
  )
}
