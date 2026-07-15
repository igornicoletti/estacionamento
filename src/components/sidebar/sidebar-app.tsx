import type { AppRoutePath } from "@/app/router/route-registry"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { SidebarProfile } from '@/components/sidebar/sidebar-profile'
import { SidebarBrand } from "./sidebar-brand"
import { SidebarCollapseControl } from "./sidebar-collapse-control"
import { SidebarNavigation } from "./sidebar-navigation"

interface AppSidebarProps {
  homeHref: AppRoutePath
}

export function AppSidebar({ homeHref }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:border-r-0 group-data-[side=left]:border-sidebar-border/40 group-data-[side=right]:border-l group-data-[side=right]:border-sidebar-border/40"
    >
      <SidebarHeader className="h-14 bg-background backdrop-blur-sm">
        <SidebarBrand homeHref={homeHref} />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden gap-1 px-1">
        <SidebarProfile />
        <SidebarNavigation />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/30">
        <SidebarCollapseControl />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
