import {
  BellIcon,
  Building2Icon,
  ContactRoundIcon,
  FileBarChartIcon,
  GaugeIcon,
  ParkingCircleIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TagsIcon,
  TicketCheckIcon,
  type LucideIcon,
  UsersIcon,
} from "lucide-react"

import {
  authenticatedRouteRegistry,
  appRouteGroupIds,
  appRouteIds,
  navigationGroups as routeNavigationGroups,
  type AppRouteGroupId,
  type AppRouteRegistryItem,
} from "@/app/router/route-registry"
import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import type { AuthPermission } from "@/features/auth"

const montecarloSymbol = "/favicon.svg"

export interface SidebarNavigationItem {
  id: string
  href: `/${string}`
  label: string
  requiredPermissions?: readonly AuthPermission[]
}

export interface SidebarNavigationGroup {
  id: string
  label?: string
  items: readonly SidebarNavigationItem[]
}

export interface SidebarNotification {
  id: string
  title: string
  description: string
  occurredAt: string
  href?: `/${string}`
}

type NavigableRoute = AppRouteRegistryItem & {
  href: `/${string}`
  navigation: NonNullable<AppRouteRegistryItem["navigation"]>
}

function hasNavigationHref(route: AppRouteRegistryItem): route is NavigableRoute {
  return "navigation" in route && "href" in route && Boolean(route.navigation && route.href)
}

function toSidebarNavigationItem(route: NavigableRoute): SidebarNavigationItem {
  return {
    href: route.href,
    id: route.id,
    label: route.label,
    requiredPermissions: route.requiredPermissions,
  }
}

export const sidebarBrand = {
  shortName: "RMC",
  name: "Rede Monte Carlo",
  sidebarLogoUrl: montecarloLogo,
  symbolLogoUrl: montecarloSymbol,
}

export const routeIconById: Partial<Record<string, LucideIcon>> = {
  [appRouteIds.audit]: ScrollTextIcon,
  [appRouteIds.clients]: ContactRoundIcon,
  [appRouteIds.home]: GaugeIcon,
  [appRouteIds.notifications]: BellIcon,
  [appRouteIds.permissions]: ShieldCheckIcon,
  [appRouteIds.prices]: TagsIcon,
  [appRouteIds.profile]: SettingsIcon,
  [appRouteIds.reports]: FileBarChartIcon,
  [appRouteIds.rules]: TicketCheckIcon,
  [appRouteIds.security]: ShieldCheckIcon,
  [appRouteIds.units]: Building2Icon,
  [appRouteIds.users]: UsersIcon,
  [appRouteIds.yard]: ParkingCircleIcon,
}

const navigableRoutes = authenticatedRouteRegistry.filter(
  hasNavigationHref
) as readonly NavigableRoute[]

const navigationItemsByGroup = navigableRoutes.reduce((groups, route) => {
    const groupId = route.navigation.group
    const items = groups.get(groupId) ?? []

    groups.set(groupId, [...items, route])

    return groups
  }, new Map<AppRouteGroupId, readonly NavigableRoute[]>())

export const navigationGroups: readonly SidebarNavigationGroup[] = routeNavigationGroups
  .map((group) => ({
    id: group.id,
    label: group.label,
    items: [...(navigationItemsByGroup.get(group.id) ?? [])]
      .sort((first, second) => {
        return (first.navigation?.order ?? 0) - (second.navigation?.order ?? 0)
      })
      .map(toSidebarNavigationItem),
  }))
  .filter((group) => group.items.length > 0)
  .filter((group) => group.id !== appRouteGroupIds.workspace || group.label?.trim())

export const notifications: readonly SidebarNotification[] = []
