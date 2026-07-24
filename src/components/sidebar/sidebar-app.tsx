import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { SidebarBrand } from "./sidebar-brand"
import { SidebarFooterText } from "./sidebar-footer"
import { SidebarNavigation } from "./sidebar-navigation"
import { SidebarProfile } from "./sidebar-profile"

interface AppSidebarProps {
  homeHref: `/${string}`
}

export function AppSidebar({ homeHref }: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0"
    >
      <SidebarHeader className="h-16 justify-center border-b bg-background px-2 py-0">
        <SidebarBrand homeHref={homeHref} />
      </SidebarHeader>
      <SidebarContent className="gap-1 py-2 group-data-[collapsible=icon]:items-center">
        <SidebarProfile />
        <SidebarNavigation />
        <div className="mt-auto hidden p-2 lg:flex">
          <SidebarTrigger className="text-sidebar-foreground/70 hover:bg-transparent! hover:text-sidebar-foreground/70 active:bg-transparent!" />
        </div>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <SidebarFooterText />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
