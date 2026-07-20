import { ClockIcon } from "lucide-react"
import { Outlet, useMatches } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppHeader, AppSidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authCopy, useAuth } from "@/features/auth"
import { WorkspaceUnitProvider } from "@/features/workspace"
import { cn } from "@/lib/utils"

type LayoutScrollMode = "document" | "content"

function getScrollMode(matches: ReturnType<typeof useMatches>): LayoutScrollMode {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const routeHandle = matches[index].handle as
      | { scrollMode?: LayoutScrollMode }
      | undefined

    if (routeHandle?.scrollMode) {
      return routeHandle.scrollMode
    }
  }

  return "document"
}

export function AuthenticatedLayout() {
  const auth = useAuth()
  const inactivity = auth.inactivity
  const copy = authCopy.inactivity
  const matches = useMatches()
  const scrollMode = getScrollMode(matches)
  const isContainedScroll = scrollMode === "content"

  return (
    <>
      <SidebarProvider
        className={cn(
          isContainedScroll ? "h-dvh overflow-hidden" : "min-h-dvh overflow-visible"
        )}
      >
        <AppSidebar homeHref={appRoutePaths.home} />
        <SidebarInset
          className={cn(
            isContainedScroll ? "min-h-0 overflow-hidden" : "min-h-dvh overflow-visible"
          )}
        >
          <AppHeader />
          <main
            className={cn(
              "animate-page-in flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-clip p-4 pb-6 md:p-6",
              isContainedScroll
                ? "overflow-y-auto overscroll-contain"
                : "overflow-visible"
            )}
          >
            <WorkspaceUnitProvider>
              <Outlet />
            </WorkspaceUnitProvider>
          </main>
        </SidebarInset>
      </SidebarProvider>

      <AppAlertDialog
        open={inactivity.isWarningOpen}
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
