import { Outlet } from "react-router"

import { getAuthProfileRole } from "@/app/router/route-auth-utils"
import { getDefaultRouteHrefForRole } from "@/app/router/route-home-utils"
import { AppHeader, AppSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuthSession } from "@/features/auth/hooks"

export function AppShell() {
  const { profile } = useAuthSession()
  const homeHref =
    getDefaultRouteHrefForRole(getAuthProfileRole(profile)) ?? "/"

  return (
    <SidebarProvider>
      <AppSidebar homeHref={homeHref} />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
