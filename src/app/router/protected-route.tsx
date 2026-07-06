import * as React from "react"
import { Navigate, Outlet, useLocation } from "react-router"

import { shouldBypassAuthInDev } from "@/config"
import { hasAllCapabilities, type AuthCapability } from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

import { RouteAccessDenied } from "./route-access-denied"
import {
  canProfileAccessProtectedApp,
  getAuthProfileRole,
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

  if (shouldBypassAuthInDev()) {
    return children ?? <Outlet />
  }

  if (isLoading) {
    return <RouteLoading />
  }

  if (!isAuthenticated || !canProfileAccessProtectedApp(profile)) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (
    requiredCapabilities.length > 0 &&
    !hasAllCapabilities(getAuthProfileRole(profile), requiredCapabilities)
  ) {
    return unauthorizedElement ?? <RouteAccessDenied />
  }

  return children ?? <Outlet />
}
