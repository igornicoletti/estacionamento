import { PanelLeftIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { sidebarCopy } from "./sidebar-copy"

export function SidebarCollapseControl() {
  const { toggleSidebar } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          aria-label={sidebarCopy.header.openNavigation}
          tooltip={sidebarCopy.header.openNavigation}
          onClick={toggleSidebar}
        >
          <PanelLeftIcon className="rtl:rotate-180" />
          <span className="sr-only">{sidebarCopy.header.openNavigation}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
