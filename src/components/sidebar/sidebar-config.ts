import {
  BadgeDollarSignIcon,
  BellIcon,
  Building2Icon,
  ClipboardListIcon,
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
  appCommercialRouteDefinitions,
  appRouteDefinitions,
  appSecurityRouteDefinitions,
  appUtilityRouteDefinitions,
  type SearchableRouteDefinition,
} from "@/app/router/route-definitions"
import type { AuthCapability } from "@/features/auth"

export interface SidebarNavigationItem {
  id: string
  href: `/${string}`
  label: string
  requiredCapabilities?: readonly AuthCapability[]
}

export interface SidebarNavigationGroup {
  id: string
  label: string
  items: readonly SidebarNavigationItem[]
}

export interface SidebarNotification {
  id: string
  title: string
  description: string
  occurredAt: string
  href?: `/${string}`
}

function toSidebarNavigationItem(
  route: SearchableRouteDefinition
): SidebarNavigationItem {
  return {
    href: route.href,
    id: route.id,
    label: route.label,
    requiredCapabilities: route.requiredCapabilities,
  }
}

function findRouteDefinition(
  routes: readonly SearchableRouteDefinition[],
  id: string
) {
  const route = routes.find((candidate) => candidate.id === id)

  if (!route) {
    throw new Error(`Rota de navegação não encontrada: ${id}`)
  }

  return toSidebarNavigationItem(route)
}

export const sidebarBrand = {
  shortName: "RMC",
  name: "Rede Monte Carlo",
  sidebarLogoUrl: montecarloLogo,
  symbolLogoUrl: montecarloSymbol,
}

export const routeIconById: Partial<Record<string, LucideIcon>> = {
  audit: ScrollTextIcon,
  prices: BadgeDollarSignIcon,
  rules: ClipboardListIcon,
  clients: TruckIcon,
  notifications: BellIcon,
  permissions: ShieldCheckIcon,
  settings: UserRoundIcon,
  units: Building2Icon,
  users: UsersIcon,
}

export const navigationGroups = [
  {
    id: "records",
    label: "Cadastros",
    items: [
      findRouteDefinition(appRouteDefinitions, "units"),
      findRouteDefinition(appRouteDefinitions, "clients"),
    ],
  },
  {
    id: "commercial",
    label: "Comercial",
    items: [
      findRouteDefinition(appCommercialRouteDefinitions, "prices"),
      findRouteDefinition(appCommercialRouteDefinitions, "rules"),
    ],
  },
  {
    id: "access",
    label: "Acesso",
    items: [
      findRouteDefinition(appRouteDefinitions, "users"),
      findRouteDefinition(appSecurityRouteDefinitions, "permissions"),
    ],
  },
  {
    id: "monitoring",
    label: "Monitoramento",
    items: [
      findRouteDefinition(appSecurityRouteDefinitions, "audit"),
      findRouteDefinition(appUtilityRouteDefinitions, "notifications"),
    ],
  },
  {
    id: "utilities",
    label: "Configurações",
    items: [findRouteDefinition(appUtilityRouteDefinitions, "settings")],
  },
] as const satisfies readonly SidebarNavigationGroup[]

export const notifications: readonly SidebarNotification[] = []
