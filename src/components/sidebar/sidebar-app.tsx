import type { AppRoutePath } from "@/app/router/route-registry"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { SidebarBrand } from "./sidebar-brand"
import { SidebarCollapseControl } from "./sidebar-collapse-control"
import { SidebarNavigation } from "./sidebar-navigation"
import { SidebarProfile } from "./sidebar-profile"

interface AppSidebarProps {
  homeHref: AppRoutePath
}

export function AppSidebar({ homeHref }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="h-16 bg-background">
        <SidebarBrand homeHref={homeHref} />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarNavigation />
      </SidebarContent>

      <SidebarFooter>
        <SidebarProfile />
        <SidebarCollapseControl />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
