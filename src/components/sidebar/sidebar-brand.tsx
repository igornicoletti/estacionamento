import { Link } from "react-router"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { sidebarBrand } from "./sidebar-config"
import { sidebarCopy } from "./sidebar-copy"

interface SidebarBrandProps {
  homeHref: `/${string}`
}

export function SidebarBrand({ homeHref }: SidebarBrandProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          to={homeHref}
          aria-label={sidebarCopy.brand.name}
          title={sidebarCopy.brand.name}
          className="flex h-14 items-center justify-center bg-transparent"
        >
          <img
            src={sidebarBrand.sidebarLogoUrl}
            alt={sidebarCopy.brand.name}
            className="h-14 w-auto object-contain group-data-[collapsible=icon]:hidden"
          />
          <img
            src={sidebarBrand.symbolLogoUrl}
            alt={sidebarCopy.brand.shortName}
            className="hidden h-14 w-auto object-contain group-data-[collapsible=icon]:block"
          />
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
