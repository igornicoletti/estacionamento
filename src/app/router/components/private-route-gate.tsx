import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { canAccessProtectedApp, useAuth, type AuthPermission } from "@/features/auth"

import {
  canBypassRouteAccessInDev,
  getLoginRedirectState,
} from "../route-access"
import { RouteAccessDenied } from "./route-access-denied"
import { RouteLoadingState } from "./route-loading-state"

interface PrivateRouteGateProps {
  children?: ReactNode
  requiredPermissions?: readonly AuthPermission[]
}

export function PrivateRouteGate({
  children,
  requiredPermissions = [],
}: PrivateRouteGateProps) {
  const location = useLocation()
  const auth = useAuth()

  if (auth.isLoading) {
    return <RouteLoadingState scope="page" />
  }

  if (canBypassRouteAccessInDev()) {
    return children ?? <Outlet />
  }

  if (!auth.isAuthenticated || !canAccessProtectedApp(auth.profile?.status)) {
    return (
      <Navigate
        to={appRoutePaths.login}
        replace
        state={getLoginRedirectState(location)}
      />
    )
  }

  if (!auth.access.hasAllPermissions(requiredPermissions)) {
    return <RouteAccessDenied />
  }

  return children ?? <Outlet />
}
