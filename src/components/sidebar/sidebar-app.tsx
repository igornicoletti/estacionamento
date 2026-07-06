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

import { SidebarBrand } from "./sidebar-brand"
import { SidebarNavigation } from "./sidebar-navigation"
import { SidebarProfile } from "./sidebar-profile"

interface AppSidebarProps {
  homeHref: `/${string}`
}

export function AppSidebar({ homeHref, ...props }: AppSidebarProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
      {...props}
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
              onClick={toggleSidebar}
              className="bg-transparent text-sidebar-foreground hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground data-open:hover:bg-transparent data-active:bg-transparent"
            >
              <PanelLeftIcon className="rtl:rotate-180" />
              <span className="sr-only">Recolher menu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
