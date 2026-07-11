import { ArrowUpRightIcon, FileQuestionIcon, ShieldAlertIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Link, Navigate, Outlet, useLocation } from "react-router"

import { appCopy } from "@/app/app-copy"
import { appRoutePaths } from "@/app/router/route-registry"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { shouldBypassAuthInDev } from "@/config"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { canAccessProtectedApp, type AuthPermission } from "@/features/auth"
import { useAuth } from "@/features/auth"

interface PrivateRouteGateProps {
  children?: ReactNode
  requiredPermissions?: readonly AuthPermission[]
}

function CenteredRouteState({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-64 flex-1 items-center justify-center bg-background p-6 text-foreground">
      {children}
    </section>
  )
}

export function RouteLoadingState() {
  return (
    <section
      className="flex min-h-svh items-center justify-center bg-background p-6 text-primary"
      aria-busy="true"
      aria-live="polite"
    >
      <Spinner className="size-6" aria-label={appCopy.loading.route} />
    </section>
  )
}

export function PublicRouteGate() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <RouteLoadingState />
  }

  if (shouldBypassAuthInDev()) {
    return <Navigate to={appRoutePaths.home} replace />
  }

  if (auth.isAuthenticated && canAccessProtectedApp(auth.profile?.status)) {
    return <Navigate to={appRoutePaths.home} replace />
  }

  return <Outlet />
}

export function PrivateRouteGate({
  children,
  requiredPermissions = [],
}: PrivateRouteGateProps) {
  const location = useLocation()
  const auth = useAuth()

  if (auth.isLoading) {
    return <RouteLoadingState />
  }

  if (shouldBypassAuthInDev()) {
    return children ?? <Outlet />
  }

  if (!auth.isAuthenticated || !canAccessProtectedApp(auth.profile?.status)) {
    return <Navigate to={appRoutePaths.login} replace state={{ from: location }} />
  }

  if (!auth.access.hasAllPermissions(requiredPermissions)) {
    return <RouteAccessDenied />
  }

  return children ?? <Outlet />
}

export function AuthenticatedHomeRoute() {
  const copy = appCopy.fallback.authenticatedHome

  return (
    <CenteredRouteState>
      <AppEmptyState
        className="mx-auto max-w-xl"
        title={copy.title}
        description={copy.description}
      />
    </CenteredRouteState>
  )
}

export function RouteAccessDenied() {
  const copy = appCopy.fallback.accessDenied

  return (
    <CenteredRouteState>
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={<ShieldAlertIcon />}
        title={copy.title}
        description={copy.description}
        actions={
          <Button asChild variant="link" size="sm">
            <Link to={appRoutePaths.home} replace>
              {copy.action} <ArrowUpRightIcon />
            </Link>
          </Button>
        }
      />
    </CenteredRouteState>
  )
}

export function RouteNotFound() {
  const copy = appCopy.fallback.notFound

  return (
    <section className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <AppEmptyState
        className="mx-auto max-w-xl"
        media={<FileQuestionIcon />}
        title={copy.title}
        description={copy.description}
        actions={
          <Button asChild variant="link" size="sm">
            <Link to={appRoutePaths.home} replace>
              {copy.action} <ArrowUpRightIcon />
            </Link>
          </Button>
        }
      />
    </section>
  )
}
