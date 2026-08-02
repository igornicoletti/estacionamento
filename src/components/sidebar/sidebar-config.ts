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
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import {
  appRouteIds,
  authenticatedRouteRegistry,
  navigationGroups as routeNavigationGroups,
} from "@/app/router/route-registry"
import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import type { AuthPermission } from "@/features/auth"

const montecarloSymbol = "/favicon.svg"

type AuthenticatedRoute = (typeof authenticatedRouteRegistry)[number]

type NavigableRoute = Extract<
  AuthenticatedRoute,
  {
    readonly href: `/${string}`
    readonly navigation: {
      readonly group: string
      readonly order: number
    }
  }
>

export type SidebarProjectRoute = {
  id: string
  href: `/${string}`
  label: string
  requiredPermissions?: readonly AuthPermission[]
}

export type SidebarProjectNavigationGroup = {
  id: string
  label: string
  items: readonly SidebarProjectRoute[]
}

function isNavigableRoute(route: AuthenticatedRoute): route is NavigableRoute {
  return "navigation" in route && "href" in route
}

const navigableRoutes = authenticatedRouteRegistry.filter(isNavigableRoute)

export const sidebarBrand = {
  name: "Rede Monte Carlo",
  expandedLogoUrl: montecarloLogo,
  collapsedLogoUrl: montecarloSymbol,
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

export const navigationGroups: readonly SidebarProjectNavigationGroup[] =
  routeNavigationGroups
    .map((group) => ({
      id: group.id,
      label: group.label,
      items: navigableRoutes
        .filter((route) => route.navigation.group === group.id)
        .sort(
          (first, second) =>
            first.navigation.order - second.navigation.order
        )
        .map<SidebarProjectRoute>((route) => ({
          id: route.id,
          href: route.href,
          label: route.label,
          ...("requiredPermissions" in route && route.requiredPermissions
            ? { requiredPermissions: route.requiredPermissions }
            : {}),
        })),
    }))
    .filter((group) => group.items.length > 0)

