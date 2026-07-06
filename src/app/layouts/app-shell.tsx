import { Outlet } from "react-router"

import { getAuthProfileRole } from "@/app/router/route-auth-utils"
import { getDefaultRouteHrefForRole } from "@/app/router/route-home-utils"
import { AppHeader, AppSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks"

export function AppShell() {
  const { profile } = useAuthSession()
  const homeHref = getDefaultRouteHrefForRole(getAuthProfileRole(profile))

  return (
    <SidebarProvider>
      <AppSidebar homeHref={homeHref} />
      <SidebarInset className="flex h-svh flex-col overflow-hidden">
        <AppHeader />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
