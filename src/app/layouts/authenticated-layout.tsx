import { ClockIcon } from "lucide-react"
import { Outlet, useLocation } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppHeader, AppSidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authCopy, useAuth } from "@/features/auth"
import { cn } from "@/lib"

export function AuthenticatedLayout() {
  const auth = useAuth()
  const inactivity = auth.inactivity
  const copy = authCopy.inactivity
  const location = useLocation()
  const isNaturalFlowPage =
    location.pathname === appRoutePaths.settings ||
    location.pathname === appRoutePaths.profile

  return (
    <>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar homeHref={appRoutePaths.home} />
        <SidebarInset className="min-h-0 overflow-hidden">
          <AppHeader />
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-clip p-4",
              isNaturalFlowPage ? "md:overflow-y-auto" : "md:overflow-hidden"
            )}
          >
            <Outlet />
          </div>
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
