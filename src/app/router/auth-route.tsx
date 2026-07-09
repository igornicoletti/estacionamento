import { Navigate, Outlet } from "react-router"

import { useAuthSession } from "@/features/auth/hooks"

import {
  canProfileAccessProtectedApp,
  getAuthProfileRole,
  isRouteAuthBypassEnabled,
} from "./route-auth-utils"
import { getDefaultRouteHrefForRole } from "./route-home-utils"
import { RouteLoading } from "./route-loading"

export function AuthRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthSession()

  if (isRouteAuthBypassEnabled()) {
    return <Outlet />
  }

  if (isLoading) {
    return <RouteLoading />
  }

  if (isAuthenticated && canProfileAccessProtectedApp(profile)) {
    const homeHref = getDefaultRouteHrefForRole(getAuthProfileRole(profile))

    return <Navigate to={homeHref ?? "/"} replace />
  }

  return <Outlet />
}
