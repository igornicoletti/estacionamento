import { PanelLeftIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import type { AppRoutePath } from "@/app/router/route-registry"

import { SidebarBrand } from "./sidebar-brand"
import { sidebarCopy } from "./sidebar-copy"
import { SidebarNavigation } from "./sidebar-navigation"
import { SidebarProfile } from "./sidebar-profile"

interface AppSidebarProps {
  homeHref: AppRoutePath
}

export function AppSidebar({ homeHref }: AppSidebarProps) {
  const { toggleSidebar } = useSidebar()

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
        <SidebarMenu className="mt-auto p-2 pt-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              aria-label={sidebarCopy.header.openNavigation}
              onClick={toggleSidebar}
            >
              <PanelLeftIcon className="rtl:rotate-180" />
              <span>{sidebarCopy.header.openNavigation}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
