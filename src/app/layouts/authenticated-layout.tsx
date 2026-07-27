import { ClockIcon } from "lucide-react"
import { Outlet } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppHeader, AppSidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authCopy, useAuth } from "@/features/auth"

export function AuthenticatedLayout() {
  const auth = useAuth()
  const inactivity = auth.inactivity
  const copy = authCopy.inactivity

  return (
    <>
      <SidebarProvider className="min-w-0 overflow-x-clip">
        <AppSidebar homeHref={appRoutePaths.home} />
        <SidebarInset className="min-w-0 max-w-full overflow-x-clip">
          <AppHeader />
          <Outlet />
        </SidebarInset>
      </SidebarProvider>

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
