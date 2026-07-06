import { ChevronRightIcon, CircleIcon } from "lucide-react"
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
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNavGroup({
  label,
  items,
  activePathname,
}: SidebarNavGroupProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const hasActiveItem = items.some((item) =>
    isActiveRoute(activePathname, item.href)
  )

  function handleNavigate() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const activeItemClassName =
    "bg-background text-sidebar-accent-foreground hover:bg-background hover:text-sidebar-accent-foreground active:bg-background active:text-sidebar-accent-foreground data-open:hover:bg-background data-open:hover:text-sidebar-accent-foreground"
  const inactiveItemClassName =
    "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-foreground/12 hover:text-sidebar-foreground active:bg-sidebar-foreground/14 active:text-sidebar-foreground data-open:hover:bg-sidebar-foreground/12 data-open:hover:text-sidebar-foreground"

  return (
    <Collapsible defaultOpen={hasActiveItem} className="group/collapsible">
      <SidebarGroup className="px-4 py-0">
        <SidebarGroupLabel asChild className="group-data-[collapsible=icon]:hidden">
          <CollapsibleTrigger>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/80">{label}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const ItemIcon = routeIconById[item.id] ?? CircleIcon
                const isActive = isActiveRoute(activePathname, item.href)

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      className={`${isActive ? activeItemClassName : inactiveItemClassName} pl-3`}
                      tooltip={item.label}
                    >
                      <NavLink to={item.href} onClick={handleNavigate}>
                        <ItemIcon className={isActive ? undefined : "opacity-75 transition-opacity group-hover/menu-button:opacity-100"} />
                        <span className={isActive ? undefined : "opacity-90 transition-opacity group-hover/menu-button:opacity-100"}>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>

        <SidebarGroupContent className="hidden group-data-[collapsible=icon]:block">
          <SidebarMenu>
            {items.map((item) => {
              const ItemIcon = routeIconById[item.id] ?? CircleIcon
              const isActive = isActiveRoute(activePathname, item.href)

              return (
                <SidebarMenuItem key={`icon-${item.id}`}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    className={isActive
                      ? activeItemClassName
                      : `group ${inactiveItemClassName}`}
                  >
                    <NavLink to={item.href} onClick={handleNavigate} aria-label={item.label}>
                      <ItemIcon className={isActive ? undefined : "opacity-75 transition-opacity group-hover/menu-button:opacity-100"} />
                      <span className="sr-only">{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </Collapsible>
  )
}
