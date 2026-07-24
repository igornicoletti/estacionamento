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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { routeIconById, type SidebarNavigationItem } from "./sidebar-config"

interface SidebarNavGroupProps {
  label: string
  items: readonly SidebarNavigationItem[]
  activePathname: string
  className?: string
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNavGroup({
  label,
  items,
  activePathname,
  className,
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
    <SidebarGroup className={`px-3 py-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 ${className ?? ""}`}>
      <Collapsible defaultOpen={hasActiveItem} className="group/collapsible">
        <SidebarMenu className="gap-0 group-data-[collapsible=icon]:hidden">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                size="sm"
                tooltip={label.toUpperCase()}
                className="rounded-none bg-transparent px-0 uppercase tracking-normal text-sidebar-foreground/70 hover:bg-transparent hover:text-sidebar-foreground/90 active:bg-transparent active:text-sidebar-foreground/70 data-[active=false]:bg-transparent data-[active=false]:text-sidebar-foreground/70 data-[state=open]:bg-transparent data-[state=open]:text-sidebar-foreground/70"
              >
                <span>{label.toUpperCase()}</span>
                <ChevronRightIcon className="ml-auto size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenuSub className="mx-0 border-l-0 px-1 py-0">
                  {items.map((item) => {
                    const ItemIcon = routeIconById[item.id] ?? CircleIcon
                    const isActive = isActiveRoute(activePathname, item.href)

                    return (
                      <SidebarMenuSubItem key={item.id}>
                        <SidebarMenuSubButton
                          asChild
                          size="sm"
                          data-state={isActive ? "active" : undefined}
                          className="rounded-lg px-3 py-2 text-xs transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus-visible:ring-sidebar-ring data-[active=false]:bg-transparent data-[active=false]:text-sidebar-foreground/70 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:hover:bg-sidebar-primary data-[state=active]:hover:text-sidebar-primary-foreground [&>svg]:text-sidebar-foreground/40 data-[state=active]:[&>svg]:text-sidebar-primary-foreground"
                        >
                          <NavLink to={item.href} onClick={handleNavigate}>
                            <ItemIcon className='size-3' />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarMenuItem>
        </SidebarMenu>
      </Collapsible>

      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center">
        {items.map((item) => {
          const ItemIcon = routeIconById[item.id] ?? CircleIcon
          const isActive = isActiveRoute(activePathname, item.href)

          return (
            <SidebarMenuItem key={item.id} className="flex justify-center">
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                data-state={isActive ? "active" : undefined}
                className="mx-auto justify-center rounded-full text-xs font-normal text-sidebar-foreground/60 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground data-[active=false]:bg-transparent data-[active=false]:text-sidebar-foreground/60 data-[state=active]:bg-sidebar-primary data-[state=active]:text-sidebar-primary-foreground data-[state=active]:hover:bg-sidebar-primary data-[state=active]:hover:text-sidebar-primary-foreground"
              >
                <NavLink to={item.href} onClick={handleNavigate} aria-label={item.label}>
                  <ItemIcon />
                  <span className="sr-only">{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
