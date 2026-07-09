import type { UserRole } from "@/features/auth"

import { canRoleAccessCapabilities } from "./route-auth-utils"
import {
  searchableRouteDefinitions,
  type SearchableRouteDefinition,
} from "./route-definitions"

function compareDefaultRoutePriority(
  currentRoute: SearchableRouteDefinition,
  nextRoute: SearchableRouteDefinition,
) {
  return currentRoute.defaultPriority - nextRoute.defaultPriority
}

function canAccessRoute(
  route: SearchableRouteDefinition,
  role: UserRole | null | undefined,
) {
  return canRoleAccessCapabilities(role, route.requiredCapabilities)
}

export function getDefaultRouteHrefForRole(
  role: UserRole | null | undefined,
): `/${string}` | null {
  const allowedRoutes = searchableRouteDefinitions.filter((route) => {
    return canAccessRoute(route, role)
  })

  return [...allowedRoutes].sort(compareDefaultRoutePriority)[0]?.href ?? null
}
