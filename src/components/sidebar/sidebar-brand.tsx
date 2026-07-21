import { Link } from "react-router"

import type { AppRoutePath } from "@/app/router/route-registry"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { sidebarBrand } from "./sidebar-config"
import { sidebarCopy } from "./sidebar-copy"

interface SidebarBrandProps {
  homeHref: AppRoutePath
}

export function SidebarBrand({ homeHref }: SidebarBrandProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip={sidebarCopy.brand.name} className="group hover:bg-transparent active:bg-transparent">
          <Link to={homeHref} aria-label={sidebarCopy.brand.name}>
            <img
              src={sidebarBrand.sidebarLogoUrl}
              alt={sidebarCopy.brand.name}
              className="w-full object-contain group-data-[collapsible=icon]:hidden group:transition group:duration-300 group:ease-in-out"
            />
            <img
              src={sidebarBrand.symbolLogoUrl}
              alt={sidebarCopy.brand.shortName}
              className="hidden w-full object-contain group-data-[collapsible=icon]:block group:transition group:duration-300 group:ease-in-out"
            />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
