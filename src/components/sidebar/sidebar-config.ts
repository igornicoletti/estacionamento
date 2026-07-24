import {
  BellIcon,
  Building2Icon,
  ContactRoundIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  type LucideIcon,
  UsersIcon,
} from "lucide-react"

import montecarloLogo from "@/assets/brand/montecarlo-logo.webp"
import montecarloSymbol from "@/assets/brand/montecarlo-symbol.svg"

import {
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

export const sidebarBrand = {
  shortName: "RMC",
  name: "Rede Monte Carlo",
  sidebarLogoUrl: montecarloLogo,
  symbolLogoUrl: montecarloSymbol,
}

export const routeIconById: Partial<Record<string, LucideIcon>> = {
  audit: ScrollTextIcon,
  clients: ContactRoundIcon,
  notifications: BellIcon,
  permissions: ShieldCheckIcon,
  settings: SettingsIcon,
  units: Building2Icon,
  users: UsersIcon,
}

export const navigationGroups = [
  {
    id: "records",
    label: "Cadastros",
    items: appRouteDefinitions.map(toSidebarNavigationItem),
  },
  {
    id: "security",
    label: "Segurança",
    items: appSecurityRouteDefinitions.map(toSidebarNavigationItem),
  },
  {
    id: "utilities",
    label: "Utilitários",
    items: appUtilityRouteDefinitions.map(toSidebarNavigationItem),
  },
] as const satisfies readonly SidebarNavigationGroup[]

export const notifications: readonly SidebarNotification[] = []
