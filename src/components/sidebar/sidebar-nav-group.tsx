import { ChevronRightIcon, CircleIcon } from "lucide-react"
import * as React from "react"
import { NavLink } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { routeIconById, type SidebarNavigationItem } from "./sidebar-config"

interface SidebarNavGroupProps {
  label: string
  items: readonly SidebarNavigationItem[]
  activePathname: string
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNavGroup({
  label,
  items,
  activePathname,
}: SidebarNavGroupProps) {
  const { isMobile, setOpenMobile, state } = useSidebar()
  const hasActiveItem = items.some((item) =>
    isActiveRoute(activePathname, item.href)
  )
  const [isManuallyOpen, setIsManuallyOpen] = React.useState(false)
  const isCollapsedIconMode = state === "collapsed" && !isMobile
  const isOpen = isCollapsedIconMode || hasActiveItem || isManuallyOpen

  function handleNavigate() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsManuallyOpen}
      className="group/collapsible"
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger aria-label={label} disabled={isCollapsedIconMode}>
            <span>{label}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const ItemIcon =
                  item.id in routeIconById
                    ? routeIconById[item.id as keyof typeof routeIconById]
                    : CircleIcon
                const isActive = isActiveRoute(activePathname, item.href)

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <NavLink to={item.href} onClick={handleNavigate}>
                        <ItemIcon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}
