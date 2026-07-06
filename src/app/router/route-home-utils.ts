import { shouldBypassAuthInDev } from "@/config"
import {
  hasAllCapabilities,
  type UserRole,
} from "@/features/auth"

import {
  searchableRouteDefinitions,
  type SearchableRouteDefinition,
} from "./route-definitions"

const fallbackRouteId = "settings"

function getFallbackRoute() {
  const route = searchableRouteDefinitions.find((routeDefinition) => {
    return routeDefinition.id === fallbackRouteId
  })

  if (!route) {
    throw new Error(`Rota fallback inválida: "${fallbackRouteId}".`)
  }

  return route
}

function canAccessRoute(
  route: SearchableRouteDefinition,
  role: UserRole | null | undefined
) {
  if (shouldBypassAuthInDev()) {
    return true
  }

  if (!route.requiredCapabilities || route.requiredCapabilities.length === 0) {
    return true
  }

  return hasAllCapabilities(role, route.requiredCapabilities)
}

export function getDefaultRouteHrefForRole(role: UserRole | null | undefined) {
  return (
    searchableRouteDefinitions.find((route) => canAccessRoute(route, role)) ??
    getFallbackRoute()
  ).href
}
