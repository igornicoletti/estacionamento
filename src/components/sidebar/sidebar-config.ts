import {
  BadgeDollarSignIcon,
  BellIcon,
  Building2Icon,
  ClipboardListIcon,
  HomeIcon,
  KeyRoundIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import montecarloSymbol from "@/assets/brand/montecarlo-symbol.svg"
import {
  appRouteIds,
  authenticatedRouteRegistry,
  navigationGroups as routeNavigationGroups,
  type AppRouteGroupId,
  type AppRouteId,
  type AppRoutePath,
  type AppRouteRegistryItem,
} from "@/app/router/route-registry"
import type { AuthPermission } from "@/features/auth"

import { sidebarCopy } from "./sidebar-copy"

export interface SidebarNavigationItem {
  id: AppRouteId
  href: AppRoutePath
  label: string
  requiredPermissions?: readonly AuthPermission[]
}

export interface SidebarNavigationGroup {
  id: AppRouteGroupId
  label: string
  items: readonly SidebarNavigationItem[]
}

export interface SidebarNotification {
  id: string
  title: string
  description: string
  occurredAt: string
  href?: AppRoutePath
}

export const sidebarBrand = {
  shortName: sidebarCopy.brand.shortName,
  name: sidebarCopy.brand.name,
  sidebarLogoUrl: montecarloLogo,
  symbolLogoUrl: montecarloSymbol,
}

export const routeIconById = {
  [appRouteIds.home]: HomeIcon,
  [appRouteIds.units]: Building2Icon,
  [appRouteIds.clients]: TruckIcon,
  [appRouteIds.prices]: BadgeDollarSignIcon,
  [appRouteIds.rules]: ClipboardListIcon,
  [appRouteIds.users]: UsersIcon,
  [appRouteIds.accessRequests]: KeyRoundIcon,
  [appRouteIds.permissions]: ShieldCheckIcon,
  [appRouteIds.audit]: ScrollTextIcon,
  [appRouteIds.notifications]: BellIcon,
  [appRouteIds.settings]: UserRoundIcon,
} as const satisfies Partial<Record<AppRouteId, LucideIcon>>

interface SidebarNavigationItemWithGroup extends SidebarNavigationItem {
  group: AppRouteGroupId
  order: number
}

const navigationItems: readonly SidebarNavigationItemWithGroup[] =
  authenticatedRouteRegistry.flatMap((route) => {
    if (!route.href || !route.navigation) {
      return []
    }

    return [
      {
        id: route.id,
        href: route.href,
        label: route.label,
        requiredPermissions: route.requiredPermissions,
        group: route.navigation.group,
        order: route.navigation.order,
      },
    ]
  })

function toSidebarNavigationItem(
  item: SidebarNavigationItemWithGroup
): SidebarNavigationItem {
  return {
    id: item.id,
    href: item.href,
    label: item.label,
    requiredPermissions: item.requiredPermissions,
  }
}

export const navigationGroups = routeNavigationGroups
  .map((group) => ({
    id: group.id,
    label: group.label,
    items: navigationItems
      .filter((item) => item.group === group.id)
      .sort((left, right) => left.order - right.order)
      .map(toSidebarNavigationItem),
  }))
  .filter((group) => group.items.length > 0) satisfies readonly SidebarNavigationGroup[]

export const notifications: readonly SidebarNotification[] = []
