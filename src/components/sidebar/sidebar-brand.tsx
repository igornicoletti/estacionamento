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
        <SidebarMenuButton asChild size="lg" tooltip={sidebarCopy.brand.name}>
          <Link to={homeHref} aria-label={sidebarCopy.brand.name}>
            <img
              src={sidebarBrand.sidebarLogoUrl}
              alt={sidebarCopy.brand.name}
              className="h-8 max-w-44 object-contain group-data-[collapsible=icon]:hidden"
            />
            <img
              src={sidebarBrand.symbolLogoUrl}
              alt={sidebarCopy.brand.shortName}
              className="hidden size-7 object-contain group-data-[collapsible=icon]:block"
            />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
