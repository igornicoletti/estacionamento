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
      <SidebarProvider>
        <AppSidebar homeHref={appRoutePaths.home} />
        <SidebarInset>
          <AppHeader />
          <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-clip p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>

      <AppAlertDialog
        open={inactivity.isWarningOpen}
        title={copy.title}
        description={copy.secondsRemaining(inactivity.secondsRemaining)}
        media={<ClockIcon />}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={auth.actions.logout}
            >
              {copy.signOutNow}
            </Button>
            <Button type="button" size="lg" onClick={inactivity.continueSession}>
              {copy.continueSession}
            </Button>
          </>
        }
      />
    </>
  )
}
