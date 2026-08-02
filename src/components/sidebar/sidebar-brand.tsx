"use client"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { renderSidebarLink } from "./sidebar-link"
import type { SidebarBrandConfig } from "./sidebar.types"

export type SidebarBrandProps = {
  brand: SidebarBrandConfig
}

export function SidebarBrand({ brand }: SidebarBrandProps) {
  const { isMobile, state, setOpenMobile } = useSidebar()
  const logo = isMobile
    ? (brand.mobileLogo ?? brand.expandedLogo)
    : state === "collapsed"
      ? brand.collapsedLogo
      : brand.expandedLogo

  const link = renderSidebarLink({
    target: brand,
    ariaLabel: brand.label,
    onClick: () => {
      if (isMobile) {
        setOpenMobile(false)
      }
    },
    children: (
      <span aria-hidden="true" className="flex min-w-0 items-center">
        {logo}
      </span>
    ),
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          tooltip={brand.tooltip ?? brand.label}
          className="justify-center rounded-none bg-transparent px-0 hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:p-0!"
        >
          {link}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
