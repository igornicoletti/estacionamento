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
      className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="h-16 bg-background">
        <SidebarBrand homeHref={homeHref} />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarProfile />
        <SidebarNavigation />
      </SidebarContent>

      <SidebarFooter>
        <SidebarCollapseControl />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
