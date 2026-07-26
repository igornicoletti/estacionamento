import { Navigate, Outlet } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { canAccessProtectedApp, useAuth } from "@/features/auth"

import { canBypassRouteAccessInDev } from "../route-access"
import { RouteLoadingState } from "./route-loading-state"

export function PublicRouteGate() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <RouteLoadingState scope="page" />
  }

  if (canBypassRouteAccessInDev()) {
    return <Navigate to={appRoutePaths.home} replace />
  }

  if (auth.isAuthenticated && canAccessProtectedApp(auth.profile?.status)) {
    return <Navigate to={appRoutePaths.home} replace />
  }

  return <Outlet />
}
