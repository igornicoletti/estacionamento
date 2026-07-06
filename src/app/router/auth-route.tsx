import { Navigate, Outlet } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import { useAuthSession } from "@/features/auth/hooks"

import { getDefaultRouteHrefForRole } from "./route-home-utils"
import { RouteLoading } from "./route-loading"
import {
  canProfileAccessProtectedApp,
  getAuthProfileRole,
} from "./route-auth-utils"

export function AuthRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthSession()

  if (shouldBypassAuthInDev()) {
    return <Outlet />
  }

  if (isLoading) {
    return <RouteLoading />
  }

  if (isAuthenticated && canProfileAccessProtectedApp(profile)) {
    return (
      <Navigate
        to={getDefaultRouteHrefForRole(getAuthProfileRole(profile))}
        replace
      />
    )
  }

  return <Outlet />
}
