import { Link } from "react-router"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { sidebarBrand } from "./sidebar-config"

interface SidebarBrandProps {
  homeHref: `/${string}`
}

export function SidebarBrand({ homeHref }: SidebarBrandProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="h-16 justify-center rounded-none bg-transparent! px-0 hover:bg-transparent! active:bg-transparent!"
        >
          <Link to={homeHref}>
            <img
              src={sidebarBrand.sidebarLogoUrl}
              alt={sidebarBrand.name}
              className="h-12 w-auto object-contain transition-none group-data-[collapsible=icon]:hidden"
            />
            <img
              src={sidebarBrand.symbolLogoUrl}
              alt={sidebarBrand.shortName}
              className="hidden size-12 object-contain transition-none group-data-[collapsible=icon]:block"
            />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
