import * as React from "react"
import { Navigate, Outlet, useLocation } from "react-router"

import { useAuthSession } from "@/features/auth/hooks"
import type { AuthCapability } from "@/features/auth"

import { RouteAccessDenied } from "./route-access-denied"
import {
  canProfileAccessProtectedApp,
  canRoleAccessCapabilities,
  getAuthProfileRole,
  isRouteAuthBypassEnabled,
} from "./route-auth-utils"
import { RouteLoading } from "./route-loading"

interface ProtectedRouteProps {
  children?: React.ReactNode
  redirectTo?: string
  requiredCapabilities?: readonly AuthCapability[]
  unauthorizedElement?: React.ReactNode
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  requiredCapabilities = [],
  unauthorizedElement,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading, profile } = useAuthSession()

  if (isRouteAuthBypassEnabled()) {
    return children ?? <Outlet />
  }

  if (isLoading) {
    return <RouteLoading />
  }

  if (!isAuthenticated || !canProfileAccessProtectedApp(profile)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (
    !canRoleAccessCapabilities(
      getAuthProfileRole(profile),
      requiredCapabilities,
    )
  ) {
    return unauthorizedElement ?? <RouteAccessDenied />
  }

  return children ?? <Outlet />
}
