import * as React from "react"
import { Navigate, Outlet, useLocation } from "react-router"

import { AppRouteAccessDenied } from "@/app/router/app-route-access-denied"
import { Spinner } from "@/components/ui/spinner"
import {
  canAccessProtectedApp,
  hasAllCapabilities,
  type AuthCapability,
} from "@/features/auth"
import { useAuthSession } from "@/features/auth/hooks"

interface AppProtectedRouteProps {
  children?: React.ReactNode
  requiredCapabilities?: readonly AuthCapability[]
}

export function AppProtectedRoute({
  children,
  requiredCapabilities = [],
}: AppProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading, profile } = useAuthSession()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated || !profile || !canAccessProtectedApp(profile.status)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasAllCapabilities(profile.role, requiredCapabilities)) {
    return <AppRouteAccessDenied />
  }

  return children ?? <Outlet />
}
