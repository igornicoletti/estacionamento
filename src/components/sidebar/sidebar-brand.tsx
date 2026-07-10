import { Link } from "react-router"

import type { AppRoutePath } from "@/app/router/route-registry"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

import { sidebarBrand } from "./sidebar-config"
import { sidebarCopy } from "./sidebar-copy"

interface SidebarBrandProps {
  homeHref: AppRoutePath
}

export function SidebarBrand({ homeHref }: SidebarBrandProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link
          to={homeHref}
          aria-label={sidebarCopy.brand.name}
          title={sidebarCopy.brand.name}
          className="data-[state=collapsed]:justify-center flex items-center gap-2 px-2 py-3 text-sm font-medium text-primary hover:bg-primary/5 focus:bg-primary/5 focus:outline-none"
        >
          <img
            src={sidebarBrand.sidebarLogoUrl}
            alt={sidebarCopy.brand.name}
            className="data-[state=collapsed]:hidden data-[state=expanded]:block h-6 w-auto"
          />
          <img
            src={sidebarBrand.symbolLogoUrl}
            alt={sidebarCopy.brand.shortName}
            className="data-[state=collapsed]:block data-[state=expanded]:hidden h-6 w-auto"
          />
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
