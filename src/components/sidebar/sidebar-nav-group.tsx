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

  return (
    <Collapsible defaultOpen={hasActiveItem} className="group/collapsible">
      <SidebarGroup className="py-0">
        <SidebarGroupLabel asChild className="group-data-[collapsible=icon]:hidden">
          <CollapsibleTrigger>
            <span className="text-[11px] uppercase">{label}</span>
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
                      className={isActive
                        ? "bg-background text-sidebar-accent-foreground hover:bg-background hover:text-sidebar-accent-foreground active:bg-background active:text-sidebar-accent-foreground data-open:hover:bg-background data-open:hover:text-sidebar-accent-foreground"
                        : "bg-transparent hover:bg-secondary hover:text-sidebar-accent-foreground active:bg-background active:text-sidebar-accent-foreground data-open:hover:bg-secondary data-open:hover:text-sidebar-accent-foreground"}
                      tooltip={item.label}
                    >
                      <NavLink to={item.href} onClick={handleNavigate}>
                        <ItemIcon className={isActive ? undefined : "opacity-40 transition-opacity group-hover/menu-button:opacity-100"} />
                        <span className={isActive ? undefined : "opacity-60 transition-opacity group-hover/menu-button:opacity-100"}>{item.label}</span>
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
                      ? "bg-background text-sidebar-accent-foreground hover:bg-background hover:text-sidebar-accent-foreground active:bg-background active:text-sidebar-accent-foreground data-open:hover:bg-background data-open:hover:text-sidebar-accent-foreground"
                      : "group bg-transparent hover:bg-secondary hover:text-sidebar-accent-foreground active:bg-background active:text-sidebar-accent-foreground data-open:hover:bg-secondary data-open:hover:text-sidebar-accent-foreground"}
                  >
                    <NavLink to={item.href} onClick={handleNavigate} aria-label={item.label}>
                      <ItemIcon className={isActive ? undefined : "opacity-60 transition-opacity group-hover/menu-button:opacity-100"} />
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
